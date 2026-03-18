# Tenant Claim Contract (SIC) Updated to Match Current Implementation

## Purpose
Define the minimum verified identity inputs and authorization rules required for every authenticated request in Sports Intelligence Cloud (SIC).

This contract is enforced at:
1) API Gateway JWT Authorizer (token validity)
2) Lambda tenant context middleware (fail closed authorization plus tenant context construction)
3) Data access layer (tenant scoped reads and writes by construction)

---

## Current Source of Truth (Authoritative)
Authoritative tenant scope and permissions come from the entitlements store in DynamoDB, not from client input and not from optional JWT custom claims.

Why: roles, tier, and tenant membership must be revocable and changeable without relying on token refresh cadence.

### Entitlements store (authoritative)
- Store: DynamoDB tenant entitlements table (environment specific name)
- Lookup key: user_sub = claims.sub
- Required attributes:
  - tenant_id
  - role
  - tier

This matches current code behavior: buildTenantContext(event) reads claims.sub and fetches tenant_id, role, and tier from DynamoDB.

---

## Required Verified Inputs (JWT Claims)
These must come from verified JWT claims attached by the HTTP API JWT authorizer.

### Required
- sub  
  Cognito user identifier for the authenticated principal (immutable).

### Optional (not authoritative in current implementation)
- cognito:groups  
  Used for informational and diagnostic purposes today. Authorization is still determined from entitlements.

### Not accepted from client input
Never accept tenant_id from:
- request body
- query params
- headers like x-tenant-id
- any untrusted client provided value

---

## Token Validation Rules (Authorizer)
Authorizer must validate:
- signature (JWKS)
- iss (issuer)
- aud (audience or client id)
- exp (expiration)

If invalid or expired, return 401 Unauthorized.

---

## Entitlements Validation Rules (Middleware)
Middleware (tenant context builder) must:
1) Extract verified claims from:
   - event.requestContext.authorizer.jwt.claims
2) Require:
   - claims.sub present, else 401 Unauthorized
3) Require entitlements row exists:
   - GetItem(Key: { user_sub: sub }), else 403 missing_entitlements
4) Require entitlements attributes exist:
   - tenant_id, role, tier, else 403 missing_<attribute>
5) Validate tenant_id format (fail closed)

### Tenant ID format (current)
- Regex: ^tenant_[a-z0-9-]{3,}$
- Examples:
  - tenant_demo-001
  - tenant_club-vivo
  - tenant_ruta-viva

Note: This replaces the older COACH# and ORG# scheme to match current implementation.

### Tier values (current)
- Current default: free
- Allowed set (recommended to formalize):
  - free | pro | org

Middleware should fail closed if tier is outside the allowed set.

### Role values (current)
- Current defaults:
  - athlete (default)
  - coach
  - medical
  - admin

Middleware should fail closed if role is outside the allowed set.

---

## Authorization Rule (anti valid token, wrong tenant)
Rule: the authenticated sub must have an entitlements record authorizing a tenant scope.

Source of truth: the entitlements row keyed by user_sub = sub.

Enforcement behavior:
- If mapping does not exist, return 403 Forbidden
- If tenant_id is invalid or missing, return 403 Forbidden

---

## Enforcement Points

### 1) API Gateway JWT Authorizer
- Validate token signature and iss, aud, exp
- Provide verified claims to Lambda
- Reject invalid tokens with stable 401

### 2) Lambda Middleware (Tenant Context)
- Extract and require sub
- Fetch entitlements by sub (authoritative)
- Validate tenant id format
- Construct:
  - tenantContext = { requestId, userId: sub, tenantId, role, tier, groups }
- Deny requests if tenantContext cannot be built (fail closed)

### 3) Data Access Layer
All reads and writes must be tenant scoped by construction:
- DynamoDB access must be keyed or scoped so cross tenant data cannot be returned
- No read all then filter by tenant patterns

Repository and DAO functions must require tenantContext as an input parameter.

---

## Failure Behavior (Stable)
- Invalid or expired token: 401 Unauthorized
- Missing or invalid auth context or required claims: 401 Unauthorized
- Missing entitlements row: 403 missing_entitlements
- Missing or invalid entitlements attribute: 403 missing_<attribute>
- Invalid tenant id format: 403 invalid_tenant_id
- Internal misconfiguration (for example missing env var or table): 500

---

## Logging and Privacy
- Do not log full JWTs or raw authorization headers.
- Log:
  - requestId
  - route
  - tenantId when available
  - sub optionally truncated
  - stable reason codes such as missing_entitlements, invalid_tenant_id
- Avoid PII in logs.

---

## Future Migration Note (optional custom claims)
Older contract required custom:tenant_id, custom:tier, custom:role minted into JWT.

If we want that behavior again:
- JWT custom claims may exist for convenience
- Entitlements store remains authoritative
- Middleware may compare JWT vs entitlements for anomaly detection, but must authorize based on entitlements and fail closed
