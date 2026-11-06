import { getRedisClient } from '../../infrastructure/redis/client';
import { logger } from '../logger';
import { IdempotencyConflictError } from '../errors/app-error';

export type IdempotencyStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IdempotencyRecord<T = unknown> {
  status: IdempotencyStatus;
  response?: T;
  createdAt: string;
}

const TTL = Number(process.env.IDEMPOTENCY_TTL_SECONDS) || 86_400; // 24h

/**
 * Checks if a request with the given key was already processed.
 * If processing → throws IdempotencyConflictError.
 * If completed  → returns the cached response.
 * If not found  → marks as PROCESSING and returns null.
 */
export async function checkIdempotency<T>(
  key: string,
): Promise<IdempotencyRecord<T> | null> {
  const redis = getRedisClient();
  const cacheKey = `idempotency:${key}`;
  const existing = await redis.get(cacheKey);

  if (!existing) {
    // Mark as PROCESSING to prevent concurrent duplicate requests
    const record: IdempotencyRecord = { status: 'PROCESSING', createdAt: new Date().toISOString() };
    await redis.setEx(cacheKey, TTL, JSON.stringify(record));
    return null;
  }

  const record = JSON.parse(existing) as IdempotencyRecord<T>;

  if (record.status === 'PROCESSING') {
    throw new IdempotencyConflictError(key);
  }

  logger.info(`Idempotency cache hit for key: ${key}`, { status: record.status });
  return record;
}

/**
 * Saves the final result (success or failure) for a given idempotency key.
 */
export async function saveIdempotencyResult<T>(
  key: string,
  status: 'COMPLETED' | 'FAILED',
  response?: T,
): Promise<void> {
  const redis = getRedisClient();
  const cacheKey = `idempotency:${key}`;
  const record: IdempotencyRecord<T> = {
    status,
    response,
    createdAt: new Date().toISOString(),
  };
  await redis.setEx(cacheKey, TTL, JSON.stringify(record));
}
