# Week 14 Day 1 - Session Feedback Endpoint

## Summary

Week 14 Day 1 added the first narrow feedback-loop API slice for saved sessions:

- `POST /sessions/{sessionId}/feedback`

This gives the coach workflow a structured place to capture whether a saved session worked, while staying inside the current SIC cost, tenancy, and architecture boundaries.

## What Changed

- Added the backend endpoint for session feedback on the existing sessions route surface
- Added explicit request validation for the v1 feedback fields:
  - `rating`
  - `runStatus`
  - `objectiveMet`
  - `difficulty`
  - `wouldReuse`
  - `notes`
  - `changesNextTime`
- Enforced the v1 persistence rule:
  - one feedback record per session
  - second submission returns `409`
- Added a dedicated API contract doc:
  - `docs/api/session-feedback-v1-contract.md`

## Why It Changed

Week 14 is the first coach feedback-loop step in the roadmap. This thin slice creates a realistic product signal without expanding infra or introducing broader workflow complexity too early.

It supports the SIC product direction of capturing practical coach learning from real session usage while keeping the implementation low-cost and product-first.

## Validation

The endpoint was validated against the current implementation using focused automated tests covering:

- handler success path
- `400` invalid request behavior
- `404` session not found behavior
- `409` duplicate feedback behavior
- validator rules for enums, bounds, trimming, and inconsistent field combinations
- repository duplicate-write protection and tenant-scoped persistence behavior

Local execution used the existing Node test files directly in this environment because the built-in `node --test` runner was sandbox-blocked with `spawn EPERM`.

## Tenancy / Security Check

- Tenant context still comes only from verified auth plus server-side entitlements
- Tenant identity is not accepted from body, query, or headers
- `tenant_id`, `tenantId`, and `x-tenant-id` are rejected from request input
- Session existence is verified in the same tenant scope before feedback is written
- Data access remains tenant-scoped by construction
- No scan-then-filter access pattern was introduced
- No auth-boundary, tenancy-boundary, or entitlements-model change was made

## Observability Note

This Day 1 slice adds route-level application behavior only.

- Existing structured request logging remains in place
- The handler now emits `session_feedback_created` on success
- No new dashboard, alarm, or event-timeline work was added in Day 1

## Product Impact

This is the smallest realistic feedback loop that lets SIC start collecting structured coach outcomes for saved sessions:

- was the session run
- did it meet the objective
- was the difficulty right
- would the coach reuse it
- what should change next time

That is useful product data now and a better foundation for later review and learning loops.

## Intentionally Deferred

Deferred to later Week 14 work or later phases:

- feedback timeline/event documentation
- broader review workflow documentation
- dashboards or alarms for feedback activity
- feedback read/list APIs
- richer product analytics derived from feedback
- any infra, IAM, auth, tenancy, or entitlements changes
