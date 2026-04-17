# Week 19 Day 2 — Setup Faithfulness Checks

## Purpose
Define the deterministic setup-faithfulness rules for the Week 19 lightweight AI evaluation runner.

These checks confirm whether an evaluated output stays meaningfully faithful to the visible setup or environment represented by the case input.

## Goal
Fail outputs that drift too far from the visible setup, invent unsupported layout details, or ignore important visible constraints in the source case.

## What setup faithfulness covers
Setup faithfulness checks whether the evaluated result:

- reflects the visible setup or environment closely enough to be credible
- uses equipment and layout features actually supported by the case
- avoids overclaiming confidence from partial or ambiguous inputs
- stays within the narrow Week 18 image-assisted product boundary
- produces practical output without inventing a different scenario

## What this check is not
This check is not:
- a general computer-vision benchmark
- pixel-level scene verification
- a broad semantic similarity score
- a claim that the model “understood the image perfectly”

It is only a bounded practical faithfulness check for the current SIC slice.

## Source of truth for faithfulness
The source of truth is the sanitized case definition, which may include:

- `input.imageFixture`
- `input.mode`
- `input.promptContext`
- `input.equipment`
- bounded scenario notes in the case description
- explicitly visible layout or environment details captured by the fixture definition

The runner should compare against the case definition, not against imagined hidden context.

## Core faithfulness rules

### Rule 1 — Visible equipment must not be ignored
If the case clearly includes visible equipment or layout elements, the output should not ignore them without a good bounded reason.

Examples:
- mini goals are visible but the output behaves as if no goals exist
- cone channels are visible but the returned drill ignores the working lanes
- clear indoor constraints are visible but the output behaves like a full outdoor pitch

### Rule 2 — Unsupported layout invention should fail
The output should fail if it invents meaningful layout structure not supported by the case.

Examples:
- assumes two full-width goals where none are visible
- assumes multiple stations in a compact single-area setup
- turns a small setup image into a full-session multi-zone design without support

### Rule 3 — Partial visibility should stay cautious
When the case is ambiguous or only partly visible, the output should stay bounded and cautious rather than overclaiming.

Examples:
- partial setup should surface assumptions instead of pretending certainty
- unclear spacing should not become exact tactical structure
- ambiguous boundaries should not produce overconfident layout claims

### Rule 4 — Setup-to-drill must stay narrow
For `setup_to_drill`, the output should remain one practical drill or activity seed.

It should fail faithfulness if it:
- widens into a full session without support
- introduces unrelated phases not grounded in the setup
- drifts away from the visible activity structure

### Rule 5 — Environment profile must stay environment-grounded
For `environment_profile`, the output should reflect:
- visible space reality
- visible equipment reality
- visible safety or constraint signals where relevant

It should fail faithfulness if it:
- ignores obvious environment constraints
- invents unsupported usable space
- assumes unsupported surfaces or boundaries with high confidence

### Rule 6 — Negative faithfulness cases must fail clearly
If a case is intentionally designed to simulate setup drift or unsupported assumptions, the runner should record:
- `setupFaithful = false`
- stable reason code
- failed status unless the negative-case expectation is satisfied as designed

## Category-specific interpretation

### `environment_profile`
A faithful result should:
- describe the usable environment in a practical way
- stay bounded around visible constraints
- avoid inflated certainty from weak evidence

### `setup_to_drill`
A faithful result should:
- map to one credible activity seed
- reflect the visible layout or equipment
- avoid turning a small setup into a broader plan than the case supports

### `fut_soccer`
Faithfulness matters less to raw image layout here unless the case explicitly includes setup-linked inputs, but the runner should still confirm:
- constraint fit remains credible
- small-space assumptions stay aligned to the case

### `ksc_like`
Faithfulness should focus on:
- realism against stated scenario constraints
- no invention of equipment or space conditions outside the case

## Stable reason codes
Use these reason codes where relevant:

- `setup_faithfulness_failed`
- `ignored_visible_equipment`
- `invented_layout_structure`
- `overconfident_from_partial_visibility`
- `environment_constraint_drift`
- `setup_to_drill_scope_drift`

## Validation order
Setup faithfulness should run after:
1. contract validation
2. equipment compatibility
3. age-band safety
4. structure usability

And before:
- rubric scoring

Suggested order:

1. identify whether the case requires faithfulness evaluation
2. inspect visible or fixture-defined setup/environment signals
3. compare evaluated output against supported layout and equipment reality
4. check for ignored visible signals or invented structure
5. check for overconfidence in ambiguous cases
6. record deterministic result
7. attach stable failure reason if needed

## Pass criteria
A case passes setup faithfulness when:

- the output remains credibly grounded in the case setup or environment
- no major visible equipment or layout signal is ignored
- no unsupported structure is invented
- ambiguous cases stay bounded and cautious
- the output stays within the expected mode boundary

## Fail criteria
A case fails setup faithfulness when any of these is true:

- visible setup or environment signals are ignored
- unsupported layout or space structure is invented
- ambiguous input is treated with unjustified certainty
- `setup_to_drill` widens beyond one supported activity seed
- environment reality is materially distorted
- the case is an intentional faithfulness-failure negative case

## Output expectation
The runner should record setup-faithfulness outcomes in:

- `deterministicChecks.setupFaithful`
- `failedChecks`
- `failureReasons`
- `status`

## Notes
- this check is deterministic-first
- this check must stay narrow and reviewable
- this check should not overclaim vision certainty
- this check protects the practical credibility of image-assisted outputs

## Acceptance criteria
- source of truth for faithfulness is explicit
- visible-signal and invented-layout rules are explicit
- partial-visibility handling is explicit
- mode-specific scope boundaries are explicit
- stable reason codes are defined
- validation order is clear enough to guide implementation
