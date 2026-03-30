# Glue Catalog v1 (SIC Lake Bronze Sessions)

## Purpose

Document the first Glue Catalog implementation for SIC lake bronze sessions data.
This version is intentionally conservative: it catalogs a single dataset, uses a Glue crawler, and preserves tenant-safe partition metadata.

## Dataset

- `sessions` (bronze)
- Source objects are stored as NDJSON under:
  - `s3://<LakeBucket>/bronze/sessions/v=1/`
- This dataset is intended to support downstream ETL and analytics without exposing tenant logic to the API layer.

## Glue resources

- Glue Database: `sic_lake_<env>`
- Glue Crawler: `BronzeSessionsCrawler`
- Table prefix: `bronze_sessions_`

## Partitioning contract

The cataloged table uses partition keys:
- `tenant_id`
- `dt`

These partitions are derived from the lake object key structure, not from any client request input.
The source objects are expected to follow the lake bronze layout:

`bronze/sessions/v=1/tenant_id=<TENANT_ID>/dt=YYYY-MM-DD/<file>.ndjson`

## Glue Crawler behavior

- The crawler targets the bronze sessions prefix only.
- Schema inference is limited to NDJSON/JSON behavior.
- Crawler schema change policy is conservative:
  - `UPDATE_IN_DATABASE`
  - `LOG` deletions
- The crawler is only responsible for catalog discovery, not ETL.

## Limitations and expectations

- NDJSON inference may not capture all nested field types perfectly. The first pass is intended to bootstrap the catalog.
- Schema drift should be managed by explicit versioning in the lake path (`v=1`) and by evolving downstream ETL jobs.
- This release does not yet expose a silver table or full analytics layer.

## Security and tenancy

- Tenant scope is enforced by the path convention and by Glue partitions, not by request parameters.
- The crawler role uses least-privilege permissions limited to:
  - the bronze sessions S3 prefix
  - the new Glue database and related tables
  - Glue crawler log group writes
- No `tenant_id` is accepted from API request bodies, query strings, or headers.
