import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface LedgerEntry {
  id: string;
  transactionId: string;
  walletId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface BookTransferParams {
  client: PoolClient;
  transactionId: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Books a double-entry transfer between two wallets.
 * Creates a DEBIT on the source wallet and a CREDIT on the destination wallet.
 * Must be called inside an active DB transaction.
 */
export async function bookDoubleEntry(params: BookTransferParams): Promise<LedgerEntry[]> {
  const { client, transactionId, fromWalletId, toWalletId, amount, description, metadata = {} } = params;

  // ─── Lock & Debit the source wallet ─────────────────────────
  const srcResult = await client.query(
    'SELECT balance FROM wallets WHERE id = $1 FOR UPDATE',
    [fromWalletId],
  );
  const srcBalanceBefore = parseFloat(srcResult.rows[0].balance);
  const srcBalanceAfter = srcBalanceBefore - amount;

  await client.query(
    'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
    [srcBalanceAfter, fromWalletId],
  );

  // ─── Lock & Credit the destination wallet ───────────────────
  const dstResult = await client.query(
    'SELECT balance FROM wallets WHERE id = $1 FOR UPDATE',
    [toWalletId],
  );
  const dstBalanceBefore = parseFloat(dstResult.rows[0].balance);
  const dstBalanceAfter = dstBalanceBefore + amount;

  await client.query(
    'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
    [dstBalanceAfter, toWalletId],
  );

  // ─── Insert Ledger Entries ───────────────────────────────────
  const debitEntry = await client.query(
    `INSERT INTO ledger_entries
       (id, transaction_id, wallet_id, entry_type, amount, balance_before, balance_after, description, metadata)
     VALUES ($1,$2,$3,'DEBIT',$4,$5,$6,$7,$8)
     RETURNING *`,
    [uuidv4(), transactionId, fromWalletId, amount, srcBalanceBefore, srcBalanceAfter, description, JSON.stringify(metadata)],
  );

  const creditEntry = await client.query(
    `INSERT INTO ledger_entries
       (id, transaction_id, wallet_id, entry_type, amount, balance_before, balance_after, description, metadata)
     VALUES ($1,$2,$3,'CREDIT',$4,$5,$6,$7,$8)
     RETURNING *`,
    [uuidv4(), transactionId, toWalletId, amount, dstBalanceBefore, dstBalanceAfter, description, JSON.stringify(metadata)],
  );

  return [debitEntry.rows[0], creditEntry.rows[0]];
}
