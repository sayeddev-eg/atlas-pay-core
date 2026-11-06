--  Atlas Pay - Initial Schema Migration
--  001_initial_schema.sql
-- 1. جدول المستخدمين
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. جدول المحافظ (Wallets)
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    currency VARCHAR(3) NOT NULL,           -- مثل USD أو EGP
    balance DECIMAL(19, 4) NOT NULL DEFAULT 0.0000, -- استخدام DECIMAL لمنع أخطاء التقريب
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول العمليات (Transactions - The Orchestrator)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL, -- يمنع تكرار العملية إذا تم إرسال الطلب مرتين
    amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',   -- pending, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول القيود المحاسبية (Ledger Entries - Double Entry Core)
CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    wallet_id UUID REFERENCES wallets(id),
    amount DECIMAL(19, 4) NOT NULL, -- القيمة السالبة تعني سحب (Debit)، والموجبة إيداع (Credit)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--  فهارس (Indexes) لتسريع الاستعلامات
CREATE INDEX idx_entries_wallet_id ON entries(wallet_id);
CREATE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key);
