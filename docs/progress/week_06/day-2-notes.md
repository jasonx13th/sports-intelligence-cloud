# Week 6 Day 2 - Closeout Summary
Date: 2026-03-27  
Track: Club Vivo -> Teams foundation (tenant-safe RBAC slice)

## Objective
Ship the first Team domain slice in Club Vivo:
- `POST /teams` (admin-only create)
- `GET /teams` (tenant-scoped list)

Non-negotiable: tenant identity derived from verified auth + entitlements only (fail closed).

---

## What We Built

### 1) Teams endpoints
Implemented the first Teams API slice consistent with existing platform conventions:
- `POST /teams`
- `GET /teams`

Behavior:
- `POST /teams`
  - admin-only (`tenantCtx.role === "admin"`)
  - creates a team for the current tenant
  - returns `201` with `{ team }`
- `GET /teams`
  - requires authenticated tenant context
  - performs a tenant-scoped list
  - returns `200` with `{ items, nextToken? }`
  - returns an empty list when no teams exist for the tenant

**Files:**
- `services/club-vivo/api/teams/handler.js`
- `services/club-vivo/api/_lib/team-repository.js`
- `services/club-vivo/api/teams/handler.test.js`

---

## Tenancy / RBAC Guarantees

### 1) Tenant authority comes from `tenantCtx` only
- Tenant scope is derived only from `tenantCtx.tenantId`, which comes from verified auth context plus entitlements.
- The Teams slice does not trust request body, query params, or headers for tenant scope.

### 2) Spoofed tenant inputs are ignored
- Spoofed `tenant_id`, `tenantId`, and `x-tenant-id` values are ignored for scoping.
- Tests assert that repository calls receive the authoritative `tenantCtx` rather than client-supplied tenant values.

### 3) Key construction enforces tenant scoping
- Storage keys:
  - `PK = TENANT#<tenantId>`
  - `SK = TEAM#<teamId>`
- `GET /teams` uses `Query` with `begins_with(SK,"TEAM#")`.
- No scan-then-filter access pattern is used.

### 4) RBAC for Day 2
- `POST /teams` is restricted to `tenantCtx.role === "admin"`.
- `GET /teams` requires authenticated tenant context and remains tenant-scoped.

---

## Commits
- `ca2e98d` - `feat(teams): add tenant-scoped create/list teams with RBAC + tests`

---

## Validation

### Command
```bash
npm test --prefix services/club-vivo/api
```

### Expected / recorded summary
```text
pass 39
fail 0
```

The Teams handler tests are included in the package suite and validate:
- admin create -> `201`
- non-admin create -> `403`
- list teams -> `200`
- empty list -> `200`
- spoofed tenant input ignored for both create and list paths

---

## Decisions Made
- `teamId` is server-generated.
- Membership model is deferred to Day 3 so the Teams slice stays small and fail-closed.

---

## Next Session Starting Point (Week 6 Day 3)
Plan Membership records plus RBAC expansion:
- Add Membership domain record shape and tenant-scoped storage pattern.
- Define how membership data complements, but does not replace, authoritative `tenantCtx` auth.
- Expand RBAC rules carefully while preserving fail-closed tenancy boundaries.

