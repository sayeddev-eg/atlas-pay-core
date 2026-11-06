import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EntryType, TransactionStatus } from '@prisma/client';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * تنفيذ عملية تحويل مالي بين محفظتين مع ضمان الـ ACID
   */
  async processTransfer(
    tenantId: string,
    idempotencyKey: string,
    fromWalletId: string,
    toWalletId: string,
    amount: bigint, // Zero Floating-Point Math: Expected in minor units (cents)
    currency: string,
  ) {
    if (amount <= 0n) throw new BadRequestException('Transfer amount must be greater than zero');
    if (fromWalletId === toWalletId) throw new BadRequestException('Cannot transfer to the same wallet');

    try {
      // استخدام Interactive Transaction مع أعلى مستوى عزل
      return await this.prisma.$transaction(async (tx) => {
        
        // 1. ترتيب المعرفات أبجدياً لمنع قفل التوقف التام (Deadlocks Prevention)
        const [firstId, secondId] = [fromWalletId, toWalletId].sort();

        // 2. تطبيق Pessimistic Locking برمجياً عبر Raw SQL
        const wallets: any[] = await tx.$queryRaw`
          SELECT id, balance, currency 
          FROM wallets 
          WHERE id IN (${firstId}::uuid, ${secondId}::uuid) 
            AND organization_id = ${tenantId}::uuid
          ORDER BY id ASC 
          FOR UPDATE;
        `;

        if (wallets.length !== 2) {
          throw new BadRequestException('One or both wallets not found or unauthorized');
        }

        const fromWallet = wallets.find((w) => w.id === fromWalletId);
        const toWallet = wallets.find((w) => w.id === toWalletId);

        if (fromWallet.currency !== currency || toWallet.currency !== currency) {
          throw new BadRequestException('Currency mismatch between wallets');
        }

        // استخدام BigInt لضمان دقة المقارنة
        if (BigInt(fromWallet.balance) < amount) {
          throw new BadRequestException('Insufficient funds');
        }

        // 3. إنشاء العملية (قاعدة البيانات سترفض فوراً إن تكرر مفتاح Idempotency)
        const transaction = await tx.transaction.create({
          data: {
            organizationId: tenantId,
            idempotencyKey,
            type: 'TRANSFER',
            status: TransactionStatus.COMMITTED,
          },
        });

        // 4. تسجيل القيد المزدوج المتوازن (Double-Entry Equilibrium)
        await tx.ledgerEntry.createMany({
          data: [
            {
              organizationId: tenantId,
              transactionId: transaction.id,
              walletId: fromWalletId,
              type: EntryType.DEBIT,
              amount: amount,
            },
            {
              organizationId: tenantId,
              transactionId: transaction.id,
              walletId: toWalletId,
              type: EntryType.CREDIT,
              amount: amount,
            },
          ],
        });

        // 5. تحديث الأرصدة (Atomically)
        await tx.wallet.update({
          where: { id: fromWalletId },
          data: { balance: { decrement: amount } },
        });

        await tx.wallet.update({
          where: { id: toWalletId },
          data: { balance: { increment: amount } },
        });

        // 6. إضافة الحدث إلى Outbox لضمان عدم حدوث Dual-Write Problem
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'TRANSFER',
            aggregateId: transaction.id,
            eventType: 'TRANSFER_COMPLETED',
            payload: {
              transactionId: transaction.id,
              fromWalletId: fromWalletId,
              toWalletId: toWalletId,
              // تحويل BigInt إلى String داخل الـ JSON لمنع فقدان الدقة
              amount: amount.toString(),
              currency: currency,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return transaction;
      }, {
        isolationLevel: 'Serializable', // يمنع تماماً هجمات الـ Phantom Reads والـ Double-Spending
        maxWait: 5000,
        timeout: 10000,
      });

    } catch (error: any) {
      // التقاط محاولة إعادة الإرسال المزدوج (Idempotency Collision)
      if (error.code === 'P2002' && (error.meta?.target?.includes('idempotency_key') || error.meta?.target?.includes('idempotencyKey'))) {
        throw new ConflictException('A transaction with this Idempotency Key is already processed or in progress.');
      }
      throw error;
    }
  }

  /**
   * الخطوة 1 في SAGA: إنشاء معاملة بحالة PENDING
   */
  async createPendingTransaction(
    tenantId: string,
    walletId: string,
    amount: bigint,
    idempotencyKey: string,
  ) {
    if (amount <= 0n) throw new BadRequestException('Transfer amount must be greater than zero');

    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, organizationId: tenantId },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found or unauthorized');
    }

    return this.prisma.transaction.create({
      data: {
        organizationId: tenantId,
        idempotencyKey,
        type: 'DEPOSIT',
        status: TransactionStatus.PENDING,
      },
    });
  }

  /**
   * خطوة التعويض (Compensation): تحديث العملية كفاشلة عند فشل المزود الخارجي
   */
  async markTransactionFailed(transactionId: string, reason: string) {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.FAILED },
    });
  }

  /**
   * الخطوة الأخيرة في SAGA: تأكيد المعاملة وشحن المحفظة
   */
  async commitTransactionAndCreditWallet(
    transactionId: string,
    referenceId: string,
    walletId?: string,
    amount?: bigint,
    tenantId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.COMMITTED },
      });

      if (walletId && amount && tenantId) {
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: amount } },
        });

        await tx.ledgerEntry.create({
          data: {
            organizationId: tenantId,
            transactionId: transaction.id,
            walletId,
            type: EntryType.CREDIT,
            amount,
          },
        });

        await tx.outboxEvent.create({
          data: {
            aggregateType: 'DEPOSIT',
            aggregateId: transaction.id,
            eventType: 'DEPOSIT_COMPLETED',
            payload: {
              transactionId: transaction.id,
              walletId,
              amount: amount.toString(),
              referenceId,
              timestamp: new Date().toISOString(),
            },
          },
        });
      }

      return transaction;
    });
  }
}
