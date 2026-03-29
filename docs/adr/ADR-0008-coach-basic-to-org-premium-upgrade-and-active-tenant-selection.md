# ADR-0008 - Coach Basic -> Org Premium Upgrade + Active Tenant Selection

Status: Proposed
Date: 2026-03-28

## Context

SIC supports tiered access across tenant types including solo coaches and club or organization tenants.

A user may begin with a Coach Basic experience and later upgrade into an Org Premium context with broader governance and shared club data ownership requirements.

SIC is multi-tenant and must preserve fail-closed tenant isolation across auth, API, and data. The current platform contract is that tenant identity is derived from verified JWT identity plus authoritative entitlements in DynamoDB, not from client input.

Membership records are useful domain data for modeling org relationships such as which user belongs to which club role, but that domain data does not replace the platform authorization boundary.

## Problem

We need a safe way to support:

- a user upgrading from Coach Basic to Org Premium
- a user who may have access to more than one tenant context over time
- future active tenant selection without creating a client-controlled tenant boundary

We must preserve the current non-negotiables:

- never accept `tenant_id` or `tenantId` from request body, query params, or headers, including `x-tenant-id`
- derive tenant scope from verified auth plus entitlements
- keep data access tenant-scoped by construction

## Decision

SIC will keep tenant authority server-side and fail-closed.

- The active tenant context remains derived from verified JWT identity plus authoritative entitlements
- The platform will never accept `tenant_id` or `tenantId` from client input
- Membership is domain data for organizational relationships and application behavior, not tenant authority
- A Coach Basic -> Org Premium upgrade is represented through server-managed entitlement changes, not through a client-selected tenant override
- Any future active tenant selection must be mediated server-side against the authenticated user's allowed entitlements before a request is authorized

This preserves the existing rule that handlers and repositories operate only on `tenantCtx`, which is resolved by `buildTenantContext(event)` and enforced by `withPlatform`

## Options

### Option 1: Single authoritative tenant in entitlements

- Keep one authoritative tenant assignment per authenticated user
- Simplest model and strongest fail-closed behavior
- Limits flexibility for users who legitimately belong to multiple tenants

### Option 2: Accept tenant selection from request body, query, or headers

- Rejected
- Violates repo guardrails and architecture principles
- Creates tenant spoofing risk and cross-tenant exposure risk

### Option 3: Allow multiple eligible tenants in entitlements and resolve active tenant server-side

- Best path for future multi-tenant user journeys
- Preserves server-side authority and auditability
- Requires explicit product and backend design for how an active tenant is selected and persisted safely

### Option 4: Use membership records as the authorization source

- Rejected
- Membership records are application domain data, not the authoritative tenant boundary
- Weakens the current security model anchored on verified identity plus entitlements

## Consequences

Positive:

- preserves deterministic tenant isolation
- supports future upgrade flows without weakening the platform security boundary
- keeps repositories tenant-scoped by construction through `tenantCtx.tenantId`
- cleanly separates platform authorization from domain relationship modeling

Negative:

- upgrade and tenant-switching flows need explicit backend orchestration
- future multi-tenant support may require additional entitlement modeling and a follow-up ADR
- UX for users with more than one eligible tenant must be designed carefully to avoid ambiguity

## Tenancy Security Notes

- Verified JWT claims establish identity, especially `sub`
- Authoritative entitlements keyed by `user_sub` establish `tenant_id`, `role`, and `tier`
- `tenantCtx.tenantId` is the only tenant scope repositories may trust
- Never accept `tenant_id` or `tenantId` from request body, query params, or headers including `x-tenant-id`
- Membership data is domain data and must never override authoritative tenant context
- No scan-then-filter access patterns are allowed for tenant isolation
- Any future active tenant selection must fail closed when claims are missing, entitlements are missing, or the selected tenant is not authorized for that authenticated user

## Implementation Notes

- Protected routes remain behind the API Gateway JWT authorizer
- Lambda handlers continue to use `withPlatform`, which resolves tenant context before domain logic executes
- `buildTenantContext(event)` remains the authoritative path for tenant context construction
- Membership endpoints and repositories continue to require tenant-scoped access by construction
- Future active-tenant support should use a server-managed entitlement resolution step or validated session state, not raw client-provided tenant values

## Related ADRs

- ADR-0003 - Fail-Closed Authorization Model
- ADR-0006 - Repository Boundary Tenant-Safe Data Access
- ADR-0007 - Authoritative Tenant Context via Entitlements
