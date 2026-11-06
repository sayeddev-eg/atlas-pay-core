# ATLAS PAY — Security & Threat Model Specification

## 1. Compliance Baseline & Threat Scope
As an enterprise FinTech platform, **ATLAS PAY** operates under zero-trust assumptions. Our security architecture adheres to the **OWASP API Security Top 10 (2023)** and industry standards for financial transaction processing.

---

## 2. Threat Vector Mitigations

| Threat | OWASP Category | ATLAS PAY Enforcement Mechanism |
| :--- | :--- | :--- |
| **BOLA (Broken Object-Level Auth)** | API1:2023 | Every data query scopes explicitly to `organization_id` extracted from cryptographically verified JWT tokens. Users cannot access cross-tenant accounts or wallets even with valid UUIDs. |
| **BFLA (Broken Function-Level Auth)** | API5:2023 | Role-Based Access Control (`RolesGuard`) strictly evaluates `MAKER`, `CHECKER`, `ORG_ADMIN`, and `SUPER_ADMIN`. An authorizer cannot approve their own initiated transfer. |
| **Double-Spending & Race Conditions** | API4:2023 | Distributed idempotency keys cached in Redis with state tracking (`PROCESSING`, `COMPLETED`, `FAILED`). Database-level pessimistic locking (`SELECT FOR UPDATE`) prevents concurrent balance overdrawing. |
| **Replay & Tampering** | API8:2023 | Webhook signatures verified via HMAC-SHA256 (`X-Atlas-Signature`) with timestamp expiration window (max 300s clock drift). |
| **Mass Assignment** | API6:2023 | `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` to reject unmapped DTO properties. |
| **Credential Stuffing & DoS** | API2:2023 / API4:2023 | IP and user-based rate limiting via Redis Throttler (`@nestjs/throttler`), exponential backoff for failed logins. |

---

## 3. Maker-Checker Segregation of Duties
Under the **Dual-Control Principle**:
- **Maker (Initiator)**: Role authorized to create a draft payment or transfer.
- **Checker (Authorizer)**: Independent role authorized to approve or reject.
- **Invariance Rule**: `transfer.initiated_by !== transfer.approved_by`. Even if a user possesses both Maker and Checker roles, the system prevents self-approval.
