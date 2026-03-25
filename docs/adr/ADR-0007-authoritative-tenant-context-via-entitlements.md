# ADR-0007 — Authoritative Tenant Context via Entitlements (DynamoDB)

> **Status:** Accepted
> **Date:** 2026-03-24
> **Supersedes:** ADR-0002 — JWT Tenant Identity Propagation

## Context

SIC is a multi-tenant platform. Tenant isolation must be enforced end-to-end: auth → API → data.
JWT custom claims may exist (e.g., `custom:tenant_id`) but are not sufficient as an authorization source because
they can be stale, missing, or misconfigured relative to server-side entitlements.

We need a single, consistent mechanism to resolve tenant identity and permissions that:
- is authoritative,
- fails closed,
- cannot be overridden by client input,
- and is enforced again at the data boundary by construction.

## Decision

For protected requests, the platform will resolve an authoritative tenant context server-side via:

- `buildTenantContext(event)` reads verified JWT claims (requires `claims.sub`)
- loads the authoritative entitlements row from DynamoDB keyed by `user_sub = claims.sub`
- constructs `tenantCtx = { tenantId, userId, role, tier, ... }`
- rejects the request **fail-closed** if claims/entitlements are missing or invalid

### Non-negotiable constraints

- **Never** accept `tenant_id` / `tenantId` from request body, query params, or headers (including `x-tenant-id`)
- Token custom claims are **non-authoritative** and may be used only as hints/diagnostics, never as the source of truth
- Repositories must require `tenantCtx.tenantId` and build tenant-scoped keys by construction

## Consequences

### Security & Isolation

- Tenant identity and permissions are validated server-side each request (or per TTL-cached window if introduced later)
- Cross-tenant access is prevented at the data layer using tenant-scoped partition keys/prefixes
- Missing entitlements => access denied (fail-closed)

### Implementation Notes

- Handler wrapper (`with-platform.js`) is responsible for calling `buildTenantContext(event)` once and passing `tenantCtx` downstream
- Repositories enforce tenant context presence (throw if missing)
- Logging should include `tenantId`, `userId`, and correlation/request IDs for traceability

## Alternatives considered

1. Derive tenant identity exclusively from JWT claims (rejected; see ADR-0002)
2. Accept `x-tenant-id` header for routing (rejected; client-controlled)
3. Scan-and-filter data by tenantId (rejected; violates tenant isolation by construction)
