# Runbook — Lake Isolation Proof

## Purpose
This runbook describes how to prove tenant isolation for the SIC S3 data lake.
It is intended for Week 9 Day 1 verification of the lake layout and access control model.

## Isolation model
- Tenant scope is derived only from verified auth context and the entitlements store.
- The lake uses the App-only Access Control Model v1.
- No tenant identifier is accepted from request body, query, or headers (including `x-tenant-id`).
- Lake writes must preserve tenant-prefixed key paths by construction.

## Proof steps

### 1) Validate the lake layout contract
- Confirm `docs/architecture/lake-layout.md` defines the canonical key contract.
- Confirm the contract includes `tenant_id=<TENANT_ID>` in the key path.
- Confirm the contract states `TENANT_ID` is derived server-side from verified auth context + entitlements.

### 2) Verify the bucket resource exists
- Confirm `infra/cdk/lib/sic-api-stack.ts` defines `LakeBucket`.
- Confirm the bucket is configured with:
  - `blockPublicAccess: BLOCK_ALL`
  - `enforceSSL: true`
  - `encryption: S3_MANAGED`
  - `removalPolicy` and `autoDeleteObjects` consistent with the `isDev` pattern

### 3) Prove App-only access model
- Review the lake bucket access controls to ensure only application roles are granted access.
- Confirm there is no broad human console or interactive prefix access in the v1 model.

### 4) Prove tenant-scoped key construction
- Confirm the lake key contract uses:
  - `<layer>/<dataset>/v=<n>/tenant_id=<TENANT_ID>/dt=YYYY-MM-DD/<file>`
- Confirm the contract forbids list-then-filter or request-derived `tenant_id`.

### 5) Expected failure mode for unauthorized tenant access
- Attempting to access another tenant’s lake prefix through application roles should return `AccessDenied`.
- The proof is successful if:
  - the application cannot list or read another tenant’s `tenant_id=` prefix
  - the application cannot write to a prefix for a tenant not authorized by its tenant context

## Expected signals
- `AccessDenied` on cross-tenant prefix access attempts.
- `404` or `403` for invalid/unauthorized tenant access when using app-level entry points, depending on the API behavior.

## Notes
- This runbook is focused on lake structure and access model proof only.
- It does not cover domain export implementation, export manifests, or alarm rules.
