# ATLAS PAY — System Architecture Specification

## 1. Architectural Style: Modular Monolith
To deliver uncompromising financial data integrity without premature microservices complexity, **ATLAS PAY** adopts a **Modular Monolith** architecture with an asynchronous Worker subsystem. 

### Core Design Principles:
1. **Loose Coupling, High Cohesion**: Every business domain (Identity, Ledger, Transfers, Risk) is encapsulated in an isolated NestJS Module with clearly defined public service interfaces.
2. **ACID Transactions over Distributed Transactions**: Financial mutations occur within database transactions utilizing PostgreSQL row-level locks (`SELECT FOR UPDATE`), eliminating partial failure states and distributed rollback nightmares.
3. **Transactional Outbox Pattern**: Asynchronous side effects (event streams, notifications, webhook broadcasts) are committed in the *same* database transaction as the financial ledger, guaranteed to be processed by background workers (BullMQ) with at-least-once delivery semantics.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│   ┌───────────────────────┬──────────────────────┬──────────────────┐  │
│   │   Corporate Portal    │  Operations Console  │  Admin Console   │  │
│   └───────────────────────┴──────────────────────┴──────────────────┘  │
│                           React + TypeScript + Tailwind                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST / WebSockets
┌───────────────────────────────────▼────────────────────────────────────┐
│                             API LAYER                                  │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Global Middlewares: Helmet, CORS, RateLimiter, RequestTracing  │   │
│   │ Guards: AuthGuard (JWT), TenancyGuard, RolesGuard (RBAC)       │   │
│   │ Interceptors: IdempotencyInterceptor, AuditInterceptor         │   │
│   │ Pipes: Strict ValidationPipe (Zod / class-validator)          │   │
│   └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                      DOMAIN MODULES (NestJS)                           │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │ Identity/Tenancy │ │ Accounts/Wallets │ │ Double-Entry Ledger    │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │ Transfers (Saga) │ │ Maker-Checker App│ │ Fraud / Risk Shield    │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │ Payment Gateways │ │ Reconciliation   │ │ Audit & Compliance     │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                      INFRASTRUCTURE & PERSISTENCE                      │
│   ┌───────────────────────────┐     ┌──────────────────────────────┐   │
│   │   PostgreSQL + Prisma     │     │      Redis (In-Memory)       │   │
│   │ • Multi-tenant Data       │     │ • Distributed Locks (Redlock)│   │
│   │ • Balanced Journal Entries│     │ • Idempotency Cache          │   │
│   │ • Transactional Outbox    │     │ • BullMQ Worker Queues       │   │
│   └───────────────────────────┘     └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Anatomy of a High-Integrity Financial Transfer

When a Corporate Client issues a Transfer request:
1. **Idempotency Gate**: The `IdempotencyInterceptor` checks `Idempotency-Key` in Redis. If currently processing, it responds with `409 Conflict`. If already completed, it returns the cached response immediately.
2. **Authentication & Tenancy Scoping**: `TenancyGuard` verifies that the authenticated user belongs to the organization owning the source account.
3. **Risk & Fraud Evaluation**: The `RiskEngine` calculates velocity metrics (e.g. cumulative volume in the last hour). If high risk, it trips a flag for compliance review.
4. **Approval Check (Maker-Checker)**: If the transaction exceeds the organization's policy threshold (e.g. > $10,000), it transitions to `PENDING_APPROVAL` status and notifies designated Authorizers.
5. **Database Transaction Execution**:
   - Acquires pessimistic lock on source and destination wallet rows.
   - Verifies `available_balance >= transfer_amount`.
   - Debits source wallet balance; Credits destination wallet balance.
   - Writes immutable `ledger_transaction` and corresponding balanced `ledger_entries` (Debit & Credit).
   - Writes `outbox_events` row: `transfer.completed`.
   - Commits PostgreSQL transaction.
6. **Async Dispatch (Worker)**:
   - BullMQ picks up the outbox event.
   - Pushes real-time WebSocket notification to UI.
   - Dispatches webhook payloads to subscribed partner APIs.
