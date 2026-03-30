# Week 10 — Closeout Summary (Glue Catalog + ETL v1 + Ops, tenant-safe)

## Week 10 outcome
Week 10 made the Week 9 lake **queryable and transformable** by introducing:
- **Glue Catalog v1** for bronze `sessions` (partitioned by `tenant_id`, `dt`)
- **ETL v1** (bronze NDJSON → silver Parquet) that preserves tenant partitions **by construction**
- **Ops readiness** (runbooks + alarms) for crawler/job failures

All changes were shipped as **3 small PRs**, merged to `main`, and branches deleted.

---

## PRs merged (source of truth)
### PR #12 — `week10(day1): glue catalog v1 (bronze sessions)`
**Shipped**
- Glue Database: `sic_lake_<env>`
- Glue Crawler: catalogs bronze sessions under:
  - `s3://<LakeBucket>/bronze/sessions/v=1/`
  - table prefix: `bronze_sessions_`
- Least-privilege crawler role:
  - `s3:ListBucket` scoped by `s3:prefix` to `bronze/sessions/v=1/…`
  - `s3:GetObject` scoped to `bronze/sessions/v=1/*`
  - Glue catalog permissions scoped to the database and its tables
- Docs:
  - `docs/architecture/glue-catalog-v1.md`
  - `docs/progress/week_10/closeoutsummary.md` (Day 1 entry)

**Why**
Make bronze data discoverable in Glue without weakening tenant isolation.

---

### PR #13 — `week10(day2): etl v1 bronze to silver (sessions)`
**Shipped**
- Glue Job: bronze → silver transform for `sessions`
- ETL code:
  - `services/club-vivo/api/lake-etl/etl.py`
  - `services/club-vivo/api/lake-etl/etl_test.py` (local unit test)
- Docs:
  - `docs/architecture/etl-v1.md`
  - `docs/progress/week_10/closeoutsummary.md` (Day 2 entry)

**Contract**
- Input (bronze): `bronze/sessions/v=1/tenant_id=.../dt=.../*.ndjson`
- Output (silver): `silver/sessions/v=1/tenant_id=.../dt=.../*.parquet`
- Partitions preserved via path-derived `tenant_id` and `dt` (no request-derived tenant id)

**IAM (least privilege)**
- Read: `bronze/sessions/v=1/*`
- Write: `silver/sessions/v=1/*`
- `s3:ListBucket` restricted via `s3:prefix` to bronze+silver folder prefixes
- Logs scoped to Glue job log groups
- No wildcard IAM in app roles

---

### PR #14 — `week10(day3): etl ops runbooks + glue alarms`
**Shipped**
- Runbooks:
  - `docs/runbooks/glue-crawler-failure.md`
  - `docs/runbooks/etl-job-failure.md`
  - `docs/runbooks/partition-mismatch.md`
- CloudWatch alarms (CDK):
  - `BronzeSessionsCrawlerFailureAlarm`
  - `BronzeToSilverSessionsJobFailureAlarm`
- Updated `docs/progress/week_10/closeoutsummary.md` (Day 3 entry)

**Why**
Make Week 10 pipeline operable: failures are visible + have response playbooks, without adding new data access paths.

---

## Tenancy / security (fail closed)
**What prevents cross-tenant access**
- No code accepts `tenant_id` from request body/query/headers.
- Tenant partitioning is enforced by construction:
  - S3 keys include `tenant_id=<TENANT_ID>` and `dt=YYYY-MM-DD`
- ETL derives `tenant_id` and `dt` from storage paths and writes silver partitioned by the same keys.
- IAM is prefix-scoped for both crawler and job roles:
  - scoped `ListBucket` via `s3:prefix`
  - scoped `GetObject/PutObject` to specific lake prefixes
- No wildcard IAM in application roles.

---

## Observability / ops
- Glue crawler failure alarm
- Glue job failure alarm
- Runbooks for:
  - crawler failure triage + safe retry
  - job failure triage + safe re-run
  - partition mismatch detection and containment guidance (tenant isolation note)

---

## Evidence gates (how Week 10 was validated)
- CDK evidence for each PR (examples):
  - `npx cdk synth --app "npx ts-node --prefer-ts-exts bin/sic-api.ts" SicApiStack-Dev -c env=dev`
  - `npx cdk diff  --app "npx ts-node --prefer-ts-exts bin/sic-api.ts" SicApiStack-Dev -c env=dev --no-change-set`
- Unit test:
  - `python services/club-vivo/api/lake-etl/etl_test.py`

---

## Notable decisions / tradeoffs
- Used a **crawler-first** approach for bronze NDJSON cataloging (faster, less brittle than hand-authored Glue tables).
- Focused ETL v1 on one dataset (`sessions`) to establish the tenant-safe pattern before expanding coverage.
- “No success in 24h” alarm was not required unless scheduling is introduced; Day 3 prioritized actionable failure alarms + runbooks.

---

## Next steps (Week 11+)
- Expand catalog + ETL coverage to additional datasets (attendance/athletes/etc.) using the same partition contract.
- Add a schedule/trigger for ETL runs if you want “no success 24h” alarms to be meaningful.
- Introduce data quality checks/metrics (record counts, schema drift alerts) per dataset.
- (Optional) Create a dedicated analytics stack if `sic-api-stack.ts` becomes too dense.
