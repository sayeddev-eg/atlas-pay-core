import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentSagaCoordinator } from './payment-saga.service.js';

describe('PaymentSagaCoordinator (Distributed SAGA Orchestration)', () => {
  let sagaCoordinator: PaymentSagaCoordinator;
  let mockLedger: any;
  let mockProvider: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockLedger = {
      createPendingTransaction: vi.fn(),
      markTransactionFailed: vi.fn(),
      commitTransactionAndCreditWallet: vi.fn(),
    };
    mockProvider = {
      chargeCard: vi.fn(),
    };
    mockPrisma = {};

    sagaCoordinator = new PaymentSagaCoordinator(mockLedger, mockProvider, mockPrisma);
  });

  const tenantId = 'org-uuid-1';
  const userId = 'user-uuid-1';
  const walletId = 'wallet-uuid-1';
  const amount = 15000n; // $150.00
  const idempotencyKey = 'deposit-key-1';

  it('should successfully complete SAGA deposit workflow (Happy Path)', async () => {
    mockLedger.createPendingTransaction.mockResolvedValue({ id: 'trx-1' });
    mockProvider.chargeCard.mockResolvedValue({ referenceId: 'ext_ref_123', status: 'SUCCESS' });
    mockLedger.commitTransactionAndCreditWallet.mockResolvedValue({ id: 'trx-1', status: 'COMMITTED' });

    const result = await sagaCoordinator.executeDeposit(tenantId, userId, walletId, amount, idempotencyKey);

    expect(result).toEqual({
      status: 'SUCCESS',
      transactionId: 'trx-1',
      reference: 'ext_ref_123',
    });

    expect(mockLedger.createPendingTransaction).toHaveBeenCalledWith(tenantId, walletId, amount, idempotencyKey);
    expect(mockProvider.chargeCard).toHaveBeenCalledWith(userId, amount);
    expect(mockLedger.commitTransactionAndCreditWallet).toHaveBeenCalledWith('trx-1', 'ext_ref_123', walletId, amount, tenantId);
    expect(mockLedger.markTransactionFailed).not.toHaveBeenCalled();
  });

  it('should trigger SAGA Compensation (Reversal) when external payment provider fails', async () => {
    mockLedger.createPendingTransaction.mockResolvedValue({ id: 'trx-2' });
    mockProvider.chargeCard.mockRejectedValue(new Error('Card declined by issuing bank'));
    mockLedger.markTransactionFailed.mockResolvedValue({});

    const result = await sagaCoordinator.executeDeposit(tenantId, userId, walletId, amount, idempotencyKey);

    expect(result).toEqual({
      status: 'FAILED',
      reason: 'Card declined by issuing bank',
    });

    // Compensation check
    expect(mockLedger.markTransactionFailed).toHaveBeenCalledWith('trx-2', 'EXTERNAL_PROVIDER_FAILED');
    expect(mockLedger.commitTransactionAndCreditWallet).not.toHaveBeenCalled();
  });
});
