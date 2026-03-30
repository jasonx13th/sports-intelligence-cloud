# SIC Data Lake Layout (Tenant-Safe Contract)

## Purpose
Define the S3 layout + rules that enforce tenant isolation by construction.

## Buckets
- Export bucket: <name/stack output> (producer outputs, manifest-based)
- Lake bucket: <name/stack output> (bronze/silver/gold, analytics-ready)



## Access Control Model (v1)
Model A (App-only): Only SIC compute roles (Lambdas/ETL jobs) access the lake. No human interactive browsing of tenant prefixes in v1.

### App-only details
- Lake access is granted only to application compute roles, not to developer or user console roles in v1.
- No direct bucket-level browsing of tenant-prefixed paths is permitted in the access model.
- Tenant isolation is enforced by the canonical key contract and by server-side control of tenantId.

## Object Key Contract
Canonical form:
s3://<lake-bucket>/<layer>/<dataset>/v=<n>/tenant_id=<TENANT_ID>/dt=YYYY-MM-DD/<file>

Where:
- layer ∈ {bronze, silver, gold}
- dataset is a stable, documented dataset name (e.g., sessions, attendance, athletes)
- v=<n> is the schema version for the dataset contract
- TENANT_ID is derived server-side from verified auth context + entitlements (never from request input)
- dt is either event date or ingest date (choose one per dataset and document it)

## Required Invariants (Fail Closed)
1) Tenant scope comes only from verified auth context + entitlements.
2) Services MUST NOT accept tenant_id/tenantId from body/query/headers.
3) Data access is prefix-scoped (no list-then-filter).
4) Every write includes tenant_id + dt partitions.
5) Schema is versioned with v=<n> and evolution rules are documented.

## Example Keys
- bronze/sessions/v=1/tenant_id=ORG#999/dt=2026-03-30/sessions.ndjson
- bronze/attendance/v=1/tenant_id=COACH#123/dt=2026-03-30/attendance.ndjson
- silver/sessions/v=1/tenant_id=ORG#999/dt=2026-03-30/sessions.parquet
- gold/metrics_session_summary/v=1/tenant_id=ORG#999/dt=2026-03-30/summary.parquet

## Proof Plan (Isolation)
- Attempt to read/list another tenant’s prefix using the application role must fail with AccessDenied.
- Unit/integration test asserts key builders use tenantCtx.tenantId only (no request-derived tenant inputs).
