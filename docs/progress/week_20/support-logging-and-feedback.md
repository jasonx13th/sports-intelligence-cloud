# Week 20 Day 2 - Support Logging and Pilot Feedback

## Theme

KSC Pilot Readiness

## Purpose

Define the smallest safe supportability and feedback-capture slice needed for the KSC pilot.

This note keeps Week 20 aligned to the roadmap goal of improving support logging and capturing real coach feedback without expanding into a larger observability, analytics, or platform program.

## What ships in this slice

This Day 2 slice now ships:

- the existing `POST /sessions/{sessionId}/feedback` route with the Week 20 pilot contract
- tenant-safe persistence of those new fields in `SESSION_FEEDBACK`
- a `schemaVersion` bump from `1` to `2`
- continued `feedback_submitted` event writes
- small `session_feedback_created` log enrichment for pilot triage:
  - `feedback.flowMode`
  - `feedback.imageAnalysisAccuracy`
- a saved-session feedback panel on `/sessions/{sessionId}` that reuses the existing feedback route

This slice does not ship:

- a new feedback route
- dashboards
- BI or analytics expansion
- auth, tenancy, entitlements, IAM, infra, or CDK changes

## Why this note exists

A real coach pilot needs two things beyond the happy path:

1. enough support visibility to triage common failures quickly
2. enough structured feedback to learn from real coach usage

Week 20 should add both in a bounded way.

## Scope boundary

This note covers only:

- support-gap review for likely pilot issues
- minimal support logging enrichment
- bounded feedback capture on the current feedback route
- strict validation expectations
- tenant-safe persistence and event behavior
- the compact saved-session feedback placement that now uses the shipped route

This note does not cover:

- a new observability subsystem
- dashboard sprawl
- analytics platform expansion
- reporting products
- a broad product telemetry program
- auth redesign
- entitlements redesign
- tenancy-boundary changes
- a new survey platform

## Support gap review

The most likely Week 20 pilot support gaps are the places where a real coach can get blocked or confused in the current flow.

### Priority 1 - sign-in and access failures

Examples:

- coach cannot reach the right entry path
- coach signs in but access fails closed
- coach expects access but is missing entitlements
- coach is uncertain whether the issue is sign-in or authorization

### Priority 2 - generation failures

Examples:

- session generation fails validation
- generation returns an unusable result
- operator cannot quickly tell what failed
- coach receives unclear error wording

### Priority 3 - image-assisted failures

Examples:

- image upload succeeds but analysis fails
- image analysis returns low-quality output
- operator cannot distinguish environment-profile issues from setup-to-drill issues

### Priority 4 - save or export confusion

Examples:

- coach is unsure whether a session was saved
- export fails without a clear support trail
- operator cannot quickly identify whether failure occurred before or after generation

### Priority 5 - feedback capture confidence

Examples:

- malformed feedback is rejected unclearly
- operator cannot tell whether feedback is being captured successfully
- image-assisted feedback cannot be distinguished from non-image flow

## Support logging boundary

Week 20 support logging remains minimal but real.

The goal is not to build a new observability stack. The goal is to make common pilot failures understandable and triageable using the logging surface that already exists.

Keep:

- structured logs
- stable reason codes already emitted by the platform
- route-level visibility
- existing request and correlation context

Avoid:

- new logging platforms
- dashboard programs
- speculative telemetry work
- verbose PII-heavy logs
- token or credential logging

## Logging decision for this slice

Keep existing support logging as-is except for one small feedback success enrichment.

### Existing supportability already in place

- existing platform request logs
- `requestId`
- `correlationId`
- route-level success/error logging
- `validation_failed`
- `auth_unauthenticated`
- `auth_forbidden`
- existing Session Builder and image-analysis route logs

### New logging shipped now

Only enrich `session_feedback_created` with:

- `feedback.flowMode`
- `feedback.imageAnalysisAccuracy`

### Logging privacy rules

Do not log:

- full JWTs
- raw authorization headers
- passwords
- tokens
- verbose coach free-text feedback
- unnecessary personal identifiers

## Feedback contract decision

Replace the legacy request fields on `POST /sessions/{sessionId}/feedback`.

Removed fields:

- `rating`
- `runStatus`
- `objectiveMet`
- `difficulty`
- `wouldReuse`
- `notes`
- `changesNextTime`

New request fields:

- `sessionQuality` required integer `1..5`
- `drillUsefulness` required integer `1..5`
- `imageAnalysisAccuracy` required enum:
  - `not_used`
  - `low`
  - `medium`
  - `high`
- `missingFeatures` required trimmed string `1..280` chars after trim
- `flowMode` optional enum:
  - `session_builder`
  - `environment_profile`
  - `setup_to_drill`

`imageAnalysisAccuracy = not_used` is valid for non-image flow.

## Recommended request example

```json
{
  "sessionQuality": 4,
  "drillUsefulness": 5,
  "imageAnalysisAccuracy": "high",
  "missingFeatures": "Wanted easier editing of setup-derived drill details",
  "flowMode": "setup_to_drill"
}
```

## Validation boundaries for feedback

Feedback validation should be strict and boring.

Validation should require:

- known fields only
- all four primary pilot fields
- bounded values only
- short text limits
- malformed input rejection
- tenant-scoped session validation
- fail-closed behavior for protected routes

Validation should reject:

- unknown fields
- invalid rating ranges
- invalid enum values
- blank or oversized `missingFeatures`
- client-supplied tenant fields
- feedback tied to cross-tenant session references

## Persistence and event behavior

This slice preserves the current route and tenant-safe write path.

It changes only the feedback record shape and the feedback event metadata.

### Persistence

- store the new pilot fields directly in `SESSION_FEEDBACK`
- keep one feedback record per session
- preserve duplicate-submit `409`
- preserve missing-session `404`
- bump `schemaVersion` to `2`

### Events

- keep `feedback_submitted`
- remove `session_run_confirmed` behavior from feedback submission
- keep event metadata small and scalar-only

## Placement decision for Week 20

Feedback is now placed on the saved session detail page only.

The coach-facing placement remains narrow:

- tied to saved sessions only
- one compact feedback panel on `/sessions/{sessionId}`
- no new feedback route
- no feedback read/preflight endpoint
- no broader page redesign

## Implementation evidence

The following feedback behaviors were runtime-validated in dev:

- the Week 20 backend feedback contract on `POST /sessions/{sessionId}/feedback` is implemented
- the saved-session feedback panel exists on `/sessions/{sessionId}`
- the first valid feedback submit succeeded in dev
- the second valid feedback submit returned the duplicate message

The following implementation note is also important:

- a manual `SicApiStack-Dev` deploy was required before feedback runtime validation passed because the repo does not auto-deploy the API on push

This evidence is limited to the shipped feedback flow in dev.

## Validation plan

### Success-path checks

- valid Week 20 feedback payload returns `201 { feedback }`
- stored feedback returns the new fields and `schemaVersion: 2`
- successful feedback submission emits `feedback_submitted`
- successful feedback submission logs `session_feedback_created` with:
  - `feedback.flowMode` when present
  - `feedback.imageAnalysisAccuracy`
- the saved-session feedback panel submits successfully end to end in dev

### Failure-path checks

- malformed feedback is rejected cleanly
- invalid enum values are rejected
- invalid rating ranges are rejected
- blank or oversized `missingFeatures` is rejected
- missing target session returns `404 sessions.not_found`
- duplicate submission returns `409 sessions.feedback_exists`
- the saved-session feedback panel shows the duplicate message on second submit

### Protected-route checks

- protected routes reject unauthenticated access
- protected routes do not accept client-derived tenant identity
- feedback submission does not widen the tenant boundary

## Explicit non-goals

Week 20 Day 2 does not include:

- broad analytics platform work
- new reporting UIs
- BI tooling rollout
- full user telemetry program
- cross-tenant support tooling
- admin super-console work
- a general event lake redesign
- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes

## Observability note

The shipped supportability claim remains narrow:

- existing platform/request logging
- existing route-level logging
- minimal feedback log enrichment
- runtime evidence after deploy

This note does not claim broader observability work or dashboard rollout.

## Stop rules

Stop and escalate immediately if Day 2 work requires:

- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- IAM or CDK drift
- new analytics or BI platform dependencies
- a new observability subsystem
- client-derived tenant scoping
- a new feedback route

## Definition of done

This Day 2 note is done when:

- the logging slice is explicit and bounded
- the Week 20 feedback contract is clear
- validation expectations are documented
- persistence and event behavior are documented
- supportability remains small and pilot-focused
