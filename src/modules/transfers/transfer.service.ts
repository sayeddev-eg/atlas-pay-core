import { v4 as uuidv4 } from 'uuid';
import { withTransaction, query } from '../../infrastructure/database/connection';
import { acquireWalletLocks } from '../wallets/wallet.lock';
import { bookDoubleEntry } from '../ledger/ledger.service';
import { runFraudChecks } from '../fraud-detection/fraud.service';
import { checkIdempotency, saveIdempotencyResult } from '../../core/idempotency/idempotency.service';
import { publishEvent } from '../../infrastructure/kafka/client';
import { logger } from '../../core/logger';
import { InsufficientFundsError, FraudDetectedError } from '../../core/errors/app-error';
import { Transfer, CreateTransferDTO } from './transfer.types';

/**
 * Transfer Saga Workflow:
 * 1. Idempotency Check
 * 2. Fraud Detection
 * 3. Acquire Wallet Locks (Redis)
 * 4. DB Transaction → Check Balance → Book Ledger → Update Transfer Status
 * 5. Release Locks
 * 6. Publish Event to Kafka
 */
export class TransferService {
  async createTransfer(dto: CreateTransferDTO): Promise<Transfer> {
    const idempotencyKey = dto.idempotencyKey;

    // ── Step 1: Idempotency Check ────────────────────────────────
    if (idempotencyKey) {
      const cached = await checkIdempotency<Transfer>(idempotencyKey);
      if (cached?.response) {
        logger.info(`Idempotent response returned for key: ${idempotencyKey}`);
        return cached.response;
      }
    }

    let releaseLocks: (() => Promise<void>) | null = null;

    try {
      // ── Step 2: Fraud Detection ────────────────────────────────
      const fraudResult = await runFraudChecks({
        fromWalletId: dto.fromWalletId,
        amount: dto.amount,
      });

      if (fraudResult.blocked) {
        throw new FraudDetectedError(fraudResult.reason!);
      }

      // ── Step 3: Create Transfer Record (PENDING) ────────────────
      const transferId = uuidv4();
      const [transfer] = await query<Transfer>(
        `INSERT INTO transfers
           (id, idempotency_key, from_wallet_id, to_wallet_id, amount, currency, status, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7)
         RETURNING *`,
        [
          transferId,
          idempotencyKey ?? null,
          dto.fromWalletId,
          dto.toWalletId,
          dto.amount,
          dto.currency ?? 'EGP',
          JSON.stringify(dto.metadata ?? {}),
        ],
      );

      // ── Step 4: Acquire Distributed Locks ──────────────────────
      releaseLocks = await acquireWalletLocks([dto.fromWalletId, dto.toWalletId]);

      // ── Step 5: DB Transaction ─────────────────────────────────
      const completed = await withTransaction(async (client) => {
        // Check balance
        const srcResult = await client.query(
          'SELECT balance FROM wallets WHERE id = $1 AND status = $2 FOR UPDATE',
          [dto.fromWalletId, 'ACTIVE'],
        );

        if (srcResult.rows.length === 0) throw new Error('Source wallet not found or frozen');

        const balance = parseFloat(srcResult.rows[0].balance);
        if (balance < dto.amount) throw new InsufficientFundsError();

        // Update status to PROCESSING
        await client.query(
          `UPDATE transfers SET status = 'PROCESSING', updated_at = NOW() WHERE id = $1`,
          [transferId],
        );

        // Book double-entry ledger
        await bookDoubleEntry({
          client,
          transactionId: transferId,
          fromWalletId: dto.fromWalletId,
          toWalletId: dto.toWalletId,
          amount: dto.amount,
          description: `Transfer ${transferId}`,
          metadata: dto.metadata,
        });

        // Mark COMPLETED
        const [updated] = (await client.query(
          `UPDATE transfers SET status = 'COMPLETED', updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [transferId],
        )).rows as Transfer[];

        return updated;
      });

      // ── Step 6: Release Locks ────────────────────────────────────
      await releaseLocks();
      releaseLocks = null;

      // ── Step 7: Publish Domain Event ─────────────────────────────
      await publishEvent('atlas-pay.transfers', {
        eventType: 'TRANSFER_COMPLETED',
        transferId: completed.id,
        fromWalletId: dto.fromWalletId,
        toWalletId: dto.toWalletId,
        amount: dto.amount,
        currency: dto.currency,
        timestamp: new Date().toISOString(),
      });

      if (idempotencyKey) {
        await saveIdempotencyResult(idempotencyKey, 'COMPLETED', completed);
      }

      logger.info(`Transfer COMPLETED: ${completed.id}`);
      return completed;
    } catch (error) {
      if (releaseLocks) await releaseLocks();

      if (idempotencyKey) {
        await saveIdempotencyResult(idempotencyKey, 'FAILED');
      }

      logger.error('Transfer FAILED', { error, dto });
      throw error;
    }
  }

  async getTransferById(id: string): Promise<Transfer> {
    const [transfer] = await query<Transfer>(
      'SELECT * FROM transfers WHERE id = $1',
      [id],
    );
    if (!transfer) throw new Error(`Transfer ${id} not found`);
    return transfer;
  }
}

export const transferService = new TransferService();
