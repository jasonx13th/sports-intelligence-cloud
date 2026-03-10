# Week 3 — Day 2 Unified Closeout Summary

## What we built

### A) SIC domain table provisioned (CDK)
- Added **tenant-partitioned SIC domain DynamoDB table**:
  - Table: `sic-domain-<env>` (verified: `sic-domain-dev`)
  - Keys: `PK` (string), `SK` (string)
  - Billing: `PAY_PER_REQUEST`
- Added stack output: `SicDomainTableName-<env>`

### B) API wiring for domain table
- Injected `SIC_DOMAIN_TABLE` into API Lambdas (notably `/test-tenant`)
- Deterministic fail-closed for misconfig:
  - Missing env var → `500 misconfig_missing_env`

### C) Least-privilege IAM (no Scan)
- Removed CDK “grantReadData” to avoid accidentally granting `dynamodb:Scan`
- Added explicit allow-list actions **scoped to domain table ARN**:
  - Read: `Query`, `GetItem`, `BatchGetItem`, `DescribeTable`
  - Write (for idempotent create): `PutItem`, `TransactWriteItems`
- Confirmed via `cdk diff` that **Scan is not granted**

### D) Tenant-safe athlete list (Query + pagination)
- Implemented `list_athletes` path using DynamoDB Query:
  - `PK = TENANT#<tenantId>`
  - `begins_with(SK, "ATHLETE#")`
- Pagination:
  - `nextToken = base64(json(LastEvaluatedKey))`
  - invalid token → deterministic `400 invalid_next_token`
- Normalized list output to clean JSON objects:
  - `{ athleteId, displayName, createdAt, updatedAt }` (no `{S: ...}` maps, no PK/SK leakage)

### E) Idempotent athlete create (Option A: TransactWrite)
- Implemented `create_athlete` using `TransactWriteItems`:
  1) Idempotency record:
     - `PK = TENANT#<tenantId>`
     - `SK = IDEMPOTENCY#<idempotencyKey>`
     - conditional put (must not exist)
  2) Athlete record:
     - `PK = TENANT#<tenantId>`
     - `SK = ATHLETE#<athleteId>`
- Replay behavior:
  - First create → `201`, `replayed=false`
  - Replay same key → `200`, `replayed=true`, same `athleteId`
- Hardened replay detection:
  - Uses `ReturnCancellationReasons` to avoid masking non-idempotency transaction failures

---

## Files changed (high-level)
- `infra/cdk/lib/sic-api-stack.ts`
- `services/club-vivo/api/_lib/athlete-repository.js`
- `services/club-vivo/api/test-tenant/handler.js`
- `docs/architecture/tenancy-model.md`
- `docs/adr/*`
- `.a_PROGRESS/Q&A's/Questions_answers.md`

---

## Key decisions (architecture)
- **Tenant identity source of truth** remains entitlements via `buildTenantContext(event)`; never accept tenantId from client input.
- **Tenant isolation by construction** in DynamoDB:
  - `PK = TENANT#<tenantId>` + entity-prefixed `SK`
- **No Scan permissions** on tenant domain table to reduce footguns and enforce Query-first design.
- **Idempotent create** implemented with tenant-scoped idempotency record + transaction (Option A).

---

## Validation evidence run
- `npx aws-cdk synth` ✅
- `npx aws-cdk diff SicApiStack-Dev` ✅ (confirmed table + env + IAM actions; no Scan)
- `npx aws-cdk deploy SicApiStack-Dev` ✅
- Live API validation ✅
  - `list_athletes` returns `200` and tenant-scoped results
  - `create_athlete` returns `replayed=false` on first create
  - replay with same `Idempotency-Key` returns `replayed=true` + same athleteId
  - list returns normalized JSON items

---

## Observability / Security / Cost notes
- Observability:
  - Structured logs include `requestId`, `userId`, `tenantId`, `code`, `statusCode`
- Security:
  - IAM is least-privilege and scoped to domain table ARN
  - Removed `Scan` to reduce accidental cross-tenant leakage patterns
- Cost:
  - DynamoDB `PAY_PER_REQUEST` suitable for early stage
  - Watch for hot partitions on very large tenants; consider sharding or GSIs later

---

## Next session starting point (Week 3 Day 3)
- Promote prototype ops into real endpoints:
  - `POST /athletes`, `GET /athletes`, `GET /athletes/{athleteId}`
- Add CloudWatch metric filters/alarms for:
  - transaction failures (`dynamodb_transaction_failed`)
  - idempotency replays
- Runbook entry for:
  - `misconfig_missing_env`
  - idempotency behavior + troubleshooting

---

## Certification mapping
- **DVA-C02:** CDK deploy workflow, Lambda env + least-privilege IAM, DynamoDB Query patterns, transactions for idempotency, troubleshooting with logs/diff.
- **MLA-C01:** Tenant-safe data modeling foundations supporting later feature pipelines and governance.
- **AIF-C01:** Deterministic behavior, guardrails (fail-closed), and trust patterns for production AI systems.

---