# Week 19 Day 1 — Evaluation Case Schema

## Purpose
Freeze the base schema for Week 19 evaluation cases so fixtures, runner logic, and reporting all use the same stable shape.

This schema is intentionally small and reviewable. It supports the current Week 19 scope only.

## Schema goals
- support shipped Session Builder AI flows
- support deterministic checks first
- support simple coach-usefulness scoring
- keep fixtures sanitized
- avoid product or platform expansion

## Base case shape

```json
{
  "id": "eval_env_001",
  "category": "environment_profile",
  "title": "Small indoor court with cones and mini goals",
  "description": "Sanitized evaluation case for image-assisted environment profiling.",
  "input": {
    "mode": "environment_profile",
    "imageFixture": "fixtures/images/env-small-indoor-001.jpg",
    "promptContext": "U11 session, limited indoor space, cones and mini goals available."
  },
  "expectedChecks": {
    "contractValid": true,
    "equipmentCompatible": true,
    "ageBandSafe": true,
    "setupFaithful": true,
    "structureUsable": true
  },
  "rubricHints": {
    "runnableToday": 4,
    "clarity": 4,
    "ageAppropriate": 4,
    "constraintFit": 4,
    "editBurden": 2
  },
  "goldenCandidate": false,
  "negativeCase": false,
  "expectedFailureReason": null,
  "notes": [
    "Sanitized fixture",
    "No real tenant or user data"
  ]
}
```

## Field definitions

### `id`
- required
- unique per case
- stable across reruns
- recommended prefixes:
  - `eval_env_###`
  - `eval_setup_###`
  - `eval_futsoc_###`
  - `eval_ksc_###`
  - `eval_neg_###`

### `category`
- required
- allowed values:
  - `environment_profile`
  - `setup_to_drill`
  - `fut_soccer`
  - `ksc_like`
  - `negative_boundary`

### `title`
- required
- short human-readable case name

### `description`
- required
- one or two sentences describing the scenario and intent

### `input`
- required
- sanitized input payload or fixture reference
- may include:
  - `mode`
  - `imageFixture`
  - `promptContext`
  - `sessionInput`
  - `sportPack`
  - `ageBand`
  - `durationMin`
  - `equipment`
- must not include real secrets or live identifiers

### `expectedChecks`
- required
- boolean expectations for deterministic validation
- initial supported keys:
  - `contractValid`
  - `equipmentCompatible`
  - `ageBandSafe`
  - `setupFaithful`
  - `structureUsable`

### `rubricHints`
- required for positive cases
- simple scoring guidance for later coach-usefulness scoring
- expected 1–5 values for:
  - `runnableToday`
  - `clarity`
  - `ageAppropriate`
  - `constraintFit`
  - `editBurden`

### `goldenCandidate`
- required
- boolean
- marks cases that may later be promoted into the frozen golden set

### `negativeCase`
- required
- boolean
- true only for rejection or fail-closed boundary cases

### `expectedFailureReason`
- required
- `null` for normal positive cases
- stable reason code string for negative cases, for example:
  - `invalid_contract_shape`
  - `equipment_incompatible`
  - `unsafe_age_band`
  - `tenant_spoof_rejected`

### `notes`
- optional
- plain-language fixture notes
- no sensitive data

## Schema rules

### Positive cases
Positive cases must:
- use one of the shipped categories
- include realistic sanitized inputs
- include full `expectedChecks`
- include full `rubricHints`
- set `negativeCase` to `false`
- set `expectedFailureReason` to `null`

### Negative cases
Negative cases must:
- use category `negative_boundary`
- set `negativeCase` to `true`
- include `expectedFailureReason`
- clearly represent rejection or fail-closed behavior
- never be mixed into normal pass expectations

## Sanitization rules
- no real tenant IDs
- no real names, emails, tokens, or URLs
- no live bucket names
- no normal case may include `tenantId`, `tenant_id`, or `x-tenant-id`
- one tenant spoof rejection case may exist only as a clearly labeled negative case

## Naming convention
Recommended file naming once fixtures are added:
- `environment_profile.eval.json`
- `setup_to_drill.eval.json`
- `fut_soccer.eval.json`
- `ksc_like.eval.json`
- `negative_boundary.eval.json`

## Acceptance criteria
- one stable case shape is defined
- positive vs negative case handling is explicit
- deterministic check fields are frozen
- rubric hint fields are frozen
- sanitization rules are explicit
- schema is narrow enough to guide Day 1 fixture creation
