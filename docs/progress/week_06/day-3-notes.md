# Week 6 Day 3 - Closeout Summary
Date: 2026-03-28  
Track: Club Vivo -> Membership domain + RBAC + API wiring

## Objective
Ship the Membership domain slice in Club Vivo and wire it into the deployed API:
- Membership domain + RBAC
- Memberships routes wired in CDK
- ADR for Coach Basic -> Org Premium upgrade and active tenant selection

Non-negotiable: tenant identity derived from verified auth + entitlements only (fail closed).

---

## What We Built

### 1) Memberships endpoints
Implemented the first Memberships API slice consistent with existing platform conventions:
- `POST /memberships`
- `GET /memberships`

Behavior:
- `POST /memberships`
  - admin-only (`tenantCtx.role === "admin"`)
  - upserts a membership for the current tenant
  - returns `201` with `{ membership }`
- `GET /memberships`
  - admin-only (`tenantCtx.role === "admin"`)
  - performs a tenant-scoped list
  - returns `200` with `{ items, nextToken? }`
  - returns an empty list when no memberships exist for the tenant

**Files:**
- `services/club-vivo/api/memberships/handler.js`
- `services/club-vivo/api/_lib/membership-repository.js`
- `services/club-vivo/api/memberships/handler.test.js`

### 2) CDK wiring for memberships
Wired the memberships handler into the deployed Club Vivo API:
- added `MembershipsFn`
- added authenticated `POST /memberships`
- added authenticated `GET /memberships`

Behavior:
- both routes sit behind the existing JWT authorizer
- the memberships Lambda uses the same Club Vivo API asset bundle pattern as the other handlers
- the Lambda receives both:
  - `TENANT_ENTITLEMENTS_TABLE`
  - `SIC_DOMAIN_TABLE`

**File:**
- `infra/cdk/lib/sic-api-stack.ts`

### 3) ADR-0008
Added the next ADR to document upgrade and active tenant selection:
- `ADR-0008-coach-basic-to-org-premium-upgrade-and-active-tenant-selection.md`

Focus:
- how Coach Basic can evolve into Org Premium safely
- how active tenant selection must remain server-controlled
- why membership records are domain data and not tenant authority

**File:**
- `docs/adr/ADR-0008-coach-basic-to-org-premium-upgrade-and-active-tenant-selection.md`

---

## Tenancy / Security Guarantees

### 1) Tenant authority comes from `tenantCtx` only
- Tenant scope is derived only from `tenantCtx.tenantId`, which comes from verified auth context plus entitlements.
- The Memberships slice does not trust request body, query params, or headers for tenant scope.

### 2) Spoofed tenant inputs are not propagated
- Tests cover spoofed `tenant_id`, `tenantId`, and `x-tenant-id` values.
- The handler passes only the domain fields needed by the repository:
  - `userSub`
  - `role`
- Effective scoping still comes only from `tenantCtx`.

### 3) Key construction enforces tenant scoping
- Storage keys:
  - `PK = TENANT#<tenantId>`
  - `SK = MEMBERSHIP#USER#<userSub>`
- Writes use `PutItem`.
- Reads/lists use tenant-scoped key access patterns.
- No scan-then-filter access pattern is used.

### 4) IAM remains least privilege
- Memberships Lambda gets only the table actions it needs.
- Domain table access is limited to:
  - `PutItem`
  - `GetItem`
  - `Query`
  - supporting table metadata/read helpers already used elsewhere in the stack
- No `Scan` was added.
- No wildcard `Action` or wildcard `Resource` was added.

---

## Commits
- `e6550c3` - app-layer memberships slice
- `bd3ac7f` - infra wiring + ADR-0008
- `b99d6c1` - merge

---

## Validation

### Commands
```bash
npm test --prefix services/club-vivo/api
npx cdk diff SicApiStack-Dev
```

### Expected / recorded summary
```text
pass 44
```

The Memberships handler tests validate:
- admin upsert -> `201`
- non-admin create -> `403`
- empty list -> `200`
- non-admin list -> `403`
- spoofed tenant input ignored for both create and list paths

The CDK diff validates:
- `MembershipsFn` added
- authenticated `/memberships` routes added
- least-privilege IAM statements added for entitlements + domain table access

---

## Decisions Made
- Membership records are modeled as tenant-scoped domain data keyed by tenant partition plus `userSub`.
- Membership-based org relationships complement the domain model, but do not replace authoritative tenant authorization.
- ADR-0008 records the rule that tenant identity must continue to come from verified auth plus entitlements.
- Active tenant selection, if introduced later, must remain server-controlled and fail closed.

---

## Next Session Starting Point (Week 7)
Move into the next thin slice:
- define domain export contract v1 for lake-ready data
- decide whether Clubs and Teams should now be wired into the deployed API using the same pattern as Memberships
