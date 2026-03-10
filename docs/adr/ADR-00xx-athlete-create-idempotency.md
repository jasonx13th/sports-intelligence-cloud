# ADR-00xx: Idempotent Athlete Creation (Option A)

## Context
Mobile/web clients may retry requests on timeouts. Without idempotency, retries can create duplicate athletes. SIC is multi-tenant, so idempotency must be tenant-scoped.

## Decision
Use DynamoDB `TransactWriteItems` to atomically write:
1) Idempotency record: `PK=TENANT#<tenantId>`, `SK=IDEMPOTENCY#<idempotencyKey>` with conditional create
2) Athlete record: `PK=TENANT#<tenantId>`, `SK=ATHLETE#<athleteId>`

On replay, fetch the idempotency record to resolve the original `athleteId` and return the existing athlete.

## Alternatives considered
- Deterministic athleteId derived from natural keys (rejected: no stable natural key)
- Single conditional Put on athlete record (rejected: doesn’t bind retries without a stable ID)
- External idempotency store (rejected: unnecessary complexity for v1)

## Consequences
- ✅ Retry-safe creates with deterministic replay behavior
- ✅ Tenant isolation preserved by PK construction
- ❌ Extra item per create (idempotency record)
- ❌ Transaction overhead (acceptable at v1 scale)