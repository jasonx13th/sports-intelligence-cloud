# Week 19 Day 3 — Failure Classification

## Purpose
Define how Week 19 evaluation failures should be classified so the harness can support clear pilot-readiness decisions.

This step converts raw run output into action categories that are small, reviewable, and useful for Week 20 planning.

## Goal
Sort failures into three groups:

1. must-fix before pilot
2. acceptable current limitation
3. later backlog

This keeps Week 19 product-first and prevents vague “we should improve AI quality” thinking.

## Classification groups

### 1. Must-fix before pilot
A failure belongs here if it would materially undermine coach trust, safety, or fail-closed platform behavior in a real pilot.

Examples:
- contract-validity failures on normal cases
- equipment-incompatible outputs treated as usable
- unsafe age-band outputs
- setup-faithfulness failures that materially distort the visible setup
- tenant spoof rejection failure
- repeated golden-candidate failure on core scenarios

Interpretation:
- these block pilot confidence
- these should be fixed before Week 20 pilot-readiness work is treated as complete

### 2. Acceptable current limitation
A failure belongs here if it is real, but bounded, understandable, and survivable for the current narrow product slice.

Examples:
- mild ambiguity in partial-visibility cases
- warning-level confidence limitations
- modest edit burden on non-golden cases
- bounded structure weakness in edge cases
- lower usefulness in deliberately difficult scenarios, when core safety and fail-closed behavior still hold

Interpretation:
- these do not block the pilot by default
- they should be documented clearly
- they should not be hidden or hand-waved

### 3. Later backlog
A failure belongs here if addressing it would require widening the product or platform beyond the current justified scope.

Examples:
- wanting broader conversational explanation
- wanting multi-image reasoning
- wanting richer visual understanding beyond current case design
- wanting advanced analytics/reporting around evaluation results
- wanting broader AI product behavior outside the shipped Session Builder flow

Interpretation:
- these are not Week 19 blockers
- these should be logged without expanding the current slice

## Classification rules

### Rule 1 — Safety and fail-closed issues always escalate
Anything affecting:
- age-band safety
- forbidden tenant input handling
- fail-closed rejection behavior
- materially misleading setup output

should default to **must-fix before pilot**.

### Rule 2 — Core golden-case instability matters
If a likely golden case fails in a repeated or important way, classify it conservatively.

Golden-case failure is more serious than one-off weakness in a non-golden edge case.

### Rule 3 — Warnings are not automatic blockers
A warning should not become a pilot blocker unless:
- it repeats across core categories
- it meaningfully harms coach usefulness
- it hides a deeper deterministic failure

### Rule 4 — Do not promote scope creep into blockers
A missing future feature is not a Week 19 failure unless it breaks the current shipped slice.

### Rule 5 — Keep product reality in view
The question is not:
- “is this perfect?”

The question is:
- “is this narrow shipped slice safe, credible, and useful enough for the next pilot step?”

## Suggested classification table

| Failure pattern | Default class | Notes |
|---|---|---|
| Invalid contract on positive case | Must-fix before pilot | Core reliability issue |
| Equipment mismatch accepted as usable | Must-fix before pilot | Breaks practical coach trust |
| Unsafe age-band output | Must-fix before pilot | Safety issue |
| Tenant spoof rejection fails | Must-fix before pilot | Non-negotiable boundary issue |
| Strong setup-faithfulness drift on image case | Must-fix before pilot | Undermines image-assisted credibility |
| Mild ambiguity warning on partial-visibility case | Acceptable current limitation | Document clearly |
| Moderate edit burden on non-golden case | Acceptable current limitation | Acceptable if bounded |
| One-off low usefulness on hard edge case | Acceptable current limitation | Monitor, do not overreact |
| Desire for broader explanation layer | Later backlog | Outside current slice |
| Desire for multi-image evaluation | Later backlog | Outside Week 19 scope |

## Output expectation
After reviewing a run, each failure reason or weak pattern should be assigned:

- classification
- short rationale
- whether it blocks pilot readiness
- whether it belongs in Week 19 fix scope or later backlog

## Example classification record

```json
{
  "failureReason": "unsafe_age_band",
  "classification": "must_fix_before_pilot",
  "pilotBlocking": true,
  "rationale": "Unsafe age-band mismatch undermines safe practical use.",
  "week19FixScope": true
}
```

## Non-negotiables
- safety issues are never downgraded for convenience
- tenancy-boundary issues are never treated as acceptable limitations
- current-slice limitations should be documented honestly
- backlog items should not expand Week 19 scope

## Acceptance criteria
- the three classification groups are explicit
- blocker vs non-blocker logic is explicit
- safety and fail-closed escalation rules are explicit
- golden-case seriousness is explicit
- the classification logic is clear enough to support pilot-threshold work
