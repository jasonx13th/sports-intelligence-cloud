# Week 6 Day 1 - Closeout Summary
Date: 2026-03-27  
Track: Club Vivo -> Clubs foundation (tenant-safe RBAC slice)

## Objective
Ship the first Club domain slice in Club Vivo:
- `POST /clubs` (admin-only create)
- `GET /clubs` (tenant-scoped point read)

Non-negotiable: tenant identity derived from verified auth + entitlements only (fail closed).

---

## What We Built

### 1) Clubs endpoints
Implemented the first Clubs API slice consistent with existing platform conventions:
- `POST /clubs`
- `GET /clubs`

Behavior:
- `POST /clubs`
  - admin-only (`tenantCtx.role === "admin"`)
  - creates a club profile for the current tenant
  - returns `201` on first create
  - returns `409` when the tenant club already exists
- `GET /clubs`
  - requires authenticated tenant context
  - performs a tenant-scoped point read
  - returns `200` with `{ club }`
  - returns `404` when no club exists for the tenant

**Files:**
- `services/club-vivo/api/clubs/handler.js`
- `services/club-vivo/api/_lib/club-repository.js`
- `services/club-vivo/api/clubs/handler.test.js`

---

## Tenancy / RBAC Guarantees

### 1) Tenant authority comes from `tenantCtx` only
- Tenant scope is derived only from `tenantCtx.tenantId`, which comes from verified auth context plus entitlements.
- The Clubs slice does not trust request body, query params, or headers for tenant scope.

### 2) Spoofed tenant inputs are ignored
- Tests cover spoofed tenant values supplied in:
  - request body
  - query params
  - headers such as `x-tenant-id`
- Effective scoping still comes only from `tenantCtx`.

### 3) Key construction enforces tenant scoping
- Storage keys:
  - `PK = TENANT#<tenantId>`
  - `SK = CLUB#<tenantId>`
- Reads use a point `GetItem` on those keys.
- Creates use a conditional write on those keys.
- No scan-then-filter access pattern is used.

### 4) RBAC for Day 1
- `POST /clubs` is restricted to `tenantCtx.role === "admin"`.
- `GET /clubs` requires authenticated tenant context and remains tenant-scoped.

---

## Commits
- `b31dd3d` - `feat(clubs): add tenant-scoped create/get clubs with RBAC + tests`

---

## Validation

### Command
```bash
npm test --prefix services/club-vivo/api
```

### Expected / recorded summary
```text
pass 35
fail 0
```

The Clubs handler tests are included in the package suite and validate:
- admin create -> `201`
- duplicate create -> `409`
- non-admin create -> `403`
- get existing -> `200`
- get missing -> `404`
- cross-tenant denial behavior via tenant-scoped key construction and ignored spoofed tenant input

---

## Decisions Made
- Club profile is modeled as a single tenant-scoped record per tenant.
- RBAC for Day 1 uses the authoritative role already present in `tenantCtx`.
- Team and Membership expansion are deferred so the first slice stays small and fail-closed.

---

## Next Session Starting Point (Week 6 Day 2)
Expand the org model with Teams plus Membership/RBAC:
- Add Team domain foundation with tenant-scoped storage patterns.
- Add Membership records for user-to-club role assignment inside the domain model.
- Expand RBAC beyond the initial admin-only create path while keeping auth authority in `tenantCtx`.
- Add focused tests for membership-aware authorization without weakening tenancy boundaries.

