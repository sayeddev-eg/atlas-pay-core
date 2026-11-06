import { PoolClient } from 'pg';
import { getRedisClient } from '../../infrastructure/redis/client';
import { WalletLockedError } from '../../core/errors/app-error';
import { logger } from '../../core/logger';

const LOCK_TTL_SECONDS = 30;
const LOCK_PREFIX = 'wallet:lock:';

/**
 * Acquires a distributed Redis lock on one or more wallets.
 * Wallets are always locked in a sorted order to prevent deadlocks.
 */
export async function acquireWalletLocks(walletIds: string[]): Promise<() => Promise<void>> {
  const redis = getRedisClient();
  // Sort to avoid deadlocks
  const sorted = [...new Set(walletIds)].sort();
  const acquired: string[] = [];

  for (const id of sorted) {
    const key = `${LOCK_PREFIX}${id}`;
    const result = await redis.set(key, 'locked', {
      NX: true,
      EX: LOCK_TTL_SECONDS,
    });

    if (!result) {
      // Release already acquired locks
      await releaseWalletLocks(acquired);
      throw new WalletLockedError(id);
    }
    acquired.push(id);
    logger.debug(`Lock acquired on wallet: ${id}`);
  }

  // Return a release function
  return () => releaseWalletLocks(acquired);
}

async function releaseWalletLocks(walletIds: string[]): Promise<void> {
  const redis = getRedisClient();
  for (const id of walletIds) {
    await redis.del(`${LOCK_PREFIX}${id}`);
    logger.debug(`Lock released on wallet: ${id}`);
  }
}

/**
 * Checks if a wallet has sufficient balance for a debit operation.
 * Must be called within a transaction with a row-level lock.
 */
export async function checkSufficientBalance(
  client: PoolClient,
  walletId: string,
  amount: number,
): Promise<{ balance: number }> {
  const result = await client.query(
    'SELECT balance FROM wallets WHERE id = $1 FOR UPDATE',
    [walletId],
  );

  if (result.rows.length === 0) {
    throw new Error(`Wallet ${walletId} not found`);
  }

  const balance = parseFloat(result.rows[0].balance);
  if (balance < amount) {
    throw new Error('Insufficient funds'); // Will be caught by transfer saga
  }

  return { balance };
}
