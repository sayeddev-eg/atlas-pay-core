import { Injectable, Logger } from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service.js';
import { ExternalPaymentProvider } from '../providers/external-payment.provider.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class PaymentSagaCoordinator {
  private readonly logger = new Logger(PaymentSagaCoordinator.name);

  constructor(
    private ledger: LedgerService,
    private paymentProvider: ExternalPaymentProvider,
    private prisma: PrismaService,
  ) {}

  async executeDeposit(
    tenantId: string,
    userId: string,
    walletId: string,
    amount: bigint,
    idempotencyKey: string,
  ) {
    let transactionId: string;

    // الخطوة 1: حالة مبدئية (Pending) في قاعدة البيانات المحلية (Local Transaction)
    try {
      const trx = await this.ledger.createPendingTransaction(tenantId, walletId, amount, idempotencyKey);
      transactionId = trx.id;
    } catch (error) {
      throw new Error('Failed to initiate transaction locally.');
    }

    // الخطوة 2: استدعاء الخدمة الخارجية (External API Call - Without DB Locks)
    let paymentResult: any;
    try {
      paymentResult = await this.paymentProvider.chargeCard(userId, amount);
    } catch (providerError: any) {
      // الخطوة 3 (مسار الفشل): تنفيذ التعويض (SAGA Compensation - Reversal)
      this.logger.error(`Payment failed for ${transactionId}, initiating reversal.`);
      await this.ledger.markTransactionFailed(transactionId, 'EXTERNAL_PROVIDER_FAILED');
      return { status: 'FAILED', reason: providerError.message };
    }

    // الخطوة 3 (مسار النجاح): تأكيد العملية (Commit) وتحديث الرصيد ورمي الحدث في الـ Outbox
    await this.ledger.commitTransactionAndCreditWallet(
      transactionId,
      paymentResult.referenceId,
      walletId,
      amount,
      tenantId,
    );
    
    return { status: 'SUCCESS', transactionId, reference: paymentResult.referenceId };
  }
}
