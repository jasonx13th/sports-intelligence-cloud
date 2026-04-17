# Week 19 Day 2 — Equipment Compatibility Checks

## Purpose
Define the deterministic equipment-compatibility rules for the Week 19 lightweight AI evaluation runner.

These checks confirm whether an evaluated output stays compatible with the equipment explicitly available in the case input.

## Goal
Fail outputs that require equipment the coach does not have, assume extra setup without support, or drift beyond the bounded Week 19 product slice.

## What equipment compatibility covers
Equipment compatibility checks whether the evaluated result:

- uses only available equipment
- does not silently invent unavailable equipment
- stays practical for the stated setup
- remains usable within the stated constraints
- does not reward overcomplicated output when equipment is limited

## Source of truth for equipment
The source of truth is the sanitized case input.

Allowed equipment must come only from:
- `input.equipment`
- clearly allowed setup-visible equipment in the fixture definition
- bounded shared assumptions only if explicitly documented in the case

The runner must not assume additional equipment unless the case explicitly allows it.

## Core compatibility rules

### Rule 1 — No invented equipment
If the output requires equipment not present in the case input, it fails equipment compatibility.

Examples:
- output requires a full goal when only mini goals are available
- output requires ladders or poles when only cones and balls are listed
- output requires mannequins with no support in the case input

### Rule 2 — Equipment names must map cleanly
The runner should compare normalized equipment values.

Examples of normalized values:
- `cones`
- `balls`
- `bibs`
- `mini_goals`
- `goal`

The check should avoid failing only because of harmless wording variation.

### Rule 3 — Constraint fit matters
Even if equipment is technically present, the output can still fail if the required setup is unrealistic for the case.

Examples:
- too many goals for a compact indoor setup
- excessive station complexity for a low-equipment case
- elaborate equipment rotations unsupported by the scenario

### Rule 4 — Limited equipment should stay limited
Low-equipment cases should favor practical, simple output.

The runner should flag outputs that:
- inflate setup complexity
- depend on repeated hidden equipment assumptions
- drift away from the case’s practical constraints

### Rule 5 — Negative cases must fail clearly
If a case is intentionally designed to simulate equipment mismatch, the runner should record:
- `equipmentCompatible = false`
- stable reason code
- failed status unless the negative-case expectation is satisfied as designed

## Normalized equipment set
Initial normalized equipment set for Week 19:

- `cones`
- `balls`
- `bibs`
- `mini_goals`
- `goal`
- `markers`
- `poles`
- `ladders`

This list can stay narrow for Week 19 and expand later only if required.

## Stable reason codes
Use these reason codes where relevant:

- `equipment_incompatible`
- `invented_equipment_requirement`
- `unsupported_equipment_assumption`
- `setup_too_complex_for_equipment`
- `equipment_normalization_mismatch`

## Validation order
Equipment compatibility should run after contract validation and before rubric scoring.

Suggested order:

1. contract validation passes enough to continue
2. available equipment is normalized from case input
3. required equipment is normalized from evaluated output
4. missing or invented equipment is detected
5. setup complexity is checked against equipment reality
6. result is recorded in deterministic checks and failure reasons

## Pass criteria
A case passes equipment compatibility when:

- all required equipment is supported by the case input
- no invented equipment is required
- setup complexity is realistic for the available equipment
- output remains practical for the stated scenario

## Fail criteria
A case fails equipment compatibility when any of these is true:

- required equipment is missing
- output invents unsupported equipment
- setup depends on equipment not present
- complexity is unrealistic for the equipment available
- the case is a deliberate equipment-mismatch negative case

## Output expectation
The runner should record equipment outcomes in:

- `deterministicChecks.equipmentCompatible`
- `failedChecks`
- `failureReasons`
- `status`

## Notes
- this check is deterministic
- this check is coach-practical, not abstract
- this check should stay narrow and reviewable
- this check should not widen product scope

## Acceptance criteria
- equipment source of truth is explicit
- no-invented-equipment rule is explicit
- normalization expectations are explicit
- complexity-vs-equipment rule is explicit
- stable reason codes are defined
- the order is clear enough to guide implementation
