# Runbook: Glue Partition / Contract Mismatch

## 1) Trigger
- Alarm name(s): none directly; use this runbook when Glue catalog partitions do not match the lake contract.
- Signal(s): `glue.partition_mismatch`, `lake.catalog_consistency_failure`

## 2) Impact
- Queries and downstream ETL may return incomplete or incorrect results.
- Tenant-specific data isolation can be violated if partitions are missing or misnamed.
- Data integrity risk is high if the lake contract is broken and the wrong partitions are read.

## 3) 5-minute triage (do these first)
1) Confirm the expected partition contract: `tenant_id=<tenantId>/dt=<YYYY-MM-DD>` under the correct table.
2) Check Glue table partition metadata and S3 object layout for bronze/silver session prefixes.
3) Determine whether the mismatch is caused by crawler schema discovery, ETL write path, or stale partition metadata.

## 4) Deep dive

### Logs Insights (copy/paste)
```sql
fields @timestamp, @message, tenantId, dt, @logStream
| filter @message like /partition|schema|contract|v=1|tenant_id|dt/
| sort @timestamp desc
| limit 200
```

### What “good” looks like
- Glue partitions exist for every expected `tenant_id` and `dt` combination.
- S3 objects are nested under `bronze/sessions/v=1/tenant_id=<tenantId>/dt=<YYYY-MM-DD>/` and `silver/sessions/v=1/tenant_id=<tenantId>/dt=<YYYY-MM-DD>/`.
- The Glue table schema aligns with the lake contract and does not include unpartitioned or unscoped paths.

### What “bad” looks like
- Glue partitions are missing or use the wrong key names.
- Objects are written to the wrong prefix, such as `tenant_id=` missing or `dt=` not present.
- The crawler has inferred an incorrect schema due to nested JSON or malformed path structure.

## 5) Mitigation (stop the bleeding)
- Do not fix partition names by manually querying tenant IDs from client input.
- If the issue is crawler-related, rerun the crawler after correcting the S3 path or Glue table definition.
- If the issue is ETL output path-related, fix the job arguments and rerun the ETL job.
- If the issue is stale metadata, delete the bad partition metadata and refresh the Glue catalog rather than rerunning ETL blindly.

## 6) Manual health check
- Confirm partitions from Glue:
  - `aws glue get-tables --database sic_lake_<env> --query 'TableList[].Name'`
  - `aws glue get-partitions --database sic_lake_<env> --table-name <bronze_sessions_table_name>`
  - `aws glue get-partitions --database sic_lake_<env> --table-name <silver_sessions_table_name>`
- Confirm S3 layout:
  - `aws s3 ls s3://<lake-bucket>/bronze/sessions/v=1/`
  - `aws s3 ls s3://<lake-bucket>/silver/sessions/v=1/`
  - `aws s3 ls s3://<lake-bucket>/silver/sessions/v=1/tenant_id=<tenantId>/dt=<YYYY-MM-DD>/`
- Verify that no data is accessible outside the tenant partition contract.

## 7) Prevention / follow-ups
- Backlog items:
  - Add an automated catalog consistency check between Glue partitions and S3 prefixes.
  - Add unit tests for lake contract path validation and partition formatting.
  - Document the partition contract clearly in `docs/architecture/` and link from Glue job/runbook docs.
- Owner: data platform or analytics ops.
- Link to issue/ADR: `docs/adr/ADR-0006-repository-boundary-tenant-safe-data-access.md`
