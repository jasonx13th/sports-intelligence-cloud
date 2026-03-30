# Week 9 — Closeout Summary (S3 Data Lake foundations, tenant-safe)

## What shipped (narrative)
Week 9 established the **tenant-safe S3 data lake foundation** for SIC:
- A written **lake layout contract** that enforces tenant partitioning by construction.
- A secure **LakeBucket** with standard guardrails (SSL-only, encryption, no public access).
- An **event-driven ingest** path from domain exports into bronze partitions, with idempotency and least-privilege IAM.
- Operational readiness: **runbooks + metrics + alarms** for ingest reliability.

This sets up Week 10/11 (Glue/Athena) on a stable partition scheme (`tenant_id`, `dt`) with platform-grade guardrails.

---

## Key repo artifacts delivered

### Docs
- `docs/architecture/lake-layout.md`
  - canonical key contract + invariants
  - **Access Control Model v1:** App-only access (compute-only)
  - isolation proof plan
- `docs/runbooks/lake-isolation-proof.md`
- `docs/runbooks/lake-ingest-failure.md`
- `docs/runbooks/lake-access-denied.md`
- `docs/runbooks/lake-volume-anomaly.md`

### Infra (CDK)
- `infra/cdk/lib/sic-api-stack.ts`
  - Added `LakeBucket` (secure defaults) + outputs
  - Added `LakeIngestFn` + S3 event notifications (prefix/suffix filters)
  - Added lifecycle baseline for `bronze/`
  - Added log metric filters + alarms for ingest

### App code
- `services/club-vivo/api/lake-ingest/handler.js`
  - Parses export object keys, copies to bronze partition layout
  - Idempotent via `HeadObject`
  - Structured logs: success/skip/failure eventTypes
- `services/club-vivo/api/lake-ingest/handler.test.js`
  - Validates key parsing and destination mapping

---

## Branches/commits shipped (PR-ready)
1) **Day 1:** `week-9-day-1-lake-foundations`
   - `week9(day1): add tenant-safe lake bucket + layout docs`

2) **Day 2:** `week-9-day-2-lake-ingest`
   - `week9(day2): ingest domain exports into lake bronze`

3) **Day 3:** `week-9-day-3-lake-ops`
   - `week9(day3): lake ops runbooks + alarms`

---

## Verification & evidence (what you proved)

### CDK evidence gate (required for infra)
- Ran `cdk synth` / `cdk diff` with API app explicitly when needed:
  - `npx cdk diff --app "npx ts-node --prefer-ts-exts bin/sic-api.ts" SicApiStack-Dev -c env=dev --no-change-set`
- Confirmed in `cdk diff`:
  - `LakeBucket` + outputs (`LakeBucketName`, `LakeBucketArn`)
  - `LakeIngestFn` + `Custom::S3BucketNotifications`
  - MetricFilters for ingest success/failure
  - Alarms: ingest failure, no success in 24h

### Unit validation
- Ran:
  - `node services/club-vivo/api/lake-ingest/handler.test.js`
- Confirmed destination key mapping matches the lake contract.

---

## Tenancy & security check (fail closed)

### What prevents cross-tenant access
- **No request-derived tenant IDs** are used in lake paths.
- Tenant partitioning is enforced by construction in object keys:
  - `tenant_id=<TENANT_ID>` and `dt=...` are embedded in the lake key.
- Ingest derives tenant only from **internal export key path** produced by the platform export process.
- IAM is **prefix-scoped** for ingest:
  - source: `exports/domain/*` only
  - destination: `bronze/*` only
- Lake bucket is secured with:
  - block public access
  - SSL-only enforcement
  - encryption at rest

### Notes
- CDK-managed helper resources (bucket notification handler, auto-delete custom resources) appear in diffs; these are expected for dev ergonomics and not part of app role wildcards.

---

## Observability & ops (what’s in place)
- Structured ingest logs emit deterministic event types:
  - `lake_ingest_success`, `lake_ingest_failure`, `lake_ingest_skip_exists`
- CloudWatch MetricFilters + alarms:
  - ingest failure spikes (5m window)
  - “no successful ingest in 24h”
- Runbooks for:
  - ingest failures
  - AccessDenied troubleshooting
  - volume anomaly investigation

---

## What changed, why, how to validate (quick)
### What changed
- Added tenant-safe lake contract + secure lake bucket.
- Added event-driven ingest into bronze partitions with idempotency.
- Added runbooks + alarms.

### Why
- Week 10/11 analytics (Glue/Athena) needs stable partitioning and strong isolation guardrails now.
- Ops discipline reduces “invisible pipeline failures” later.

### How to validate
- CDK evidence:
  - `npx cdk diff --app "npx ts-node --prefer-ts-exts bin/sic-api.ts" SicApiStack-Dev -c env=dev --no-change-set`
- Unit test:
  - `node services/club-vivo/api/lake-ingest/handler.test.js`

---

## Next steps (Week 10)
Week 10 should build on Week 9 by making data queryable:
- Glue Catalog tables/partitions for bronze datasets
- Partition discovery on `tenant_id` + `dt`
- Minimal ETL v1 (bronze → silver), preserving tenant partitioning

---
