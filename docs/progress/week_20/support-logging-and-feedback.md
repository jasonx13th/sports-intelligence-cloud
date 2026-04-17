# Week 20 Day 2 — Support Logging and Pilot Feedback

## Theme

KSC Pilot Readiness

## Purpose

Define the smallest safe supportability and feedback-capture slice needed for the KSC pilot.

This note keeps Week 20 aligned to the roadmap goal of improving support logging, tightening debug visibility, and capturing real coach feedback without expanding into a larger observability, analytics, or platform program.

## Why this note exists

A real coach pilot needs two things beyond the happy path:

1. enough support visibility to triage common failures quickly
2. enough structured feedback to learn from real coach usage

Week 20 should add both in a bounded way.

This work must improve pilot readiness without changing:

- the current auth model
- the current tenancy model
- the current entitlements model
- the current product wedge
- the current low-cost operating posture

## Day 2 objective

Improve pilot supportability and define the pilot feedback shape for the current coach flow.

This includes:

- identifying the most important pilot support gaps
- tightening structured logging and reason-code clarity
- defining the smallest useful feedback contract
- placing feedback inside the current workflow
- documenting pilot-safe validation expectations

## Scope boundary

This note covers only:

- support-gap review for likely pilot issues
- structured support logging improvements
- stable pilot-facing or operator-facing reason codes
- bounded feedback capture for current pilot flows
- feedback placement in the current app flow
- protected-route and malformed-input validation expectations
- small supportability hardening only where needed

This note does not cover:

- a new observability subsystem
- broad dashboards or dashboard sprawl
- analytics platform expansion
- reporting products
- a broad product telemetry program
- auth redesign
- entitlements redesign
- tenancy-boundary changes
- a new survey platform

## Support gap review

The most likely Week 20 pilot support gaps are the places where a real coach can get blocked or confused in the current flow.

### Priority 1 — sign-in and access failures

Examples:

- coach cannot reach the right entry path
- coach signs in but access fails closed
- coach expects access but is missing entitlements
- coach is uncertain whether the issue is sign-in or authorization

Why this matters:
A pilot fails quickly if coaches cannot enter the product clearly.

### Priority 2 — generation failures

Examples:

- session generation fails validation
- generation returns an unusable result
- operator cannot quickly tell what failed
- coach receives unclear error wording

Why this matters:
Session Builder is the current product wedge and must stay usable.

### Priority 3 — image-assisted failures

Examples:

- image upload succeeds but analysis fails
- image analysis returns low-quality output
- coach does not understand that confirmation is required
- operator cannot distinguish environment-profile issues from setup-to-drill issues

Why this matters:
Week 20 explicitly includes image-assisted pilot usage.

### Priority 4 — save or export confusion

Examples:

- coach is unsure whether a session was saved
- export fails without a clear support trail
- operator cannot quickly identify whether failure occurred before or after generation

Why this matters:
Save and export are part of the pilot walkthrough and real value path.

### Priority 5 — feedback capture confusion

Examples:

- coach does not know where to leave feedback
- malformed feedback is rejected unclearly
- operator cannot tell whether feedback is being captured successfully

Why this matters:
Pilot learning is part of the Week 20 outcome.

## Support logging boundary

Week 20 support logging should remain minimal but real.

The goal is not to build a new observability stack. The goal is to make common pilot failures understandable and triageable.

Support logging should prefer:

- structured logs
- stable reason codes
- route-level visibility
- request and correlation context where already supported
- clear separation between coach-visible error wording and operator-visible diagnosis

Support logging should avoid:

- new logging platforms
- big dashboard programs
- speculative telemetry work
- verbose PII-heavy logs
- token or credential logging

## Required logging fields

Where already available or easy to add safely, support logging should capture:

- `requestId`
- `route`
- `tenantId` when available
- `userSub` only if truncated or otherwise privacy-safe
- stable `reasonCode`
- relevant flow marker such as:
  - `sign_in_access`
  - `session_generation`
  - `image_environment_profile`
  - `image_setup_to_drill`
  - `session_save`
  - `session_export`
  - `pilot_feedback`
- timestamp from the existing platform logging surface

## Logging privacy rules

Support logging must follow the existing privacy and security posture.

Do not log:

- full JWTs
- raw authorization headers
- passwords
- tokens
- coach free-text feedback if it contains avoidable PII exposure
- unnecessary personal identifiers

Prefer:

- stable reason codes
- safe request context
- minimal operator-useful metadata
- privacy-safe user references only where necessary

## Stable reason codes

Reason codes should be short, consistent, and operator-meaningful.

Recommended pilot-safe examples:

### Access and auth-adjacent

- `missing_auth_context`
- `missing_entitlements`
- `invalid_tenant_id`
- `access_denied`
- `unsupported_role_for_flow`

### Session generation

- `session_generation_failed`
- `session_validation_failed`
- `unsupported_input_shape`
- `equipment_constraint_mismatch`

### Image-assisted flow

- `image_upload_failed`
- `image_analysis_failed`
- `environment_profile_invalid`
- `setup_profile_invalid`
- `coach_confirmation_required`

### Save and export

- `session_save_failed`
- `session_export_failed`

### Feedback

- `feedback_validation_failed`
- `feedback_submit_failed`

These codes should align to existing platform behavior where possible instead of inventing a second vocabulary.

## Feedback capture objective

The Week 20 pilot feedback model should capture the smallest set of coach signals that can improve real product quality.

Required pilot feedback fields:

- session quality
- drill usefulness
- image analysis accuracy
- missing features

Optional fields:

- short free-text note
- session reference
- flow mode used

The feedback model should remain useful, bounded, and easy to validate.

## Feedback contract shape

The pilot feedback contract should remain narrow and explicit.

### Required fields

#### `sessionQuality`

Purpose:
Capture whether the generated session felt usable and appropriate.

Suggested shape:
- bounded rating or narrow enum

#### `drillUsefulness`

Purpose:
Capture whether the generated drill or activity content was practically useful.

Suggested shape:
- bounded rating or narrow enum

#### `imageAnalysisAccuracy`

Purpose:
Capture whether image-assisted output matched the coach’s real setup or environment.

Suggested shape:
- bounded rating or narrow enum
- allow a “not used” or equivalent value when image mode was not part of the flow

#### `missingFeatures`

Purpose:
Capture what the coach felt was absent from the workflow.

Suggested shape:
- short bounded text or small selectable list with optional short note

### Optional fields

#### `note`

Purpose:
Allow a short coach comment.

Boundary:
- keep short
- validate length
- avoid turning the pilot into a broad survey tool

#### `sessionId`

Purpose:
Link feedback to a session when the feedback follows saved session work.

Boundary:
- server-side validation required
- tenant-scoped checks only

#### `flowMode`

Purpose:
Help distinguish which pilot path the coach used.

Suggested values:
- `session_builder`
- `environment_profile`
- `setup_to_drill`

## Recommended feedback example

This example is illustrative and sanitized.

```json
{
  "sessionQuality": 4,
  "drillUsefulness": 5,
  "imageAnalysisAccuracy": 3,
  "missingFeatures": "Wanted easier editing of setup-derived drill details",
  "note": "Good starting point for our fut-soccer session",
  "sessionId": "<session-id>",
  "flowMode": "setup_to_drill"
}
```

Final implementation should stay aligned to the existing feedback route and current API contract patterns.

## Validation boundaries for feedback

Feedback validation should be strict and boring.

Validation should require:

- known fields only
- bounded values only
- short text limits
- malformed input rejection
- tenant-scoped session reference validation where a session reference is used
- fail-closed behavior for protected routes

Validation should reject:

- unknown fields
- oversized note content
- invalid rating ranges
- invalid enum values
- client-supplied tenant fields
- feedback tied to cross-tenant session references

## Feedback placement in the current workflow

Feedback should appear in the current flow where coaches can provide useful input with minimal friction.

Recommended placement points:

### 1. After session review

Best for:
- session quality
- drill usefulness
- missing features

### 2. After image-assisted confirmation and result review

Best for:
- image analysis accuracy
- setup faithfulness concerns
- missing features in the image-assisted flow

### 3. After save or export confirmation where relevant

Best for:
- quick end-of-flow feedback when the coach has completed the current slice

The pilot should avoid adding feedback prompts in too many places.

## Recommended placement rule

Use one primary feedback moment and one optional image-specific feedback moment.

Preferred approach:

- primary feedback after the coach has reviewed or completed session work
- image-specific question only when the image-assisted flow was actually used

This keeps the feedback surface practical and avoids prompt fatigue.

## Support and feedback validation plan

The Day 2 validation plan should confirm that supportability and feedback work remain safe and usable.

### Success-path checks

- supported route logs contain stable reason-code and request context patterns
- successful session flow remains readable in logs
- successful image-assisted flow remains distinguishable in logs
- successful feedback submission is visible and attributable to the correct route and flow

### Failure-path checks

- invalid or missing auth context fails closed
- missing entitlements remains visible with a stable reason code
- malformed feedback is rejected cleanly
- unsupported rating or enum values are rejected
- invalid session reference is rejected within tenant scope
- image-assisted failures are distinguishable from general generation failures

### Protected-route checks

- protected routes reject unauthenticated access
- protected routes do not accept client-derived tenant identity
- feedback submission does not widen the tenant boundary

## Bounded hardening allowed on Day 2

Allowed Day 2 hardening work:

- clearer structured log fields
- stable reason code cleanup
- feedback contract cleanup
- tighter error wording
- support-note updates
- small route-level validation clarifications

Not allowed on Day 2:

- new analytics subsystems
- dashboard sprawl
- auth redesign
- tenant model changes
- entitlements changes
- broad reporting expansion
- big observability platform work

## Operator support view

The operator should be able to answer these questions quickly:

- Did the coach fail at sign-in, authorization, generation, image analysis, save/export, or feedback?
- Is there a stable reason code for the failure?
- Is the issue likely user setup, input validation, or product behavior?
- Did the coach use the standard Session Builder flow, the environment-profile flow, or the setup-to-drill flow?
- Was feedback successfully submitted?
- Is the issue narrow enough to fix without widening Week 20 scope?

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

## Risks and constraints

### Risk: logging work becomes an observability program

Mitigation:
Keep improvements route-level, structured, and pilot-specific.

### Risk: feedback model becomes a broad survey platform

Mitigation:
Keep required fields small, optional text short, and placement minimal.

### Risk: reason codes drift away from current error behavior

Mitigation:
Reuse existing stable patterns where possible and document only the narrow additions required for pilot support.

### Risk: coach-facing errors become too technical

Mitigation:
Keep detailed diagnosis in operator-visible logs and support docs, not in coach-facing copy.

### Risk: feedback starts to carry tenant meaning from the client

Mitigation:
Keep tenant scope fully server-derived and reject client tenant fields everywhere.

## Stop rules

Stop and escalate immediately if Day 2 work requires:

- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- IAM or CDK drift
- new analytics or BI platform dependencies
- a new observability subsystem
- client-derived tenant scoping
- broad reporting features to justify pilot supportability

## Definition of done

This Day 2 note is done when:

- pilot support gaps are ranked clearly
- the logging slice is explicit and bounded
- required logging fields and privacy rules are documented
- stable reason codes are proposed
- the feedback contract is clear
- feedback placement is narrow and practical
- validation expectations are documented
- hardening scope remains small and pilot-focused
