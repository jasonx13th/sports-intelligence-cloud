# Week 21 Day 7 - Walkthrough Script

## Purpose

Run the final Week 21 coach-workspace walkthrough for Sports Intelligence Cloud / Club Vivo and capture evidence that the Week 21 hardening slice is coherent, coach-facing, and still inside the platform boundaries.

This is a readiness walkthrough, not a new feature scope.

## Scope Guard

Stay inside the shipped Week 21 flow:

- authenticated Club Vivo coach workspace
- Home Quick Session entry
- detailed Session Builder entry
- coach-owned Teams context
- saved Sessions library
- saved-session detail output
- saved-session feedback
- saved-session PDF export action

Do not use the walkthrough to restart:

- auth changes
- tenancy changes
- entitlement changes
- IAM or CDK work
- client-supplied tenant scope
- public `POST /session-packs` contract expansion
- session ownership changes
- image-assisted intake
- methodology upload or source-mode

## Pre-Walkthrough Checklist

- Frontend typecheck passes from `apps/club-vivo` with `cmd /c npx tsc --noEmit`.
- `git diff --check` is clean.
- The walkthrough user is a valid authenticated coach.
- Any data shown is local-dev, sanitized, or pilot-safe.
- The operator has one coach-owned team available, or creates one through the existing Teams setup flow before starting.

## Walkthrough Path

### 1. Home

Start at `/home`.

Confirm:

- the page reads as a coach workspace
- Quick Session is the fast first action
- recent saved sessions render without exposing tenant controls
- team-manager work is not reintroduced as a Day 7 build item

### 2. Quick Session

Use the Home Quick Session entry with a realistic short prompt.

Example:

```text
20 minute finishing drill for U14s, lots of reps, cones and small goals
```

Confirm:

- Quick Session creates a review screen
- the generated session has a coach-readable title
- duration interpretation is clear
- the review screen shows one candidate
- saving redirects to the saved-session detail page

### 3. Saved Quick Session Output

On the saved-session detail page, confirm:

- the header clearly says it is a Quick Session output
- Back to sessions remains visible
- Export coach PDF is visible and reads as a handout action
- the coach-ready field-plan summary is visible
- activity cards show run order, timing window, duration, and delivery guidance
- feedback asks for post-field-test evidence

### 4. Sessions Library

Return to `/sessions`.

Confirm:

- the saved Quick Session appears with its origin label
- objective tags remain hidden for Quick Session cards where intended
- the New Session Builder and Quick Session entry actions are still available
- no client tenant controls are visible

### 5. Session Builder

Open `/sessions/new`.

Use an existing team context and a realistic objective.

Confirm:

- Start Here team selection remains the team context source
- Session Builder still renders as the detailed path
- it generates one candidate
- saving redirects to the saved-session detail page

### 6. Saved Session Builder Output

On the saved detail page for the builder-created session, confirm:

- the header clearly says it is a Session Builder output
- source labeling distinguishes Session Builder from Quick Session
- team, objective, environment, duration, equipment, and objective tags remain readable
- activity cards preserve coach-ready timing and delivery guidance
- Export coach PDF and Back to sessions remain visible
- feedback remains available without changing ownership behavior

## Evidence To Capture

Capture the following:

- final `git status --short`
- final `git diff --stat`
- frontend typecheck result
- `git diff --check` result
- notes for any intentionally parked work
- screenshots or screen-recording notes if a human operator runs the UI walkthrough

## Pass Criteria

Day 7 is ready to close when:

- Quick Session and Session Builder both save into coach-ready detail output
- saved-session detail clearly communicates the origin and activity timing
- PDF export action is visible and coach-facing
- feedback guidance is clearer and still lightweight
- no Week 21 hard boundary was widened
- validation commands pass, or any failure is documented honestly
