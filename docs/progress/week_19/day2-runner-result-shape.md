# Week 19 Day 2 — Runner Result Shape

## Purpose
Freeze the expected output shape for the Week 19 lightweight AI evaluation runner.

This defines:
- the per-case result format
- the run-summary format
- the minimum fields needed for repeatable review

## Per-case result shape

```json
{
  "caseId": "eval_env_001",
  "category": "environment_profile",
  "title": "Small indoor court with cones and mini goals",
  "status": "pass",
  "deterministicChecks": {
    "contractValid": true,
    "equipmentCompatible": true,
    "ageBandSafe": true,
    "setupFaithful": true,
    "structureUsable": true
  },
  "failedChecks": [],
  "failureReasons": [],
  "rubricScores": {
    "runnableToday": 5,
    "clarity": 4,
    "ageAppropriate": 5,
    "constraintFit": 5,
    "editBurden": 4,
    "averageScore": 4.6
  },
  "goldenCandidate": true,
  "negativeCase": false,
  "scorerNote": "Strong practical output with clear constraint fit.",
  "warnings": [],
  "evaluatedAt": "2026-04-17T00:00:00Z"
}
```

## Per-case field definitions

### `caseId`
- required
- maps directly to the frozen evaluation case ID

### `category`
- required
- must match the source case category

### `title`
- required
- copied from the source case for easy review

### `status`
- required
- allowed values:
  - `pass`
  - `fail`
  - `warning`

Interpretation:
- `pass` = meets deterministic requirements for the case
- `fail` = fails one or more hard checks
- `warning` = technically passes core checks but has bounded concerns worth surfacing

### `deterministicChecks`
- required
- records actual evaluation outcomes for:
  - `contractValid`
  - `equipmentCompatible`
  - `ageBandSafe`
  - `setupFaithful`
  - `structureUsable`

### `failedChecks`
- required
- list of failed deterministic check keys
- empty list if none fail

### `failureReasons`
- required
- stable reason code list
- examples:
  - `invalid_contract_shape`
  - `equipment_incompatible`
  - `unsafe_age_band`
  - `setup_faithfulness_failed`
  - `tenant_spoof_rejected`

### `rubricScores`
- required for positive cases
- optional or empty for negative boundary cases
- includes:
  - `runnableToday`
  - `clarity`
  - `ageAppropriate`
  - `constraintFit`
  - `editBurden`
  - `averageScore`

### `goldenCandidate`
- required
- copied from the source case

### `negativeCase`
- required
- copied from the source case

### `scorerNote`
- optional but recommended
- short explanation for reviewers

### `warnings`
- optional
- list of non-fatal concerns
- examples:
  - `ambiguous_boundary_assumption`
  - `partial_visibility_limited_confidence`
  - `minor_constraint_drift`

### `evaluatedAt`
- required
- timestamp for the run record

## Run-summary shape

```json
{
  "runId": "week19-eval-run-001",
  "totalCases": 21,
  "passedCases": 15,
  "failedCases": 4,
  "warningCases": 2,
  "passRate": 0.714,
  "categorySummary": {
    "environment_profile": {
      "total": 5,
      "passed": 4,
      "failed": 0,
      "warnings": 1,
      "averageScore": 4.1
    },
    "setup_to_drill": {
      "total": 5,
      "passed": 4,
      "failed": 1,
      "warnings": 0,
      "averageScore": 4.0
    },
    "fut_soccer": {
      "total": 4,
      "passed": 3,
      "failed": 0,
      "warnings": 1,
      "averageScore": 4.2
    },
    "ksc_like": {
      "total": 3,
      "passed": 3,
      "failed": 0,
      "warnings": 0,
      "averageScore": 4.3
    },
    "negative_boundary": {
      "total": 4,
      "passed": 4,
      "failed": 0,
      "warnings": 0,
      "averageScore": null
    }
  },
  "topFailureReasons": [
    "equipment_incompatible",
    "unsafe_age_band"
  ],
  "goldenCandidateSummary": {
    "total": 6,
    "passed": 5,
    "failed": 1
  },
  "generatedAt": "2026-04-17T00:00:00Z"
}
```

## Run-summary field definitions

### `runId`
- required
- stable identifier for the full evaluation run

### `totalCases`
- required
- total evaluated cases in the run

### `passedCases`
- required
- count of cases with `status = pass`

### `failedCases`
- required
- count of cases with `status = fail`

### `warningCases`
- required
- count of cases with `status = warning`

### `passRate`
- required
- decimal pass rate across the run

### `categorySummary`
- required
- grouped results by frozen case category

### `topFailureReasons`
- required
- most common stable reason codes from failed cases

### `goldenCandidateSummary`
- required
- tracks how likely future golden cases are performing

### `generatedAt`
- required
- timestamp of the summary record

## Result interpretation rules

### Rule 1
Deterministic failures must appear in:
- `failedChecks`
- `failureReasons`
- `status`

### Rule 2
Negative boundary cases should be interpreted as successful only when they fail in the expected fail-closed way.

### Rule 3
Rubric scores must never hide deterministic failures.

### Rule 4
Warnings should surface bounded concerns without pretending the case fully failed.

## Acceptance criteria
- per-case result shape is frozen
- run-summary shape is frozen
- stable reason-code handling is explicit
- negative-case handling is explicit
- the output shape is narrow enough to guide Day 2 validator work
