# Week 7 Day 1 — Closeout Summary
Date: 2026-03-29
Track: Domain export contract v1 (lake-ready)

## Objective
- Define the SIC domain export v1 contract for core entities.
- Define lake-ready storage layout and tenant-safe export rules.
- Capture consumer compatibility guidance for forward-safe analytics ingestion.

## What We Built
- `docs/exports/domain-export-spec-v1.md`
- `datasets/schemas/exports/v1/session.schema.json`
- `datasets/schemas/exports/v1/club.schema.json`
- `datasets/schemas/exports/v1/team.schema.json`
- `datasets/schemas/exports/v1/membership.schema.json`
- A versioned export **record contract** (envelope metadata + entity payload), intended for NDJSON/Parquet downstream.
- A lake-ready S3 prefix convention (declared in the contract):
  `exports/domain/<schema>/v=1/tenant_id=<TENANT_ID>/export_date=YYYY-MM-DD/...`

## Tenancy / Security Guarantees
- Tenant scope is derived from verified auth context + entitlements (`tenantCtx`) only.
- Never accepts `tenant_id` / `tenantId` / `x-tenant-id` from request body, query, or headers.
- Export layout **requires** tenant partitioning at the S3 prefix level.
- Design keeps tenant authority server-side and data isolation deterministic.

## Commits
- `0dbca72` — Week 7 Day 1: domain export spec v1 + schemas
- `1a7bc64` — Week 7 Day 1: export contract consumer rules

## Validation
- Schema sanity checks:
  - JSON schemas parse successfully (Node `JSON.parse` checks).
- Repo sanity (optional): `npm test --prefix services/club-vivo/api` → green

## Decisions / Notes
- Contract versioning rules are explicit: `v1` remains backward compatible for additive/non-breaking changes.
- Forward-compat consumer rules require ignoring unknown fields and using `schema_name` + `schema_version`.
- Tenant safety is non-negotiable: export scope is authoritative and not derived from request-supplied tenant identifiers.

## Next Session Starting Point
Begin Week 8 with testing and CI hardening sprint #1, focusing on export contract validation and automated pipeline guardrails.
