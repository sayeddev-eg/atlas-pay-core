import { Pool, PoolClient } from 'pg';
import { logger } from '../../core/logger';

let pool: Pool;

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

export async function connectDatabase(): Promise<void> {
  pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'atlas_pay',
    password: process.env.POSTGRES_PASSWORD || 'secret',
    database: process.env.POSTGRES_DB || 'atlas_pay_db',
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
  });

  // Test connection
  const client = await pool.connect();
  client.release();
}

/**
 * Execute a callback within a database transaction.
 * Auto-commits on success, auto-rollbacks on failure.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', { error });
    throw error;
  } finally {
    client.release();
  }
}

export async function query<T = any>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}
