# Runbook — Lake Access Denied

## Purpose
This runbook covers how to respond when the lake ingest pipeline or related components encounter `AccessDenied` while reading exports or writing to the lake.

## Symptom
- `LakeIngestFn` logs contain `AccessDenied` or permission denied errors.
- Export files are present in `DomainExportBucket` but not copied to `LakeBucket`.
- The `LakeIngestFailureAlarm` may fire due to repeated permission failures.

## Where to check
- CloudWatch log group: `/aws/lambda/<lake ingest function name>`
- CloudWatch alarms/metrics:
  - `SIC/Lake` metric `lake_ingest_failure`
  - Alarm: `LakeIngestFailureAlarm`
- IAM policy bindings in `infra/cdk/lib/sic-api-stack.ts`
- S3 bucket permissions for:
  - `DomainExportBucket` prefix `exports/domain/*`
  - `LakeBucket` prefix `bronze/*`

## Safe mitigation steps
1. Confirm the error is from `LakeIngestFn` and note whether it is reading or writing.
2. If reading, verify the function role has `s3:GetObject` and `s3:HeadObject` on `DomainExportBucket/exports/domain/*`.
3. If writing, verify the function role has `s3:PutObject` and `s3:HeadObject` on `LakeBucket/bronze/*`.
4. Do not grant broader S3 access than necessary; keep permissions scoped to the exact prefixes.
5. Correct only the missing or incorrect policy statement in the CDK stack and redeploy.
6. After correcting permissions, reprocess the failed export or re-upload the source object if needed.

## Tenancy safety note
- `AccessDenied` should not be fixed by broadening S3 permissions to all tenants or all prefixes.
- The lake ingest role should only be allowed access to the application-managed source and destination paths.
- Tenant scope remains enforced by the export key layout and app-level copy logic, not by granting access to arbitrary S3 prefixes.

## Escalate if
- The permission failure persists after applying least-privilege fixes.
- There is evidence that the function role was granted wildcard or broad S3 permissions to resolve the issue.
- The issue appears to involve cross-tenant bucket access or incorrect bucket policy changes.
