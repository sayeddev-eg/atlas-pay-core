import { query } from '../../infrastructure/database/connection';
import { getRedisClient } from '../../infrastructure/redis/client';
import { logger } from '../../core/logger';

interface FraudCheckInput {
  fromWalletId: string;
  amount: number;
}

interface FraudCheckResult {
  blocked: boolean;
  reason?: string;
  triggeredRules: string[];
}

const VELOCITY_WINDOW_SECONDS = 3600;   // 1 hour
const VELOCITY_MAX_TRANSFERS = 10;
const VELOCITY_MAX_AMOUNT = 100_000;    // EGP
const SINGLE_TX_LIMIT = 50_000;        // EGP

/**
 * Runs all fraud detection rules against a pending transfer.
 * Rules are independent and evaluated in parallel.
 */
export async function runFraudChecks(input: FraudCheckInput): Promise<FraudCheckResult> {
  const [velocityCount, velocityAmount, largeAmount] = await Promise.all([
    checkVelocityCount(input.fromWalletId),
    checkVelocityAmount(input.fromWalletId),
    checkLargeTransaction(input.amount),
  ]);

  const triggeredRules: string[] = [];
  if (velocityCount.triggered) triggeredRules.push('VELOCITY_COUNT');
  if (velocityAmount.triggered) triggeredRules.push('VELOCITY_AMOUNT');
  if (largeAmount.triggered) triggeredRules.push('LARGE_TRANSACTION');

  const blocked = triggeredRules.length > 0;
  const reason = blocked ? `Rules triggered: ${triggeredRules.join(', ')}` : undefined;

  if (blocked) {
    logger.warn(`Fraud detected on wallet ${input.fromWalletId}`, { triggeredRules, amount: input.amount });
  }

  return { blocked, reason, triggeredRules };
}

/**
 * Rule 1: More than N transfers in the last hour
 */
async function checkVelocityCount(walletId: string) {
  const redis = getRedisClient();
  const key = `fraud:velocity:count:${walletId}`;
  const count = await redis.incr(key);
  await redis.expire(key, VELOCITY_WINDOW_SECONDS);
  return { triggered: count > VELOCITY_MAX_TRANSFERS };
}

/**
 * Rule 2: Total amount transferred in the last hour exceeds limit
 */
async function checkVelocityAmount(walletId: string) {
  const result = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM transfers
     WHERE from_wallet_id = $1
       AND status = 'COMPLETED'
       AND created_at > NOW() - INTERVAL '1 hour'`,
    [walletId],
  );
  const total = parseFloat(result[0]?.total ?? '0');
  return { triggered: total > VELOCITY_MAX_AMOUNT };
}

/**
 * Rule 3: Single transaction exceeds the max single-tx limit
 */
async function checkLargeTransaction(amount: number) {
  return { triggered: amount > SINGLE_TX_LIMIT };
}
