# Week 7 Day 2 — Closeout Summary
Date: 2026-03-29
Track: Domain export contract v1 (lake-ready)

## Objective
- Implement the tenant-safe domain export endpoint for Club Vivo.
- Wire the export function to API Gateway and a lake-ready S3 bucket.
- Ensure admin-only execution with tenant isolation enforced in code and storage layout.

## What We Built
- `services/club-vivo/api/exports-domain/handler.js`
- `services/club-vivo/api/exports-domain/handler.test.js`
- `infra/cdk/lib/sic-api-stack.ts` (DomainExportBucket, ExportsDomainFn, route wiring)
- Tenant-scoped NDJSON export output per entity plus `manifest.json`.
- `POST /exports/domain` endpoint with admin-only enforcement.

## Tenancy / Security Guarantees
- Tenant scope is derived from verified auth context + entitlements (`tenantCtx`) only.
- Never accepts `tenant_id` / `tenantId` / `x-tenant-id` from request body, query, or headers.
- Exports write to tenant-partitioned S3 prefixes under:
  `exports/domain/<schema>/v=1/tenant_id=<TENANT_ID>/export_date=YYYY-MM-DD/run_id=<RUN_ID>/...`
- IAM is least privilege:
  - `ExportsDomainFn` has `s3:PutObject` scoped to `exports/domain/*` in the domain export bucket.
  - Domain table access is read-only (`Query/GetItem/BatchGetItem/DescribeTable`), no `Scan`.

## Commits
- `5f60445` — Week 7 Day 2: domain export endpoint handler
- `8ec19db` — Week 7 Day 2: domain export bucket + route wiring

## Validation
- `npm test --prefix services/club-vivo/api`
  - Recorded outcome: `48/48 pass`
- `npx cdk diff SicApiStack-Dev`
  - Recorded outcome: showed new `DomainExportBucket`, `ExportsDomainFn`, `POST /exports/domain` route, and scoped IAM bindings for the export lambda.

## Decisions / Notes
- Chose **NDJSON + manifest** to support early lake ingestion while keeping the export contract simple and inspectable.
- Implemented an **admin-only** export endpoint (no broad access) to reduce risk and keep controls server-side.
- S3 key conventions are explicit and tenant-bound by prefix, matching the v1 export spec.

## Next Session Starting Point
Continue Week 8 with testing and CI hardening sprint #1, extending coverage to export behavior and integration validation.
