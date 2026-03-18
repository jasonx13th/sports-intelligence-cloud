# SIC Architecture Diagrams

This page provides high level architecture diagrams for Sports Intelligence Cloud (SIC). Diagrams are conceptual and intentionally avoid environment specific identifiers.

---

## 1) High level request flow

```text
Client
  |
  v
API Gateway (JWT authorizer)
  |
  v
Lambda (withPlatform + tenant context)
  |
  +--> DynamoDB (tenant scoped data, entitlements)
  |
  +--> S3 (tenant scoped prefixes)
```

Key idea: tenant isolation is enforced by verified tenant context and entitlements, and by tenant scoped data access patterns.

---

## 2) Tenant context construction (current)

```text
JWT Authorizer verifies token
  |
  v
Lambda receives verified claims
  |
  v
Extract sub from claims
  |
  v
Get entitlements by user_sub = sub
  |
  v
Build tenantContext = { tenantId, role, tier, userId, requestId }
  |
  v
Handlers and repositories require tenantContext
```

Authoritative source of tenant scope and permissions is the entitlements store, not client input.

---

## 3) Enforcement points

- Auth: API Gateway JWT authorizer verifies the token
- Authorization: Lambda builds tenant context from verified claims plus entitlements and fails closed when it cannot
- Data: repositories read and write data in a tenant scoped way by construction, never by scanning and filtering

---

## Related docs

- Tenant identity and claims: docs/architecture/tenant-claim-contract.md
- Platform error semantics: docs/architecture/platform-error-contract.md
- Architecture principles: docs/architecture/SIC architecture principles.md
