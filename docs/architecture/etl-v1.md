# ETL v1 (Bronze Sessions → Silver Sessions)

## Purpose

Document the first ETL pipeline for SIC lake sessions data.
This ETL job reads bronze session exports from the tenant-partitioned bronze lake layer and writes curated Parquet output into the silver layer.

## Inputs

- Source S3 prefix:
  - `s3://<LakeBucket>/bronze/sessions/v=1/`
- Expected source layout:
  - `bronze/sessions/v=1/tenant_id=<TENANT_ID>/dt=YYYY-MM-DD/<file>.ndjson`
- Record format:
  - NDJSON (one JSON object per line)

## Outputs

- Target S3 prefix:
  - `s3://<LakeBucket>/silver/sessions/v=1/`
- Output format:
  - Parquet
- Partition keys:
  - `tenant_id`
  - `dt`
- Partition output path:
  - `silver/sessions/v=1/tenant_id=<TENANT_ID>/dt=YYYY-MM-DD/`

## Partition contract

The ETL job derives `tenant_id` and `dt` from the source object path, not from any request input.
This preserves tenant isolation by construction and avoids stale or incorrect tenant mapping.

## Validation behavior

- The job skips malformed JSON records using Spark's permissive parsing mode.
- Rows that cannot be assigned a valid `tenant_id` or `dt` partition are dropped.
- The job never merges data across tenants: partition values are extracted from the source path, and output is written under the same tenant-specific partition directories.

## Job semantics

- The Glue job is configured as a Glue ETL job (`glueetl`) using Python 3.
- It writes Parquet files and uses dynamic partition overwrite mode to preserve existing silver partitions while updating the partitions it processes.
- This first version does not yet enforce a strict schema on session payload fields; the focus is on tenant-safe partition preservation and durable silver Parquet output.

## Security and tenancy

- Tenant scope is enforced by the bronze path contract and by partition extraction from the source path.
- The Glue job role has least-privilege access:
  - read from `s3://<LakeBucket>/bronze/sessions/v=1/*`
  - write to `s3://<LakeBucket>/silver/sessions/v=1/*`
  - logs to `/aws-glue/jobs/*`
- No `tenant_id` is accepted from request body, query string, or headers.
