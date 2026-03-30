# Runbook: Glue Crawler Failure (bronze sessions)

## 1) Trigger
- Alarm name(s): `sic-<env>-glue-crawler-failures`
- Metric(s) / threshold(s): `AWS/Glue` `CrawlerRunsFailed` >= 1 in 5 min
- Signal(s): `glue.crawler_failure`, `glue.catalog_stale`

## 2) Impact
- The bronze sessions catalog may be stale or missing new data.
- Downstream ETL and analytics may read old or incomplete partitions.
- Data integrity risk is medium: this is a catalog discovery issue, not direct data mutation.

## 3) 5-minute triage (do these first)
1) Confirm the crawler name and latest run status in CloudWatch Metrics/Glue console.
2) Check whether the crawler target path is still valid: `s3://<lake-bucket>/bronze/sessions/v=1/`.
3) If the crawler failed due to malformed records, inspect the latest Glue crawler logs in `/aws-glue/crawlers/`.

## 4) Deep dive

### Logs Insights (copy/paste)
```sql
fields @timestamp, @message, @logStream
| filter @logStream like /crawlers/
| filter @message like /ERROR|Exception|Failed|FAILURE|failed/
| sort @timestamp desc
| limit 100
```

### What “good” looks like
- The crawler run completes with `Succeeded`.
- Glue table schema is updated for new partitions under `bronze_sessions_*`.
- No `ERROR`/`Exception` appears in crawler logs for the target path.

### What “bad” looks like
- The crawler run ends in `Failed` or `Stopped`.
- Logs show invalid JSON, missing permissions, or invalid target paths.
- Glue table partitions are out of date or absent for recent S3 data.

## 5) Mitigation (stop the bleeding)
- Do not edit tenant_id values manually or accept tenant identifiers from untrusted client input.
- If the failure is caused by malformed source data, fix or remove the bad object under `bronze/sessions/v=1/` and rerun the crawler.
- If the failure is caused by S3 permissions, validate that Glue crawler role still has `s3:ListBucket`/`s3:GetObject` on the bronze prefix.
- If the crawler target path changed, update the crawler configuration and rerun it.

## 6) Manual health check
- Verify latest crawler run in Glue console: `Crawler runs` should show `Succeeded` within the expected window.
- Use AWS CLI to inspect the last run:
  - `aws glue get-crawler --name sic-club-vivo-bronze-sessions-crawler-<env>`
  - `aws glue get-crawler-metrics --crawler-name sic-club-vivo-bronze-sessions-crawler-<env>`
- Confirm new partitions exist in Glue:
  - `aws glue get-tables --database sic_lake_<env> --query 'TableList[].Name'`
  - `aws glue get-partitions --database sic_lake_<env> --table-name <bronze_sessions_table_name>`

## 7) Prevention / follow-ups
- Backlog items:
  - Add a periodic success alarm or runbook section for crawler completion if scheduling is added.
  - Improve Glue crawler logging labels to include dataset and tenant partition context.
  - Add automated tests for crawler target path and Glue table partition contract.
- Owner: data platform or analytics ops.
- Link to issue/ADR: `docs/adr/ADR-0006-repository-boundary-tenant-safe-data-access.md`
