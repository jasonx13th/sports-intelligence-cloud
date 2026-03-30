# Runbook — Lake Volume Anomaly

## Purpose
This runbook explains how to investigate and respond to unusual lake ingest volume patterns, such as sudden spikes or unexpected drops in domain export ingestion.

## Symptom
- A sudden surge or drop in `lake_ingest_success` counts.
- `LakeIngestNoSuccess24hAlarm` enters `ALARM` state.
- Many export objects remain in `DomainExportBucket` without corresponding lake bronze copies.

## Where to check
- CloudWatch log group: `/aws/lambda/<lake ingest function name>`
- CloudWatch metrics:
  - `SIC/Lake` metric `lake_ingest_success`
  - `SIC/Lake` metric `lake_ingest_failure`
- CloudWatch alarms:
  - `LakeIngestNoSuccess24hAlarm`
  - `LakeIngestFailureAlarm`
- S3 bucket inventory:
  - Source bucket: `DomainExportBucket`
  - Destination bucket: `LakeBucket/bronze`

## Safe mitigation steps
1. Review the ingest log volume and note whether failures or missing successes correlate with the anomaly.
2. If volume dropped sharply, confirm the export producer still writes to `DomainExportBucket/exports/domain/...`.
3. If volume spiked suddenly, verify that the export producer is not emitting duplicate or malformed keys.
4. Check for destination keys already present in the lake bronze path before reprocessing.
5. Use safe retry patterns rather than bulk deletes; the ingest function is idempotent and skips already existing destination keys.
6. For an ingestion gap, identify the first failed or missing source object and repair the export producer or input source.

## Tenancy safety note
- Volume anomalies should be investigated without cross-tenant data access.
- The lake key layout isolates tenant data by `tenant_id` prefixes, so troubleshooting should use the source and destination keys associated with the affected tenant only.
- Do not infer tenant ownership from client-provided data; use verified export key paths and known internal layout.

## Escalate if
- The anomaly affects multiple tenants and cannot be explained by a single export producer issue.
- The lake ingestion backlog is growing and the system can no longer keep up with retries.
- There is evidence of incorrect tenant prefixes in the destination path or unauthorized writes across tenant boundaries.
