# Runbook — Domain Exports (Club Vivo)

## Purpose
Operational guide for producing **tenant-partitioned domain exports** for analytics/ML.

Exports are written to S3 in a lake-ready layout and are governed by the **Domain Export Spec v1**:
- `docs/exports/domain-export-spec-v1.md`

## Security / tenancy invariants (non-negotiable)
- Export scope is derived from verified auth + entitlements (`tenantCtx`) only.
- The system does **not** accept `tenant_id` / `tenantId` / `x-tenant-id` from request body/query/headers.
- Outputs are written under an S3 prefix partitioned by `tenant_id=...`.

## How to run an export

### Endpoint
`POST /exports/domain`

**Auth:** Cognito JWT required.
**Authorization:** Admin-only (`tenantCtx.role === "admin"`). Non-admin receives 403.

### Example (curl)
```bash
curl -X POST "$CLUB_VIVO_API_URL/exports/domain" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{}"
```

### Response
- `201` with JSON body containing a `manifest`:
  - `export_run_id`
  - `exported_at`
  - `tenant_id`
  - `export_date`
  - `schema_counts`
  - `object_keys`

## Output locations (S3)
Bucket: `sic-domain-exports-<env>-<account>-<region>`

NDJSON per entity:
- `exports/domain/session/v=1/tenant_id=<TENANT_ID>/export_date=YYYY-MM-DD/run_id=<RUN_ID>/part-00000.ndjson`
- `exports/domain/club/v=1/tenant_id=<TENANT_ID>/export_date=YYYY-MM-DD/run_id=<RUN_ID>/part-00000.ndjson`
- `exports/domain/team/v=1/tenant_id=<TENANT_ID>/export_date=YYYY-MM-DD/run_id=<RUN_ID>/part-00000.ndjson`
- `exports/domain/membership/v=1/tenant_id=<TENANT_ID>/export_date=YYYY-MM-DD/run_id=<RUN_ID>/part-00000.ndjson`

Manifest:
- `exports/domain/manifest/v=1/tenant_id=<TENANT_ID>/export_date=YYYY-MM-DD/run_id=<RUN_ID>/manifest.json`

## Validation checklist (after a run)
1. Confirm `201` response and capture:
   - `manifest.export_run_id`, `manifest.export_date`, `manifest.object_keys.*`
2. In S3, verify all expected keys exist for the run.
3. Download and inspect `manifest.json`:
   - counts are present
   - keys are tenant-partitioned: `tenant_id=<TENANT_ID>`
4. Spot-check one NDJSON file:
   - each line is valid JSON
   - record envelope fields exist: `schema_name`, `schema_version`, `tenant_id`, `export_run_id`, `exported_at`
5. Tenant safety:
   - confirm prefix includes the authoritative tenant id from `tenantCtx` (not user input)

## Common failures and remediation

### 403 Forbidden (admin required)
**Cause:** caller is not an admin.
**Fix:** ensure the user is in the admin role for that tenant (entitlements).

### 500 platform.misconfig.missing_env
**Cause:** Lambda missing required env vars (`DOMAIN_EXPORT_BUCKET`, `SIC_DOMAIN_TABLE`).
**Fix:** verify CDK stack sets env vars for `ExportsDomainFn` and redeploy.

### AccessDenied on S3 PutObject
**Cause:** IAM policy too tight / wrong bucket / wrong prefix.
**Fix:** confirm `ExportsDomainFn` role has `s3:PutObject` to `.../exports/domain/*` for the domain export bucket.

### DynamoDB throttling / timeouts
**Cause:** bursty reads or large tenant dataset.
**Fix:** rerun export; consider pagination limits tuning. If persistent, evaluate adding incremental export strategy.

## Observability
Signals:
- Success log event: `domain_export_completed`
- Error logs: `ERROR` with `eventType="handler_error"` (from platform wrapper)

Alarms:
- Export failures alarm (errors > 0)
- No-success alarm (no `domain_export_completed` events in a time window)
