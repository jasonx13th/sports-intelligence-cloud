# Week 19 Day 2 — Summary Output and Interpretation

## Purpose
Define how the Week 19 lightweight AI evaluation runner should summarize results and how those results should be interpreted.

This note does not change the runner result shape. It defines how to read the output in a repeatable, decision-friendly way.

## Goal
Turn per-case evaluation output into a small set of practical quality signals that help answer:

- is the current slice usable?
- where does it fail most often?
- which categories are strongest or weakest?
- are golden candidates stable enough for repeat testing?
- is the current system moving toward pilot readiness?

## Summary output requirements
Each runner execution should produce:

- total case count
- pass count
- fail count
- warning count
- overall pass rate
- category-level summary
- top failure reasons
- average rubric score for positive cases
- golden-candidate summary
- timestamped run record

## Minimum run summary sections

### 1. Overall run summary
This section should report:

- total cases evaluated
- passed cases
- failed cases
- warning cases
- overall pass rate

Purpose:
- provide a fast read on the whole run

### 2. Category summary
This section should report results grouped by:

- `environment_profile`
- `setup_to_drill`
- `fut_soccer`
- `ksc_like`
- `negative_boundary`

For each category, report:

- total
- passed
- failed
- warnings
- average rubric score where applicable

Purpose:
- show where quality is strongest or weakest

### 3. Failure reason summary
This section should report the most common stable failure reasons.

Examples:
- `invalid_contract_shape`
- `equipment_incompatible`
- `unsafe_age_band`
- `structure_unusable`
- `setup_faithfulness_failed`
- `tenant_spoof_rejected`

Purpose:
- show what is actually breaking, not just that something broke

### 4. Golden-candidate summary
This section should report:

- total golden candidates evaluated
- passed golden candidates
- failed golden candidates
- warning golden candidates

Purpose:
- show which likely repeat-regression cases are stable enough to promote later

### 5. Usefulness summary
This section should report rubric results for positive cases only.

Recommended fields:
- overall average rubric score
- average score by category
- lowest-scoring dimension
- highest-scoring dimension
- count of positive cases below usable threshold

Purpose:
- keep the usefulness signal practical and readable

## Interpretation rules

### Rule 1 — Deterministic failures lead
The first thing a reviewer should check is deterministic failure count and reason distribution.

Do not treat a strong rubric average as success if deterministic failures remain high.

### Rule 2 — Negative cases are not normal passes
`negative_boundary` results should be interpreted differently.

A negative case is successful only when the fail-closed or rejection behavior happens as expected.

Example:
- tenant spoof rejection is a good result if it is rejected correctly

### Rule 3 — Warning is not the same as fail
Warnings should surface bounded concerns such as:
- partial visibility ambiguity
- minor constraint drift
- limited confidence in faithfulness

Warnings matter, but they should not be mixed with hard failures.

### Rule 4 — Usefulness should stay secondary to safety
Rubric scoring helps measure coach usefulness, but it must not override:
- contract failure
- equipment incompatibility
- unsafe age-band result
- faithfulness failure
- fail-closed tenant rejection requirements

### Rule 5 — Category patterns matter more than isolated noise
One weak case does not define the whole slice.

The reviewer should look for:
- repeated failure types
- category-wide weakness
- golden-case instability
- systematic drift in one validator area

## Suggested interpretation bands

### Overall pass rate
Initial Week 19 interpretation guidance:

- **0.90+** = strong run
- **0.75 to 0.89** = workable but needs targeted improvement
- **below 0.75** = weak for pilot confidence

These are provisional and can be finalized on Day 3.

### Average rubric score
Initial Week 19 interpretation guidance:

- **4.0+** = strong practical usefulness
- **3.0 to 3.9** = usable with edits
- **below 3.0** = weak practical usefulness

### Golden-candidate stability
Initial guidance:

- most golden candidates should pass
- repeated golden-case failure should block promotion into the frozen golden set
- golden-case failure matters more than one-off non-golden warning

## Reviewer checklist
After each run, review in this order:

1. overall pass/fail/warning counts
2. top deterministic failure reasons
3. category-level weak spots
4. golden-candidate stability
5. usefulness score patterns
6. any fail-closed or tenant-boundary issue

## What this summary is not
This summary is not:
- a production analytics dashboard
- a long-term observability system
- a broad AI benchmarking suite
- a replacement for Day 3 pilot-threshold decisions

It is a lightweight Week 19 decision aid.

## Non-negotiables
- deterministic failures come first
- negative-case success must stay fail-closed
- usefulness scoring must remain secondary
- summary interpretation must stay narrow and reviewable
- no platform expansion should be implied by the reporting layer

## Acceptance criteria
- required summary sections are explicit
- negative-case interpretation is explicit
- warning vs fail interpretation is explicit
- pass-rate and usefulness guidance is explicit
- reviewer order is clear enough to guide Day 2 implementation and review
