# Week 16 Closeout Summary

## Overview

Week 16 shipped the first operational Attendance System v1 slice for SIC Team Layer.

This week moved SIC from “a team can have sessions assigned” into “a team can record whether work actually happened and view a thin current-week operational plan.” The slice stayed product-first, low-cost, tenant-safe, and intentionally narrow.

## Week 16 goal

Ship the first attendance workflow for Team Layer by delivering:

- an attendance model
- `POST /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance`
- `GET /teams/{teamId}/planning/weekly`
- minimal operational documentation for architecture, failures, observability, demo flow, and closeout

## What shipped

### Attendance API

Shipped routes:

- `POST /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance`

Attendance v1 is occurrence-level only:

- one team
- one saved session
- one session date

Attendance v1 fields:

- `sessionId`
- `sessionDate`
- `status`
- `notes` optional
- `recordedAt` server-set
- `recordedBy` server-set

Supported status values:

- `planned`
- `completed`
- `cancelled`

### Duplicate behavior

Attendance create is idempotent on the natural key:

- `teamId + sessionDate + sessionId`

Behavior:

- first create returns `201`
- exact normalized replay returns `200`
- conflicting replay returns `409 teams.attendance_exists`

### Attendance storage design

Attendance remains in the existing `SIC_DOMAIN_TABLE`.

Stored key model:

- `PK = TENANT#<tenantId>`
- `SK = TEAMATTENDANCE#<teamId>#<sessionDate>#<sessionId>`
- `type = TEAM_ATTENDANCE`

This supports:

- exact-key replay checks
- team attendance history queries
- team attendance date-window queries for weekly planning

No new table or GSI was introduced.

### Weekly planning API

Shipped route:

- `GET /teams/{teamId}/planning/weekly`

Weekly planning v1 is a thin current-week operational read for one team only.

Current-week window behavior:

- server-derived only
- UTC
- Monday through Sunday

The response composes:

- current team-session assignments
- current-week attendance occurrences

It returns:

- `teamId`
- `weekStart`
- `weekEnd`
- `summary`
- `items`

Weekly planning item rules:

- one `attendance` item per real attendance occurrence in the current week
- one `assignment` item per currently assigned session with no current-week attendance occurrence
- assignment-only items do not invent `sessionDate`
- assignment-only items do not invent `status`
- the same `sessionId` may appear multiple times when there are multiple real weekly attendance occurrences
- no schedule semantics are introduced

### Supporting documentation and operational assets

Week 16 also added:

- attendance API contract
- weekly planning API contract
- attendance storage design note
- Day 1 evidence note
- Attendance System v1 architecture note
- Attendance System v1 failure runbook
- observability signals catalog update
- Week 16 demo script
- Week 16 closeout summary

## What was validated

### Focused tests run

Attendance validator:
- `node services/club-vivo/api/src/domains/teams/team-attendance-validate.test.js`
- passed: 5
- failed: 0

Weekly planning validator:
- `node services/club-vivo/api/src/domains/teams/team-weekly-planning-validate.test.js`
- passed: 2
- failed: 0

Team repository:
- `node services/club-vivo/api/src/domains/teams/team-repository.test.js`
- passed: 19
- failed: 0

Teams handler:
- `node services/club-vivo/api/teams/handler.test.js`
- passed: 30
- failed: 0

### Behavior validated

Attendance coverage verified:

- create happy path
- exact replay returns `200`
- conflicting replay returns `409`
- missing team returns `404`
- missing session returns `404`
- tenant spoof rejection returns `400`
- history query works
- date-window query works
- tenant-scoped exact-key and query behavior is preserved

Weekly planning coverage verified:

- `GET /teams/{teamId}/planning/weekly` returns `200`
- forbidden query params return `400`
- tenant spoof inputs return `400`
- missing team returns `404`
- UTC Monday-through-Sunday derivation works
- attendance items and assignment-only items merge correctly
- summary calculation works
- multiple attendance occurrences for the same `sessionId` are preserved

### Postman coverage added

Attendance requests were added to the `Teams` folder in the existing Postman collection:

- `POST /teams/{teamId}/attendance`
- `POST /teams/{teamId}/attendance - duplicate replay`
- `POST /teams/{teamId}/attendance - conflicting replay`
- `POST /teams/{teamId}/attendance - missing session`
- `POST /teams/{teamId}/attendance - invalid body (intentional tenantId rejection coverage only)`
- `GET /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance - startDate/endDate window`
- `GET /teams/{teamId}/attendance - missing team`

The collection stayed sanitized and normal requests do not send `tenant_id`, `tenantId`, or `x-tenant-id`.

## Key product decisions

### 1. Attendance is occurrence-level only

Week 16 deliberately chose attendance at the team session occurrence level instead of:

- athlete-level attendance
- counts-based attendance
- roster-linked attendance

This keeps the slice operational and useful without forcing roster, membership, or player-level workflows too early.

### 2. Weekly planning is a composition read, not a scheduler

The weekly planning endpoint is intentionally a read model over existing data, not a scheduling platform.

That means:

- no recurrence
- no calendar engine
- no scheduled occurrence generation
- no timezone personalization
- no fake dates for assignment-only items

### 3. Stay inside the existing Team Layer and current domain table

Attendance was added to the existing Team domain patterns and current `SIC_DOMAIN_TABLE`, avoiding:

- new storage surfaces
- new index surfaces
- new infra
- new IAM work

### 4. Keep observability minimal but real

Week 16 kept observability log-first:

- `team_attendance_recorded`
- `team_attendance_replayed`
- `team_attendance_listed`
- `team_weekly_planning_fetched`

No new metric filters, dashboards, or alarms were added because meaningful expansion would require infra/CDK changes and would be disproportionate to the slice.

## Tenancy and security confirmation

Week 16 stayed aligned with SIC’s non-negotiables.

Confirmed:

- tenant scope comes only from verified auth plus authoritative entitlements
- `tenant_id`, `tenantId`, and `x-tenant-id` are rejected
- no request-derived tenant scope is accepted
- team and session existence checks stay inside resolved tenant scope
- attendance reads and writes are tenant-scoped by construction
- weekly planning reads are tenant-scoped by construction
- no scan-then-filter pattern was introduced
- no infra changes were made
- no IAM changes were made
- no auth-boundary changes were made
- no tenancy-boundary changes were made
- no entitlements-model changes were made
- no new table was added
- no new GSI was added

## Architecture summary

Attendance System v1 currently consists of three backend routes:

- `POST /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance`
- `GET /teams/{teamId}/planning/weekly`

Request flow stays inside the current pattern:

1. authenticated request enters the Teams handler
2. tenant context resolves from verified auth plus entitlements
3. client-supplied tenant-like inputs are rejected
4. request shape is validated
5. team existence is checked in tenant scope
6. session existence is checked in tenant scope where applicable
7. repository performs tenant-scoped reads/writes
8. normalized response is returned

Weekly planning adds one composition step:

- load assignments
- load weekly attendance
- merge real attendance items with assignment-only items
- compute summary
- return current-week operational view

## Failure behavior captured

Week 16 documented the main current-state failure modes and expected behaviors.

Expected product outcomes include:

- `400 platform.bad_request` for invalid payloads or forbidden inputs
- `401` for missing or invalid auth
- `403` for missing or invalid entitlements
- `404 teams.not_found`
- `404 sessions.not_found`
- `200` on exact replay
- `409 teams.attendance_exists` on conflicting replay
- `200` weekly planning with empty `items`
- `200` weekly planning with assignment-only items

Important Week 16 clarity point:

- empty weekly planning is not an incident by default
- assignment-only weekly planning is not a bug by default
- assignment-only items do not imply a schedule

## Demo flow prepared

A Week 16 demo script was written to show:

1. reuse or create a team
2. assign one saved session
3. record attendance
4. retrieve attendance history
5. retrieve weekly planning
6. show conflicting replay as the negative case

Concrete example used in the demo:

- date context: April 11, 2026
- `weekStart = 2026-04-06`
- `weekEnd = 2026-04-12`
- recommended `sessionDate = 2026-04-10`

This proves the slice end to end without implying broader scheduling or roster depth.

## Evidence created

Key Week 16 artifacts:

- `docs/api/team-attendance-v1-contract.md`
- `docs/api/team-weekly-planning-v1-contract.md`
- `docs/progress/week_16/attendance-storage-design.md`
- `docs/progress/week_16/day-1-evidence-note.md`
- `docs/architecture/attendance-system-v1.md`
- `docs/runbooks/attendance-system-v1-failures.md`
- `docs/architecture/observability-signals.md`
- `docs/progress/week_16/demo-script.md`
- `docs/progress/week_16/closeout-summary.md`

## What remains deferred

Still out of scope after Week 16:

- athlete-level attendance
- roster dependency
- schedule engine
- recurrence
- timezone personalization
- cross-team weekly planning
- analytics and reporting expansion
- notifications
- dashboards for this slice
- alarms for this slice
- metric filters for this slice
- new table or GSI design
- infra or IAM expansion
- auth or entitlements redesign

## Product impact

Week 16 is the first point where SIC Team Layer can support a real weekly operational workflow:

- a coach can assign a session to a team
- a coach can record whether that session occurrence was planned, completed, or cancelled
- a coach can retrieve team attendance history
- a coach can view a thin current-week planning read for the team

This is a meaningful transition from “team setup exists” to “team operations exist.”

## Recommended next step

Run the Week 16 demo in the target environment, capture the API evidence, then start Week 17 with a plan-only pass so the next slice stays as disciplined as this one.
