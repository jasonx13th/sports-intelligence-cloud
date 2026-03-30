# Runbook: Glue ETL Job Failure (bronze → silver sessions)

## 1) Trigger
- Alarm name(s): `sic-<env>-glue-etl-job-failures`
- Metric(s) / threshold(s): `AWS/Glue` `JobsFailed` >= 1 in 5 min on job `sic-club-vivo-bronze-to-silver-sessions-<env>`
- Signal(s): `glue.etl_failure`, `glue.job_failed`

## 2) Impact
- Silver sessions output may be missing or stale.
- Downstream analytics/queries that rely on `silver/sessions/v=1/` may return incomplete results.
- Data integrity risk is low-to-medium: raw bronze data stays intact, but processing may need rerun.

## 3) 5-minute triage (do these first)
1) Confirm the failing job run in the Glue console or CloudWatch metrics.
2) Identify whether the failure is code/data driven by reviewing Glue job logs in `/aws-glue/jobs/`.
3) Check whether the input bronze path and output silver path are still present and accessible.

## 4) Deep dive

### Logs Insights (copy/paste)
```sql
fields @timestamp, @message, @logStream
| filter @logStream like /jobs\//
| filter @message like /ERROR|Exception|Traceback|FAILED|failed/
| sort @timestamp desc
| limit 200
```

### What “good” looks like
- Recent Glue job runs show `Succeeded` state.
- The job writes parquet under `silver/sessions/v=1/`.
- No `ERROR` or Python exception is present in the job log stream.

### What “bad” looks like
- The job fails with Python exceptions, schema inference errors, or missing-input errors.
- The job cannot read from the bronze prefix because the source data layout has changed.
- The output path is empty or missing recent partitions.

## 5) Mitigation (stop the bleeding)
- Do not accept tenant isolation workarounds from client input; verify tenant context in auth/jwt only.
- If the failure is caused by bad bronze input, fix the source payload and rerun the Glue job.
- If the failure is caused by a code bug in the ETL script, validate the change in a local test before rerunning.
- If the job run is stuck or repeatedly failing, stop it and inspect the last run logs.

## 6) Manual health check
- Check latest job runs in Glue console for `sic-club-vivo-bronze-to-silver-sessions-<env>`.
- Use AWS CLI to inspect the job runs:
  - `aws glue get-job-runs --job-name sic-club-vivo-bronze-to-silver-sessions-<env> --max-items 5`
- Confirm succeeded output exists in S3:
  - `aws s3 ls s3://<lake-bucket>/silver/sessions/v=1/`
  - `aws s3 ls s3://<lake-bucket>/silver/sessions/v=1/tenant_id=<tenantId>/dt=<YYYY-MM-DD>/`

## 7) Prevention / follow-ups
- Backlog items:
  - Add a Glue job success alarm and no-success health check after schedule is defined.
  - Add schema validation before writing `silver/sessions/v=1/`.
  - Add stronger job-run visibility to track partition count and run duration.
- Owner: data platform or analytics ops.
- Link to issue/ADR: `docs/adr/ADR-0006-repository-boundary-tenant-safe-data-access.md`
