import { createClient, RedisClientType } from 'redis';
import { logger } from '../../core/logger';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
    },
  }) as RedisClientType;

  redisClient.on('error', (err) => logger.error('Redis client error', { err }));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

  await redisClient.connect();
}

export function getRedisClient(): RedisClientType {
  if (!redisClient || !redisClient.isReady) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
}
