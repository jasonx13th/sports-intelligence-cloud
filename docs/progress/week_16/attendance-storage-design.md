# Week 16 Day 1 Hour 2 - Attendance Storage Design

## What changed

Week 16 Day 1 Hour 2 freezes the smallest attendance storage design for the Team Layer v1 attendance slice.

The frozen v1 storage model is:

- `PK = TENANT#<tenantId>`
- `SK = TEAMATTENDANCE#<teamId>#<sessionDate>#<sessionId>`
- `type = TEAM_ATTENDANCE`

Attendance v1 stays in the existing `SIC_DOMAIN_TABLE`.

No new table, GSI, infra, IAM, auth-boundary, tenancy-boundary, or entitlements-model change is required for this slice.

## Why it changed

Week 16 needs the smallest durable storage model that supports operational team attendance without widening scope into roster systems, athlete-level attendance, or a scheduling subsystem.

This storage design keeps the slice:

- product-first
- low-cost
- tenant-safe by construction
- compatible with the existing Team and Session domain-table patterns
- compatible with Day 2 weekly planning composition

## Why attendance stays in the existing `SIC_DOMAIN_TABLE`

The current Team and Session slices already use the same tenant-partitioned primary domain table:

- Team items use:
  - `PK = TENANT#<tenantId>`
  - `SK = TEAM#<teamId>`
- Team-session assignments use:
  - `PK = TENANT#<tenantId>`
  - `SK = TEAMSESSION#<teamId>#<sessionId>`
- Sessions use:
  - `PK = TENANT#<tenantId>`
  - `SK = SESSION#<createdAt>#<sessionId>`
- Session lookups use:
  - `PK = TENANT#<tenantId>`
  - `SK = SESSIONLOOKUP#<sessionId>`

Attendance fits the same primary-table model cleanly.

The required v1 access patterns are tenant-scoped and can be served with the current table shape alone:

- create one attendance occurrence
- perform exact duplicate replay checks
- list team attendance history
- list one team's attendance inside a date window for weekly planning

That means attendance can stay in `SIC_DOMAIN_TABLE` with no new table and no new GSI.

## Frozen item shape

Stored item:

```json
{
  "PK": "TENANT#tenant_demo-001",
  "SK": "TEAMATTENDANCE#team-123#2026-04-15#session-123",
  "type": "TEAM_ATTENDANCE",
  "teamId": "team-123",
  "sessionId": "session-123",
  "sessionDate": "2026-04-15",
  "status": "completed",
  "notes": "Good intensity, full group",
  "recordedAt": "2026-04-15T23:00:00.000Z",
  "recordedBy": "user-123"
}
```

Frozen attributes:

- `teamId`
- `sessionId`
- `sessionDate`
- `status`
- `notes` when present
- `recordedAt`
- `recordedBy`

Notes:

- `notes` is omitted when blank after normalization.
- `recordedAt` is server-set.
- `recordedBy` is server-set from the authenticated principal.
- Tenant scope is derived from verified auth plus authoritative entitlements only.
- The request must never supply `tenant_id`, `tenantId`, or `x-tenant-id`.

## Query patterns

### 1. Create attendance

Flow:

1. Resolve `tenantCtx` from verified auth plus entitlements.
2. Verify the target team exists inside tenant scope.
3. Verify the target saved session exists inside tenant scope.
4. Build the attendance item from:
   - `tenantCtx.tenantId`
   - `teamId`
   - `sessionDate`
   - `sessionId`
5. Write the item into `SIC_DOMAIN_TABLE`.

### 2. Exact duplicate replay check

Exact duplicate handling uses the natural key already encoded in the full PK/SK:

- `teamId + sessionDate + sessionId`

Flow:

1. Attempt a conditional create on the exact PK/SK.
2. On conditional failure, perform an exact key read for the same PK/SK.
3. Compare the normalized payload:
   - `teamId`
   - `sessionId`
   - `sessionDate`
   - `status`
   - `notes` when present
4. If the normalized payload matches exactly, return `200`.
5. If the normalized payload differs, return `409`.

### 3. List team attendance history

Tenant-scoped query pattern:

- `PK = TENANT#<tenantId>`
- `begins_with(SK, "TEAMATTENDANCE#<teamId>#")`

This supports a clean team-history list without any scan or scan-then-filter behavior.

### 4. List team attendance in a date window for weekly planning

Tenant-scoped date-window query pattern:

- `PK = TENANT#<tenantId>`
- `SK BETWEEN :from AND :to`

Frozen bounds:

- from `TEAMATTENDANCE#<teamId>#<startDate>#`
- to `TEAMATTENDANCE#<teamId>#<endDate>#\uFFFF`

Because `sessionDate` is stored in `YYYY-MM-DD` form inside the SK, lexicographic ordering stays aligned with calendar ordering for the per-team date window.

This keeps the storage model compatible with Day 2 weekly planning composition.

## Duplicate handling flow

The frozen duplicate behavior is:

- conditional create on exact PK/SK
- on conditional failure, exact key read
- normalized payload compare
- exact match => `200`
- mismatch => `409`

This matches the narrow idempotent replay behavior already used in the current Team-session assignment pattern while preserving attendance-specific conflict detection on the same natural key.

## Pagination note

`nextToken` can be supported cleanly for attendance list routes by reusing the repo's existing pagination convention already documented and implemented in current Team and Session patterns:

- `Limit`
- `LastEvaluatedKey`
- base64-encoded `nextToken`

That keeps attendance pagination aligned with current repo behavior and avoids inventing a second pagination contract.

## Tenancy / security check

- Tenant scope must come only from verified auth plus authoritative entitlements.
- Requests must never supply `tenant_id`, `tenantId`, or `x-tenant-id`.
- Team and session existence checks must happen inside tenant scope before attendance writes.
- Attendance items remain tenant-scoped by construction:
  - `PK = TENANT#<tenantId>`
  - `SK = TEAMATTENDANCE#<teamId>#<sessionDate>#<sessionId>`
- No scan or scan-then-filter pattern is required for the frozen v1 access patterns.
- No new table or GSI is required for v1.
- No infra, IAM, auth-boundary, tenancy-boundary, or entitlements-model change is introduced.

## Observability note

This Hour 2 slice is a storage design freeze only.

It does not add a new observability subsystem. It keeps the design compatible with the current minimal route-level logging approach and leaves any Week 16 Day 3 operational metrics/dashboard work as separate follow-on work.

## Product impact note

SIC now has a frozen attendance storage design that is small enough to implement safely and useful enough to support weekly team operations:

- one durable attendance occurrence per team, session date, and saved session
- exact duplicate replay handling
- clean team attendance history
- clean per-team date-window reads for weekly planning composition

This gives Week 16 a low-cost path forward without widening the scope into roster management, athlete-level attendance, or schedule-engine complexity.

## Intentionally deferred

Deferred beyond this Hour 2 storage design:

- athlete-level attendance
- roster dependency
- schedule engine changes
- notifications
- cross-team planning indexes
- new table or GSI introduction
- infra, IAM, auth-boundary, tenancy-boundary, or entitlements-model changes
