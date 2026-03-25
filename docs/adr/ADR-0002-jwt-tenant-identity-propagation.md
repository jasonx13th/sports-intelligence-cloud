# ADR-0002 — JWT Tenant Identity Propagation

Status: Accepted
Date: 2026-03-13
> **Status:** Superseded (2026-03-24)
> **Superseded by:** ADR-000X — Authoritative Tenant Context via Entitlements (DynamoDB)
> **Reason:** The platform now resolves tenant context server-side using verified claims + an authoritative entitlements lookup (fail-closed), and repositories enforce tenant isolation by key construction.

## Context

Every request in SIC must be associated with a tenant.

Allowing clients to provide tenant identifiers in request payloads would allow malicious users to access data belonging to other tenants.

The platform needs a trusted identity source.

## Supersession notes (2026-03-24)

This ADR originally rejected per-request entitlements lookups and derived tenant identity exclusively from JWT claims.
The implemented SIC model is now:

- `buildTenantContext(event)` loads authoritative `{ tenantId, role, tier }` from DynamoDB entitlements using `claims.sub`
- Missing/invalid claims or entitlements => **reject (fail closed)**
- Handlers do not accept tenant identity from body/query/headers
- Data access is tenant-scoped by construction (tenant-scoped partition keys)

## Decision

Tenant identity is derived exclusively from **JWT claims issued by Amazon Cognito**.

The tenant identifier is stored in the user profile as:

custom:tenant_id

Request flow:

Cognito
→ JWT token
→ API Gateway Authorizer
→ Lambda
→ Data layer

Backend services must never trust tenant identifiers coming from:

- request body
- query parameters
- headers

Only verified JWT claims are used.

## Alternatives Considered

### Client-provided tenant ID

Rejected because it is insecure and easily spoofed.

### Database lookup per request

Rejected because it introduces latency and still requires a trusted identity source.

## Consequences

Positive

- strong tenant isolation
- consistent identity propagation
- simpler authorization checks

Negative

- tenant changes require token refresh
- dependency on Cognito claim structure
