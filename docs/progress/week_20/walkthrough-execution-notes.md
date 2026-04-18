# Week 20 — Walkthrough Execution Notes

## Purpose

This document records sanitized execution evidence for a real walkthrough run of the Week 20 KSC pilot flow.

It exists to capture what was actually exercised, what worked, what failed, where friction appeared, and what can honestly be claimed from the run without widening scope beyond the shipped Week 20 slice.

## Scope boundary

This execution note stays inside the current Week 20 pilot boundary.

Covered in this run:

- `/login`
- `/login/start`
- successful auth landing on `/sessions/new`
- session generation from the current shared Session Builder form
- saved session verification through `/sessions`
- saved session detail on `/sessions/{sessionId}`
- saved-session feedback submission
- duplicate feedback protection
- attempted `environment_profile` image-assisted flow

Not covered in this run:

- export verification
- `setup_to_drill` image flow
- non-dev environment behavior
- broader observability coverage
- visual drill-diagram support
- any auth, tenancy, entitlements, IAM, or CDK change

## Run metadata

- **Run date:** 2026-04-17
- **Environment:** local dev
- **Operator/reviewer label(s):** internal operator

## Scenario used

- **Flow:** Soccer
- **Age band:** u14
- **Duration:** 60 minutes
- **Equipment:** 12 cones, 4 balls, 3 red training shirts, 3 training blue shirts, 25 kids, cement area 10m x 10m
- **Theme:** tik tak toe game

## Steps executed

1. Opened `/login`
2. Entered the approved sign-in flow through `/login/start`
3. Completed auth and landed on `/sessions/new`
4. Attempted image-assisted intake using `environment_profile`
5. Completed the standard Session Builder inputs and generated candidate sessions
6. Attempted save from the candidate view
7. Verified save persistence through `/sessions`
8. Opened the saved session detail on `/sessions/{sessionId}`
9. Submitted saved-session feedback
10. Re-submitted feedback to verify duplicate protection

## Results by step

### 1. Login entry path

- Started at `/login`: **yes**
- `/login/start` used: **yes**
- Successful auth landed on `/sessions/new`: **yes**

Result:
The approved Week 20 login path worked in local dev and landed on the expected protected route.

### 2. Image-assisted intake

- `environment_profile` flow exercised: **yes**
- Result: **failed in local dev**

Observed behavior:
The image-assisted attempt triggered a runtime failure with `Body exceeded 1 MB limit`.

Result:
The image-assisted environment-profile path was exercised but did not complete successfully in this run.

### 3. Session-start flow

- `/sessions/new` completed: **yes**
- Candidate session generated: **yes**

Result:
The standard shared Session Builder input flow completed successfully and returned candidate sessions.

### 4. Save-session behavior

- Save attempted from candidate view: **yes**
- Immediate UI behavior was clean and final: **no**
- Save persistence later verified from saved sessions list: **yes**

Observed behavior:
Saving from the candidate view surfaced `NEXT_REDIRECT` rather than cleanly navigating in the current local UI flow.

Result:
The save path appears to persist successfully, but the immediate save UX in local dev is confusing and required follow-up verification from the saved sessions list.

### 5. Saved sessions list

- `/sessions` opened: **yes**
- Newly saved session appeared in list: **yes**

Result:
The generated session persisted and was visible in the saved sessions list.

### 6. Saved session detail

- `/sessions/{sessionId}` reached: **yes**
- Saved session detail looked correct: **yes**

Result:
The saved session detail page rendered expected saved-session data and activity content.

### 7. Feedback submission

Feedback used:

- **Session quality:** 2
- **Drill usefulness:** 2
- **Image analysis accuracy:** Not used
- **Flow mode:** Session Builder
- **Missing features:** visual diagrams

Path result:

- Feedback submitted successfully: **yes**
- Success message was clear: **yes**

Result:
The saved-session feedback path worked end to end in this run.

### 8. Duplicate feedback protection

- Duplicate feedback re-tested: **yes**
- Duplicate response matched expectation: **yes**
- Exact duplicate message shown: `Feedback has already been submitted for this session.`

Result:
Duplicate feedback protection worked as expected on the saved session.

## Friction and supportability notes

### Friction observed

1. Sign-in leaves the local app and opens the Cognito Hosted UI, so the transition should be noted for first-time pilot users.
2. The `environment_profile` image-assisted flow failed in local dev with a `Body exceeded 1 MB limit` runtime error.
3. Saving from the candidate view surfaced `NEXT_REDIRECT` instead of clearly navigating, so save confirmation had to be verified afterward from the sessions list.
4. The current session output is structured text, but no visual drill diagrams are present. This was submitted as pilot feedback.
5. On the second feedback submit, `Flow mode` had reset to `Not specified`, but duplicate protection still triggered correctly at the session level.

### Supportability observations

1. Login-path behavior was observable and landed on the expected `/sessions/new` route.
2. The image-assisted failure exposed a visible and specific local runtime error that should be supportable in triage.
3. Save persistence was still verifiable from the saved sessions list and detail page despite the confusing immediate redirect behavior.
4. Duplicate feedback protection returned a clear already-submitted message.

## Failure-mode observations

Observed directly in this run:

- **Image-assisted failure:** yes
  `environment_profile` failed in local dev due to a body-size limit runtime error.
- **Save-path confusion:** yes
  The save attempt surfaced `NEXT_REDIRECT` in the current UI flow before persistence was verified separately.
- **Malformed feedback rejection:** not tested
- **Missing entitlements behavior:** not tested
- **Export failure:** not tested
- **Session generation failure:** not observed in the standard non-image path

## Boundary compliance check

- Stayed within Week 20 scope: **yes**
- Any auth, tenancy, entitlements, IAM, or CDK issue observed: **no**
- Any secrets, tokens, raw headers, emails, or PII omitted from notes: **yes**

Boundary note:
This run did not require or justify any auth-boundary, tenancy-boundary, entitlements-model, IAM, or CDK change.

## Explicit non-claims

Not exercised in this run:

- export path
- `setup_to_drill` image flow
- malformed feedback rejection
- missing-entitlements runtime behavior
- non-dev environment behavior

Not claimed from this run:

- broader observability coverage
- production readiness beyond the narrow exercised slice
- visual drill-diagram support
- successful image-assisted environment-profile behavior in local dev
- any non-dev rollout claim

## Evidence summary

This walkthrough run provides real local-dev evidence for the current Week 20 pilot flow across:

- approved coach login entry path
- successful protected landing on `/sessions/new`
- standard session generation
- saved-session persistence verification
- saved-session detail rendering
- saved-session feedback success
- duplicate feedback protection

This walkthrough run also records two important local-dev friction points honestly:

- image-assisted `environment_profile` failed due to a body-size runtime limit
- save-session UX surfaced `NEXT_REDIRECT` before persistence was verified separately

Overall, the run supports a narrow claim that the standard non-image shared Session Builder path is usable end to end in local dev, while the attempted image-assisted path and save-session redirect UX still show pilot-relevant friction that should remain explicitly documented.
