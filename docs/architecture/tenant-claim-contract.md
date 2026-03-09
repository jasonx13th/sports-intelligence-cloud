# Tenant Claim Contract (SIC) — Updated to Match Current Implementation

## Purpose
Define the **minimum verified identity inputs** and **authorization rules** required for every authenticated request in Sports Intelligence Cloud (SIC).

This contract is enforced at:
1) **API Gateway JWT Authorizer** (token validity)
2) **Lambda tenant-context middleware** (fail-closed authz + tenant context construction)
3) **Data access layer** (tenant-scoped reads/writes by construction)

---

## Current Source of Truth (Authoritative)
**Authoritative tenant scope and permissions come from DynamoDB Entitlements**, not from client input and not from optional JWT custom claims.

**Why:** Roles/tier/tenant membership must be revocable and changeable without relying on token refresh cadence.

### Entitlements Store (authoritative)
- Table: `sic-tenant-entitlements-<env>`
- Lookup key: `user_sub` = `claims.sub`
- Required attributes:
  - `tenant_id`
  - `role`
  - `tier`

> This matches current code behavior: `buildTenantContext(event)` reads `claims.sub` and fetches `{tenant_id, role, tier}` from DynamoDB.

---

## Required Verified Inputs (JWT Claims)
These must come from **verified JWT claims** attached by the HTTP API JWT authorizer:

### Required
- `sub`  
  Cognito user identifier for the authenticated principal (immutable).

### Optional (not authoritative in current implementation)
- `cognito:groups`  
  Used for informational/diagnostic purposes today; **authorization is still determined from entitlements**.

### Not accepted from client input
Never accept `tenant_id` from:
- request body
- query params
- headers like `x-tenant-id`
- any untrusted client-provided value

---

## Token Validation Rules (Authorizer)
Authorizer must validate:
- signature (JWKS)
- `iss` (issuer)
- `aud` (audience / client id)
- `exp` (expiration)

If invalid/expired → **401 Unauthorized**

---

## Entitlements Validation Rules (Middleware)
Middleware (tenant-context builder) must:
1) Extract verified claims from:
   - `event.requestContext.authorizer.jwt.claims`
2) Require:
   - `claims.sub` present → else **403 missing_sub_claim**
3) Require entitlements row exists:
   - `GetItem(Key: { user_sub: sub })` → else **403 missing_entitlements**
4) Require entitlements attributes exist:
   - `tenant_id`, `role`, `tier` → else **403 missing_<attribute>**
5) Validate `tenant_id` format (fail closed)

### Tenant ID format (current)
- Regex: `^tenant_[a-z0-9-]{3,}$`
- Examples:
  - `tenant_demo-001`
  - `tenant_club-vivo`
  - `tenant_ruta-viva`

> Note: This replaces the older `COACH#...` / `ORG#...` scheme to match current implementation.

### Tier values (current)
- Current default: `free`
- Allowed set (recommended now to formalize):
  - `free | pro | org`
- Middleware should fail closed if tier is outside allowed set (recommended hardening).

### Role values (current)
- Current defaults/mapping:
  - `athlete` (default)
  - `coach`
  - `medical`
  - `admin`
- Middleware should fail closed if role is outside allowed set (recommended hardening).

---

## Authorization Rule (anti “valid token, wrong tenant”)
- Rule: The authenticated `sub` must have an entitlements record authorizing a tenant scope.
- Source of truth: DynamoDB entitlements row keyed by `user_sub = sub`.
- Enforcement behavior:
  - If mapping does not exist → **403 Forbidden**
  - If tenant_id invalid/missing → **403 Forbidden**

---

## Enforcement Points

### 1) API Gateway JWT Authorizer
- Validate token signature + iss/aud/exp
- Provide verified claims to Lambda
- Reject invalid tokens with stable 401

### 2) Lambda Middleware (Tenant Context)
- Re-validate required claim presence (`sub`)
- Fetch entitlements by `sub` (authoritative)
- Validate tenant id format
- Construct:
  - `tenantContext = { requestId, userId: sub, tenantId, role, tier, groups }`
- Deny requests if tenantContext cannot be built (fail closed)

### 3) Data Access Layer
- All reads/writes must be tenant-scoped by construction:
  - DynamoDB access must be keyed/scoped so cross-tenant data cannot be returned
  - No “read all then filter by tenant” patterns
- Repository/DAO functions must require `tenantContext` (or `tenantId`) as an input parameter

---

## Failure Behavior (Stable)
- Invalid/expired token → **401 Unauthorized**
- Missing claims → **401/403** (prefer 401 if unauthenticated; 403 for missing sub)
- Missing entitlements row → **403 missing_entitlements**
- Missing/invalid entitlements attribute → **403 missing_<attribute>**
- Invalid tenant id format → **403 invalid_tenant_id**
- Internal misconfig (e.g., missing env var/table) → **500**

---

## Logging & Privacy
- Do not log full JWTs or raw authorization headers.
- Log:
  - request id
  - route
  - `tenantId`
  - `sub` (optionally truncated)
  - stable reason codes (e.g., `missing_entitlements`, `invalid_tenant_id`)
- Avoid PII in logs.

---

## Future Migration Note (optional custom claims)
Older contract required:
- `custom:tenant_id`, `custom:tier`, `custom:role` minted into JWT

If we want that future behavior again, do it like this:
- JWT custom claims may exist for **convenience**
- Entitlements store remains **authoritative**
- Middleware may compare JWT vs entitlements for anomaly detection (warn), but must authorize based on entitlements (fail closed).