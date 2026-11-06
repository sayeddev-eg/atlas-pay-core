-- Atlas Pay - Initial Schema Migration
-- Double-Entry Accounting System

-- ─────────────────────────────────────────────────────────
--  Users Table
-- ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  full_name     VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status        user_status  NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
--  Wallets Table
-- ─────────────────────────────────────────────────────────
CREATE TYPE wallet_status AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');
CREATE TYPE wallet_currency AS ENUM ('EGP', 'USD', 'EUR', 'GBP');

CREATE TABLE IF NOT EXISTS wallets (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  currency    wallet_currency NOT NULL DEFAULT 'EGP',
  balance     NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  status      wallet_status NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- ─────────────────────────────────────────────────────────
--  Ledger Entries (Double-Entry Accounting)
-- ─────────────────────────────────────────────────────────
CREATE TYPE ledger_entry_type AS ENUM ('DEBIT', 'CREDIT');

CREATE TABLE IF NOT EXISTS ledger_entries (
  id             UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID               NOT NULL,  -- Groups DEBIT + CREDIT pair
  wallet_id      UUID               NOT NULL REFERENCES wallets(id),
  entry_type     ledger_entry_type  NOT NULL,
  amount         NUMERIC(20,4)      NOT NULL CHECK (amount > 0),
  balance_before NUMERIC(20,4)      NOT NULL,
  balance_after  NUMERIC(20,4)      NOT NULL,
  description    TEXT,
  metadata       JSONB              DEFAULT '{}',
  created_at     TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_wallet_id      ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_created_at     ON ledger_entries(created_at);

-- ─────────────────────────────────────────────────────────
--  Transfers Table
-- ─────────────────────────────────────────────────────────
CREATE TYPE transfer_status AS ENUM (
  'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED'
);

CREATE TABLE IF NOT EXISTS transfers (
  id                 UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key    VARCHAR(255)    UNIQUE,
  from_wallet_id     UUID            NOT NULL REFERENCES wallets(id),
  to_wallet_id       UUID            NOT NULL REFERENCES wallets(id),
  amount             NUMERIC(20,4)   NOT NULL CHECK (amount > 0),
  currency           wallet_currency NOT NULL,
  status             transfer_status NOT NULL DEFAULT 'PENDING',
  failure_reason     TEXT,
  metadata           JSONB           DEFAULT '{}',
  created_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transfers_from_wallet ON transfers(from_wallet_id);
CREATE INDEX idx_transfers_to_wallet   ON transfers(to_wallet_id);
CREATE INDEX idx_transfers_status      ON transfers(status);
CREATE INDEX idx_transfers_created_at  ON transfers(created_at);

-- ─────────────────────────────────────────────────────────
--  Fraud Rules Log
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_checks (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id   UUID        REFERENCES transfers(id),
  wallet_id     UUID        REFERENCES wallets(id),
  rule_name     VARCHAR(100) NOT NULL,
  triggered     BOOLEAN     NOT NULL DEFAULT FALSE,
  details       JSONB       DEFAULT '{}',
  checked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fraud_checks_wallet_id   ON fraud_checks(wallet_id);
CREATE INDEX idx_fraud_checks_transfer_id ON fraud_checks(transfer_id);
