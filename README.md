# ATLAS PAY — Distributed FinTech Core Engine 🚀

A production-grade, distributed FinTech infrastructure backend designed with absolute consistency, zero floating-point math, and robust isolation mechanisms. Built to handle secure financial workflows, multi-tenancy, and distributed transactions without data drift or race conditions.

---

## 🏗 System Architecture

The core engine is built as a **Modular Monolith** using **NestJS**, designed for high throughput and rigorous ACID compliance.

* **Database:** PostgreSQL (Serializable Isolation Level) managed via Prisma ORM.
* **Message Broker & Outbox:** BullMQ / Kafka for event-driven asynchronous processing.
* **Caching & Idempotency:** Redis for high-performance locking and rate limiting.

---

## 🛡️ Core Engineering Pillars

* **Zero Floating-Point Math:** All financial values are strictly processed and stored as `BigInt` minor units (cents/piastres) to eliminate JavaScript precision errors.
* **Strict Multi-Tenancy Isolation:** Implemented at the Prisma Client level (Client Extensions) to guarantee tenant data is never leaked across organizations.
* **Double-Entry Equilibrium:** Ledger entries are intrinsically balanced (`Σ Debit + Σ Credit = 0`). Any system drift triggers an automatic lockdown.
* **Idempotency Engine:** Redis-backed request interceptors (`x-idempotency-key`) ensuring safe retries and absolute prevention of Double-Spending attacks.
* **Transactional Outbox Pattern:** Completely eliminates the Dual-Write problem. Database commits and event emissions are executed atomically.
* **SAGA Orchestration:** Distributed transaction management for external payment gateways, featuring automated Compensation (Reversal) workflows upon failure.
* **Maker-Checker Segregation:** Hardcoded RBAC preventing the initiator of a financial transfer from approving their own request.

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Sayed7122006/atlas-pay-core.git

# Navigate to the project directory
cd atlas-pay-core

# Install dependencies strictly
npm ci

# Setup environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start the application
npm run start:dev
```

---

## 🧪 Testing

The system maintains a rigorous automated testing suite covering unit, integration, and guard logic using Vitest:

```bash
npm run test:ci
```

---

## 👨‍💻 Author

**Sayed Ali Elkelany**
* **GitHub:** [@Sayed7122006](https://github.com/Sayed7122006)
* **Email:** elkelanysayed6@gmail.com
