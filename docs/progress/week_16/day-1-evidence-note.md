# Week 16 Day 1 - Attendance Evidence Note

## 1. what changed

Week 16 Day 1 added the Team Attendance v1 slice under the existing Team Layer path.

Delivered scope:

- `POST /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance`
- occurrence-level attendance only for one team, one saved session, and one session date
- explicit POST body and GET query validation
- duplicate replay handling on the natural key `teamId + sessionDate + sessionId`
- tenant-scoped storage and query behavior in the existing `SIC_DOMAIN_TABLE`
- focused unit tests for handler, repository, and validator behavior
- sanitized Postman coverage for the attendance routes

This slice does not add counts-based attendance, athlete-level attendance, roster logic, schedule engine logic, or notifications.

## 2. why it changed

The Day 1 attendance slice gives SIC the smallest useful operational workflow for recording whether a team session occurrence was planned, completed, or cancelled.

It stays thin, low-cost, and product-first by following the frozen contract in `docs/api/team-attendance-v1-contract.md` and the frozen storage design in `docs/progress/week_16/attendance-storage-design.md` without widening scope into infra or boundary redesign.

## 3. how to validate it

Confirm the routes and frozen behavior:

- `POST /teams/{teamId}/attendance` exists in the Team handler
- `GET /teams/{teamId}/attendance` exists in the Team handler
- attendance remains occurrence-level only, not counts-based
- duplicate behavior is:
  - first create => `201`
  - exact normalized replay => `200`
  - conflicting replay => `409 teams.attendance_exists`
- storage/query design remains tenant-scoped:
  - `PK = TENANT#<tenantId>`
  - `SK = TEAMATTENDANCE#<teamId>#<sessionDate>#<sessionId>`
  - no scan-then-filter

Focused unit test commands and outcomes:

- `node services/club-vivo/api/src/domains/teams/team-attendance-validate.test.js`
  - pass: 5, fail: 0
- `node services/club-vivo/api/src/domains/teams/team-repository.test.js`
  - pass: 16, fail: 0
- `node services/club-vivo/api/teams/handler.test.js`
  - pass: 26, fail: 0

Sanitized Postman coverage added in `postman/collections/sic-api.collection.json`:

- `POST /teams/{teamId}/attendance`
- `POST /teams/{teamId}/attendance - duplicate replay`
- `POST /teams/{teamId}/attendance - conflicting replay`
- `POST /teams/{teamId}/attendance - missing session`
- `POST /teams/{teamId}/attendance - invalid body (intentional tenantId rejection coverage only)`
- `GET /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance - startDate/endDate window`
- `GET /teams/{teamId}/attendance - missing team`

## 4. tenancy and security check

- Requests never accept `tenant_id`, `tenantId`, or `x-tenant-id`.
- Tenant scope comes only from verified auth plus authoritative entitlements.
- Team existence is checked inside resolved tenant scope before attendance write or list behavior.
- Session existence is checked inside resolved tenant scope before attendance write behavior.
- Storage remains tenant-scoped by construction in the existing `SIC_DOMAIN_TABLE`.
- History and date-window reads are query-based and avoid scan-then-filter behavior.
- No infra, IAM, auth-boundary, tenancy-boundary, entitlements-model, table, or GSI changes were made.

## 5. observability note

The slice stays aligned with the repo's current minimal route-level logging pattern.

Attendance create and list outcomes are logged without adding a new observability subsystem, metrics surface, dashboard, alarm, or event pipeline.

## 6. product impact note

SIC now has a compact attendance workflow that supports operational team use:

- record one team session occurrence as `planned`, `completed`, or `cancelled`
- safely replay duplicate submissions without double-writing
- list lightweight attendance history for a team
- list a team's attendance in a date window for weekly planning composition

This keeps the slice aligned to the frozen contract and storage design with no contract drift and no platform-boundary expansion.
