# ATLAS PAY — Enterprise Product Requirements Document (PRD)

## 1. Executive Summary & Vision
**ATLAS PAY** is an enterprise-grade Financial Operations & Payment Orchestration Platform designed for financial institutions, multi-tenant corporate clients, and treasury operations teams. It provides a real-time, fault-tolerant backbone for multi-currency account management, double-entry ledger settlement, approval hierarchies (Maker-Checker), and risk mitigation.

---

## 2. Target Personas & Core Portals

### 2.1 Corporate Clients (Treasury & Finance Managers)
- **Portal**: Corporate Portal
- **Capabilities**:
  - Multi-currency wallet and account monitoring.
  - Domestic and cross-border payment initiation.
  - Beneficiary management with validation.
  - Real-time balances (Available vs. Pending vs. Reserved).
  - Bulk payouts via CSV/batch APIs.
  - Multi-level internal approval requests.
  - Comprehensive statements (PDF/CSV export).

### 2.2 Finance & Operations Team
- **Portal**: Operations Console
- **Capabilities**:
  - Centralized Transaction Monitoring and deep investigation.
  - Bank and Gateway Reconciliation Engine with exception handling.
  - Maker-Checker workflow authorization for high-value payments.
  - Real-time Fraud Shield & Velocity risk scoring.
  - Disputes and refund lifecycle tracking.
  - Double-entry Ledger Explorer with immutable journal inspections.

### 2.3 Platform Administrators
- **Portal**: Super Admin Console
- **Capabilities**:
  - Multi-tenant Organization and Branch hierarchy provisioning.
  - Role-Based Access Control (RBAC) and fine-grained permissions.
  - Payment Gateway Adapter configuration and webhook management.
  - System health, async worker queues (BullMQ), and audit trail analysis.

---

## 3. High-Level Feature Modules (15 Domains)
1. **Identity & Multi-Tenancy**: Organizations, branches, users, JWT + refresh rotation, MFA, RBAC.
2. **Corporate Accounts & Wallets**: Multi-currency, available vs. pending balances, account limits, freeze/unfreeze.
3. **Double-Entry Ledger Engine**: Chart of Accounts, immutable journal transactions, strict balanced entries ($\sum \text{Debit} = \sum \text{Credit}$), minor currency units (cents/piastres/fils).
4. **Payment Orchestration**: Gateway routing, lifecycle states, retries, idempotent execution.
5. **Transfers Management**: Internal transfers, corporate payouts, bulk disbursements, beneficiaries.
6. **Approval & Authorization Engine**: Maker-Checker policies, spending thresholds, multi-step signing.
7. **Payment Gateway Integration**: Multi-provider adapters, webhook signature verification, mock sandboxes.
8. **Reconciliation Engine**: Bank statement ingestion, transaction matching, variance flagging.
9. **Fraud & Risk Management**: Velocity checks, transaction risk scoring, real-time alerts.
10. **Disputes & Refund Management**: Chargebacks, dispute evidence upload, compensating reversals.
11. **Financial Reporting & Analytics**: Cash flow, settlement volumes, treasury positions.
12. **Audit & Compliance**: Tamper-evident audit logs, user activity, access telemetry.
13. **Notifications & Messaging**: Event-driven in-app alerts, webhooks, and emails.
14. **API & Developer Portal**: API key rotation, rate limits, interactive documentation.
15. **Platform Administration**: Global tenant overview, worker health, system configuration.

---

## 4. Non-Negotiable Financial Invariants
1. **No Floating Point Numbers**: All monetary amounts are handled strictly in 64-bit integers representing minor units (e.g. cents, piastres) or high-precision Decimal/BigInt.
2. **Double-Entry Equilibrium**: Every ledger entry must balance to zero ($\sum \text{Debits} - \sum \text{Credits} = 0$).
3. **Immutable Ledgers**: Records are append-only. Corrections require explicit compensating reversal entries.
4. **Strict Idempotency**: All state-mutating financial operations enforce unique `Idempotency-Key` headers stored in Redis/PostgreSQL.
5. **Concurrency Control**: Pessimistic locking (`SELECT FOR UPDATE`) or distributed locks on account balances during transfer processing.
