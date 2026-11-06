import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LedgerService } from './ledger.service.js';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { EntryType, TransactionStatus } from '@prisma/client';

describe('LedgerService (Double-Entry Core Engine & Outbox)', () => {
  let ledgerService: LedgerService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(),
    };
    ledgerService = new LedgerService(mockPrisma);
  });

  const tenantId = '550e8400-e29b-41d4-a716-446655440000';
  const fromWalletId = '11111111-e29b-41d4-a716-446655440001';
  const toWalletId = '22222222-e29b-41d4-a716-446655440002';
  const idempotencyKey = 'idemp-tx-12345';

  it('should throw BadRequestException if amount is zero or negative', async () => {
    await expect(
      ledgerService.processTransfer(tenantId, idempotencyKey, fromWalletId, toWalletId, 0n, 'USD'),
    ).rejects.toThrow(BadRequestException);

    await expect(
      ledgerService.processTransfer(tenantId, idempotencyKey, fromWalletId, toWalletId, -100n, 'USD'),
    ).rejects.toThrow('Transfer amount must be greater than zero');
  });

  it('should throw BadRequestException if fromWalletId equals toWalletId', async () => {
    await expect(
      ledgerService.processTransfer(tenantId, idempotencyKey, fromWalletId, fromWalletId, 5000n, 'USD'),
    ).rejects.toThrow('Cannot transfer to the same wallet');
  });

  it('should throw BadRequestException if one or both wallets are not found or unauthorized', async () => {
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([{ id: fromWalletId, balance: 10000n, currency: 'USD' }]), // only 1 wallet returned
      };
      return callback(tx);
    });

    await expect(
      ledgerService.processTransfer(tenantId, idempotencyKey, fromWalletId, toWalletId, 5000n, 'USD'),
    ).rejects.toThrow('One or both wallets not found or unauthorized');
  });

  it('should throw BadRequestException on currency mismatch', async () => {
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([
          { id: fromWalletId, balance: 10000n, currency: 'USD' },
          { id: toWalletId, balance: 5000n, currency: 'EGP' },
        ]),
      };
      return callback(tx);
    });

    await expect(
      ledgerService.processTransfer(tenantId, idempotencyKey, fromWalletId, toWalletId, 5000n, 'USD'),
    ).rejects.toThrow('Currency mismatch between wallets');
  });

  it('should throw BadRequestException if balance is insufficient', async () => {
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([
          { id: fromWalletId, balance: 2000n, currency: 'USD' }, // only $20.00
          { id: toWalletId, balance: 5000n, currency: 'USD' },
        ]),
      };
      return callback(tx);
    });

    await expect(
      ledgerService.processTransfer(tenantId, idempotencyKey, fromWalletId, toWalletId, 5000n, 'USD'), // trying to transfer $50.00
    ).rejects.toThrow('Insufficient funds');
  });

  it('should successfully commit double-entry ledger, update balances, and create Outbox event atomically', async () => {
    const mockTxResult = {
      id: 'tx-uuid-999',
      organizationId: tenantId,
      idempotencyKey,
      type: 'TRANSFER',
      status: TransactionStatus.COMMITTED,
    };

    mockPrisma.$transaction.mockImplementation(async (callback: any, options: any) => {
      expect(options.isolationLevel).toBe('Serializable');

      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([
          { id: fromWalletId, balance: 10000n, currency: 'USD' },
          { id: toWalletId, balance: 2000n, currency: 'USD' },
        ]),
        transaction: {
          create: vi.fn().mockResolvedValue(mockTxResult),
        },
        ledgerEntry: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        wallet: {
          update: vi.fn().mockResolvedValue({}),
        },
        outboxEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
      };

      const result = await callback(tx);

      // Verify balanced double entry: 1 DEBIT and 1 CREDIT
      expect(tx.ledgerEntry.createMany).toHaveBeenCalledWith({
        data: [
          {
            organizationId: tenantId,
            transactionId: mockTxResult.id,
            walletId: fromWalletId,
            type: EntryType.DEBIT,
            amount: 5000n,
          },
          {
            organizationId: tenantId,
            transactionId: mockTxResult.id,
            walletId: toWalletId,
            type: EntryType.CREDIT,
            amount: 5000n,
          },
        ],
      });

      // Verify atomic wallet decrement and increment
      expect(tx.wallet.update).toHaveBeenCalledWith({
        where: { id: fromWalletId },
        data: { balance: { decrement: 5000n } },
      });
      expect(tx.wallet.update).toHaveBeenCalledWith({
        where: { id: toWalletId },
        data: { balance: { increment: 5000n } },
      });

      // Verify Outbox Event creation preventing Dual-Write problem
      expect(tx.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          aggregateType: 'TRANSFER',
          aggregateId: mockTxResult.id,
          eventType: 'TRANSFER_COMPLETED',
          payload: expect.objectContaining({
            transactionId: mockTxResult.id,
            fromWalletId,
            toWalletId,
            amount: '5000',
            currency: 'USD',
          }),
        }),
      });

      return result;
    });

    const res = await ledgerService.processTransfer(
      tenantId,
      idempotencyKey,
      fromWalletId,
      toWalletId,
      5000n,
      'USD',
    );

    expect(res).toEqual(mockTxResult);
  });

  it('should catch Prisma P2002 idempotency collision and throw ConflictException', async () => {
    mockPrisma.$transaction.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['idempotency_key'] },
    });

    await expect(
      ledgerService.processTransfer(tenantId, idempotencyKey, fromWalletId, toWalletId, 5000n, 'USD'),
    ).rejects.toThrow(ConflictException);
  });
});
