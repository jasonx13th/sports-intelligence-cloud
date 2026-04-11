# Week 16 Closeout Summary

## What shipped

Week 16 shipped the Attendance System v1 slice for the Team Layer:

- `POST /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance`
- `GET /teams/{teamId}/planning/weekly`

The shipped behavior stays intentionally small:

- attendance is occurrence-level only
- one attendance occurrence represents one team, one saved session, and one session date
- duplicate replay uses the natural key `teamId + sessionDate + sessionId`
- first create returns `201`
- exact normalized replay returns `200`
- conflicting replay returns `409 teams.attendance_exists`

Attendance storage stays in the existing `SIC_DOMAIN_TABLE`:

- `PK = TENANT#<tenantId>`
- `SK = TEAMATTENDANCE#<teamId>#<sessionDate>#<sessionId>`
- `type = TEAM_ATTENDANCE`

Weekly planning shipped as a current-week UTC composition of:

- current team-session assignments
- current-week attendance occurrences

It remains a thin read model, not a scheduler.

Week 16 also added the supporting delivery docs:

- `docs/api/team-attendance-v1-contract.md`
- `docs/progress/week_16/attendance-storage-design.md`
- `docs/progress/week_16/day-1-evidence-note.md`
- `docs/api/team-weekly-planning-v1-contract.md`
- `docs/architecture/attendance-system-v1.md`
- `docs/runbooks/attendance-system-v1-failures.md`
- `docs/architecture/observability-signals.md`
- `docs/progress/week_16/demo-script.md`

Postman coverage was added for attendance routes in the existing collection.

## What was validated

Focused Week 16 validation passed for the shipped slice:

- attendance validator tests passed
- weekly planning validator tests passed
- Team repository tests covering attendance and weekly planning passed
- Teams handler tests covering attendance and weekly planning passed

Attendance-specific coverage verified:

- `POST /teams/{teamId}/attendance` happy path
- exact replay `200`
- conflicting replay `409`
- missing team `404`
- missing session `404`
- tenant spoof rejection `400`
- attendance history reads
- date-window attendance reads

Weekly planning coverage verified:

- `GET /teams/{teamId}/planning/weekly` returns `200`
- forbidden query params return `400`
- tenant spoof inputs return `400`
- missing team returns `404`
- UTC Monday-through-Sunday window derivation
- merged attendance and assignment-only items
- summary calculation

Postman coverage was added for:

- attendance create
- duplicate replay
- conflicting replay
- missing session
- intentional tenantId rejection coverage only
- attendance history
- attendance date window
- missing team

## Key product decisions

- Attendance stays occurrence-level only, not counts-based and not athlete-level.
- Weekly planning stays a current-week operational read for one team only.
- Current week is derived server-side only in UTC, Monday through Sunday.
- Weekly planning merges current assignments plus current-week attendance without inventing schedule dates or recurrence semantics.
- The slice reuses the existing Team Layer, saved-session model, and `SIC_DOMAIN_TABLE` instead of adding new storage or platform depth.

## Tenancy and security confirmation

Week 16 remained aligned with SIC non-negotiables:

- tenant scope comes only from verified auth plus authoritative entitlements
- no request-derived tenant scope is accepted
- `tenant_id`, `tenantId`, and `x-tenant-id` are rejected
- team, session, assignment, attendance, and weekly-planning reads remain tenant-scoped by construction
- no scan-then-filter pattern was introduced

Explicit confirmation:

- no infra changes
- no IAM changes
- no auth-boundary changes
- no tenancy-boundary changes
- no entitlements-model changes
- no new table
- no new GSI

## Observability note

Week 16 stayed intentionally minimal and real on observability.

Current route-level signals for the slice are:

- `team_attendance_recorded`
- `team_attendance_replayed`
- `team_attendance_listed`
- `team_weekly_planning_fetched`

The observability catalog was updated to include those signals, and the failure runbook documents how to reason about the current slice.

Not added for Week 16:

- metrics filters
- dashboards
- alarms

## What remains deferred

- no athlete-level attendance
- no roster dependency
- no schedule engine
- no recurrence
- no timezone personalization
- no cross-team weekly planning
- no analytics or reporting expansion
- no notifications
- no metrics filters, dashboards, or alarms for this slice yet

## Next recommended step

Run the Week 16 demo flow end to end in the target environment, capture the API evidence for attendance plus weekly planning, and then move into Week 17 with a plan-only pass so the next slice stays as thin and disciplined as Week 16.
