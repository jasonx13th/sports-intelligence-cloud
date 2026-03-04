# Tenant Claim Contract (SIC)

## Purpose
Define the minimum JWT claim set and validation rules required for every authenticated request in Sports Intelligence Cloud (SIC).
This contract is enforced at: (1) Authorizer, (2) Lambda middleware, (3) Data access layer.

## Required Claims
- sub: Cognito user identifier for the authenticated principal (immutable).
- custom:tenant_id: Authoritative tenant scope assigned by SIC (not user-supplied).
- custom:tier: One of: basic | pro | org
- custom:role: Required only when custom:tier = org. Allowed: org_admin | coach | analyst

## Validation Rules

### Token Validation (Authorizer)
- Verify signature (JWKS)
- Verify iss (issuer) and aud (audience/client id)
- Verify exp (not expired)

### Claim Validation
- custom:tenant_id format:
  - Regex: ^(COACH|ORG)#[A-Za-z0-9_-]{3,64}$
  - Examples:
    - COACH#jleom
    - ORG#club-vivo
    - ORG#ruta-viva

- tier/role constraints:
  - If custom:tier = basic → custom:role must be absent (or set to member if we standardize always-present roles).
  - If custom:tier = pro → custom:role must be absent (or set to member if we standardize always-present roles).
  - If custom:tier = org → custom:role must be present and in {org_admin, coach, analyst}.

### Authorization Check (anti “valid token, wrong tenant”)
- Rule: The authenticated sub must be authorized for the presented custom:tenant_id (no cross-tenant access).
- Source of truth (baseline): DynamoDB table user_tenant_map
  - PK: sub
  - Attributes: tenant_id, tier, role
- Enforcement behavior:
  - If mapping does not exist for (sub, tenant_id) → 403 Forbidden

> Note: The JWT claim custom:tenant_id is minted by a trusted path (e.g., Cognito Pre Token Generation trigger) and is never accepted from headers/body/query params.

## Failure Behavior
- Invalid/expired token → 401 Unauthorized
- Missing/invalid required claim → 403 Forbidden
- Tenant not authorized for sub → 403 Forbidden

## Enforcement Points

### 1) Authorizer
- Validate JWT signature + iss/aud/exp
- Validate required claims exist
- Validate custom:tenant_id matches regex
- Validate tier/role constraints
- Reject early with 401/403 and a stable error code

### 2) Lambda Middleware
- Re-validate claim contract defensively
- Construct tenantContext:
  - tenantContext = { sub, tenantId, tier, role }
- Attach tenantContext to request/event context for handlers to use
- Deny requests if tenantContext cannot be built

### 3) Data Access Layer
- All reads/writes must be tenant-scoped by construction:
  - DynamoDB keys/queries must include tenantId in the partition key or as a required prefix
  - No “read all then filter by tenant” patterns
- Any repository/DAO function must require tenantContext (or tenantId) as an input parameter

## Logging & Privacy
- Do not log full JWTs or raw authorization headers.
- Log: request id, route, tenant_id, and a short failure reason code (e.g., TENANT_CLAIM_MISSING, TENANT_CLAIM_INVALID, TENANT_UNAUTHORIZED).
- Avoid logging PII; if needed, log sub in truncated or hashed form.