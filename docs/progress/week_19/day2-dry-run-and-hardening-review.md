# Week 19 Day 2 — Dry Run and Hardening Review

## Purpose
Define how the Week 19 lightweight AI evaluation harness should be dry-run once, reviewed, and hardened in a bounded way before Day 3 pilot-threshold work begins.

This is a review and correction note, not a scope-expansion step.

## Goal
Run the harness once across the frozen dataset, inspect the results, and make only narrow, justified fixes inside the harness or fixture layer.

## Dry-run objective
The first dry run should answer:

- does the runner execute end to end?
- does every case produce a structured result?
- are deterministic failures clearly visible?
- are failure reasons understandable?
- are warnings separated from failures?
- do rubric results look reasonable for positive cases?
- are negative boundary cases interpreted correctly?

## What to review after the dry run

### 1. Runner execution health
Confirm:
- the run completes
- all expected cases are evaluated
- no case is silently skipped
- timestamps and summary output are present

### 2. Result-shape consistency
Confirm:
- each case returns the frozen per-case result shape
- the run returns the frozen summary shape
- missing fields are treated as defects
- no ad hoc output fields are introduced without reason

### 3. Deterministic check quality
Review:
- contract validation results
- equipment compatibility results
- age-band safety results
- structure usability results
- setup faithfulness results

Look for:
- false passes
- false failures
- unclear check boundaries
- noisy reason codes

### 4. Negative-case behavior
Confirm:
- negative cases succeed only when fail-closed behavior is correctly detected
- tenant spoof rejection is clearly reported
- negative cases are not mixed into normal usefulness scoring
- rejection behavior remains explicit and reviewable

### 5. Rubric sanity
Confirm:
- rubric scores appear only where appropriate
- rubric averages are plausible
- strong deterministic failures are not hidden behind good scores
- low-confidence cases do not look falsely strong

### 6. Summary readability
Confirm:
- category-level quality patterns are visible
- top failure reasons are understandable
- golden-candidate performance is easy to read
- the run output is useful for Day 3 pilot-threshold work

## Allowed hardening after the dry run
Only bounded fixes are allowed at this step.

Allowed:
- fixture corrections
- reason-code cleanup
- validator clarification
- minor output-shape cleanup
- small scoring adjustments if clearly justified
- handling for noisy edge cases inside the frozen Week 19 scope

Not allowed:
- new product scope
- new runner subsystems
- infra changes
- IAM changes
- auth changes
- tenancy changes
- entitlements changes
- broad analytics/reporting expansion
- replacing deterministic checks with vague scoring

## Hardening rules

### Rule 1 — Fix the smallest layer possible
Prefer:
- fixture-local fixes first
- validator-local fixes second
- runner-summary fixes third

Do not widen the system when a narrow fix will solve the problem.

### Rule 2 — Keep reason codes stable
If a reason code is already understandable and useful, do not rename it without a strong reason.

### Rule 3 — Preserve deterministic-first behavior
Do not weaken hard failures just to improve summary appearance.

### Rule 4 — Keep negative cases fail-closed
Do not make rejection cases look like soft warnings.

### Rule 5 — Avoid Week 19 scope drift
Do not turn dry-run review into new feature work.

## Review checklist
After the first dry run, check:

1. total case count matches expected dataset size
2. all categories are represented
3. negative cases behave as intended
4. no normal case includes forbidden tenant input
5. failure reasons are readable
6. warnings are distinct from failures
7. rubric output appears only where appropriate
8. summary is readable enough for Day 3 threshold decisions

## Evidence to capture
Capture these outputs from the dry run:

- run timestamp
- total case count
- pass/fail/warning counts
- top failure reasons
- category summary
- golden-candidate summary
- list of bounded hardening fixes made after review

## Done definition for this step
This step is complete when:
- dry-run review criteria are explicit
- allowed vs disallowed hardening is explicit
- bounded-fix discipline is explicit
- evidence expectations are explicit
- Day 3 can begin without ambiguity

## Handoff
The next step is Day 3 failure classification and pilot-threshold definition.
