# Runbook — Lake Ingest Failure

## Purpose
This runbook explains how to diagnose and recover from failures in the lake ingest pipeline that moves domain exports into the SIC data lake bronze layer.

## Symptom
- `LakeIngestFn` execution errors appear in CloudWatch logs.
- Export objects are created in `DomainExportBucket` but not copied to `LakeBucket/bronze/...`.
- The alarm `LakeIngestFailureAlarm` is in `ALARM` state.

## Where to check
- CloudWatch log group: `/aws/lambda/<lake ingest function name>`
- CloudWatch metrics and alarms:
  - `SIC/Lake` metric `lake_ingest_failure`
  - Alarm: `LakeIngestFailureAlarm`
  - Alarm: `LakeIngestNoSuccess24hAlarm`
- S3 buckets:
  - Source bucket: `DomainExportBucket`
  - Destination bucket: `LakeBucket`

## Safe mitigation steps
1. Open the CloudWatch log stream for the failed `LakeIngestFn` invocation.
2. Confirm the failure reason and note the offending source key.
3. Verify the source object exists in `DomainExportBucket` under `exports/domain/...`.
4. Confirm the destination key in the lake bronze path is correct and follows the contract:
   - `bronze/<dataset>/v=1/tenant_id=<TENANT_ID>/dt=<date>/<file>.ndjson`
5. If the failure is transient (S3 timeout, permissions issue, temporary service error), retry the import by re-uploading the same source object or reprocessing the record.
6. If the failure is due to a malformed export key or unsupported prefix, fix the export producer to emit the correct `exports/domain/...` layout.

## Tenancy safety note
- Tenant identity is not derived from request body, query parameters, or headers.
- The ingest function copies objects based on the verified export key layout, and tenant scoping is enforced by the internal key path.
- Do not attempt to manually access or copy data across tenant prefixes.

## Escalate if
- The `LakeIngestFn` fails for all ingested exports and the failure reason is not a single bad object.
- The destination lake prefix path is missing or malformed across multiple exports.
- The failure appears to be caused by broad S3 permission problems, not just a single export key.
- The alarm remains in `ALARM` state after safe retries.
