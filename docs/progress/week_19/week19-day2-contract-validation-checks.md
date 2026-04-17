# Week 19 Day 2 — Contract Validation Checks

## Purpose
Define the deterministic contract-validation rules for the Week 19 lightweight AI evaluation runner.

These checks are the first validation layer in the runner. They confirm whether a case output matches the frozen Week 19 evaluation shape closely enough to be evaluated further.

## Goal
Fail fast on malformed, incomplete, or structurally invalid outputs before equipment, safety, usefulness, or faithfulness scoring is considered.

## What contract validation covers
Contract validation checks whether the evaluated result includes the minimum expected structure for the case being scored.

It should verify:

- required top-level fields exist
- required field types are correct
- category is allowed
- positive vs negative case flags are coherent
- expected deterministic check fields are present
- expected failure reason handling is coherent
- rubric hints are present for positive cases
- rubric hints are empty or omitted for negative cases
- no forbidden tenant input appears in normal cases

## Required base fields
Every case must include:

- `id`
- `category`
- `title`
- `description`
- `input`
- `expectedChecks`
- `goldenCandidate`
- `negativeCase`
- `expectedFailureReason`

Positive cases must also include:
- `rubricHints`

Negative cases may use:
- empty `rubricHints`
- populated `expectedFailureReason`

## Allowed categories
The only allowed category values are:

- `environment_profile`
- `setup_to_drill`
- `fut_soccer`
- `ksc_like`
- `negative_boundary`

Any other category should fail contract validation.

## Positive-case rules
A positive case must:

- use one of the positive categories
- set `negativeCase` to `false`
- set `expectedFailureReason` to `null`
- include populated `rubricHints`
- include all deterministic expected-check fields

## Negative-case rules
A negative case must:

- use category `negative_boundary`
- set `negativeCase` to `true`
- include a stable non-null `expectedFailureReason`
- not be treated as a normal usefulness case
- still include a valid base structure unless the test is intentionally malformed

## Deterministic expected-check fields
The runner should require these keys inside `expectedChecks`:

- `contractValid`
- `equipmentCompatible`
- `ageBandSafe`
- `setupFaithful`
- `structureUsable`

Missing keys should fail contract validation.

## Forbidden tenant-input rule
Normal positive cases must not include:

- `tenantId`
- `tenant_id`
- `x-tenant-id`

The only exception is the single clearly labeled tenant spoof rejection case inside `negative_boundary`.

If a normal case includes client-supplied tenant input, it must fail contract validation.

## Stable contract-failure reason codes
Use these reason codes when relevant:

- `invalid_contract_shape`
- `missing_required_field`
- `invalid_category`
- `invalid_positive_case_shape`
- `invalid_negative_case_shape`
- `missing_expected_check_key`
- `invalid_rubric_shape`
- `forbidden_tenant_input`

## Validation order
Contract validation should run in this order:

1. top-level shape exists
2. required fields exist
3. field types are valid
4. category is allowed
5. positive vs negative case coherence is valid
6. `expectedChecks` keys are complete
7. rubric shape is valid for the case type
8. forbidden tenant input rule is enforced

## Pass criteria
A case passes contract validation only when:

- required structure is present
- all required fields are valid
- category is allowed
- case-type rules are coherent
- expected-check fields are complete
- rubric handling matches case type
- no forbidden normal-case tenant input exists

## Fail criteria
A case fails contract validation when any of these is true:

- required field is missing
- field type is wrong
- category is unsupported
- positive case is marked like a negative case
- negative case is missing failure reason
- expectedChecks is incomplete
- rubricHints shape is invalid
- normal case contains client-supplied tenant input

## Output expectation
The runner should record contract-validation outcomes in:

- `deterministicChecks.contractValid`
- `failedChecks`
- `failureReasons`
- `status`

## Notes
- contract validation is deterministic
- contract validation runs before all other checks
- contract validation does not score usefulness
- contract validation must stay narrow and reviewable

## Acceptance criteria
- required fields are explicit
- positive vs negative rules are explicit
- allowed categories are explicit
- forbidden tenant-input handling is explicit
- stable reason codes are defined
- the validation order is clear enough to guide implementation
