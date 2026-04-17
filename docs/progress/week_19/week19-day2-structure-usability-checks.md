# Week 19 Day 2 — Structure Usability Checks

## Purpose
Define the deterministic structure-usability rules for the Week 19 lightweight AI evaluation runner.

These checks confirm whether an evaluated output is structured well enough to be practically usable by a coach inside the current SIC Session Builder product slice.

## Goal
Fail outputs that are malformed, incomplete, incoherent, or too weakly structured to be realistically useful, even if they technically pass basic contract validation.

## What structure usability covers
Structure usability checks whether the evaluated result:

- has the minimum expected planning structure
- is organized clearly enough to be run by a coach
- keeps the session or drill internally coherent
- does not omit essential practical blocks
- stays within the current bounded product shape

## What this check is not
This check is not:
- a style or wording benchmark
- a broad pedagogy evaluator
- a creativity score
- a replacement for coach judgment

It is only a narrow practical structure check.

## Core structure rules

### Rule 1 — Minimum usable structure must exist
The output must contain enough structure for the case type being evaluated.

Examples:
- a session case should include a usable sequence of activities or blocks
- a setup-to-drill case should include one clear activity seed
- an environment-profile case should include a structured usable profile, not vague free text only

### Rule 2 — Duration logic must be coherent
If duration is part of the case, the returned structure should not be obviously incoherent.

Examples of failure:
- activity durations do not add up in a believable way
- drill structure is too sparse for the stated duration
- session duration is badly mismatched to the returned plan

### Rule 3 — Required practical fields must not be missing
The output should not omit essential practical coaching information.

Examples:
- activity without setup or instructions
- session without usable sequencing
- structured profile without meaningful environment constraints
- drill seed without a clear runnable action

### Rule 4 — Internal organization must be coherent
The output should not contradict itself internally.

Examples:
- setup says one thing and instructions imply another
- player organization conflicts with the available space
- progression assumes a structure not established in the setup
- sequence order is confusing or broken

### Rule 5 — Over-thin output should fail
A technically valid but overly thin output should fail structure usability if a coach could not use it practically.

Examples:
- vague one-line activity with no runnable detail
- incomplete profile missing actionable environment signals
- generic filler that does not support actual session use

### Rule 6 — Negative structure cases must fail clearly
If a case is intentionally designed to simulate weak or broken structure, the runner should record:
- `structureUsable = false`
- stable reason code
- failed status unless the negative-case expectation is satisfied as designed

## Case-type interpretation

### `environment_profile`
A usable structure should include:
- practical environment understanding
- bounded assumptions where needed
- enough usable detail to support later coach confirmation and generation

### `setup_to_drill`
A usable structure should include:
- one clear drill or activity seed
- enough setup and instruction detail to be runnable
- no widening into a full session unless the case explicitly supports that

### `fut_soccer`
A usable structure should include:
- a coherent session shape
- realistic pacing for tight-space or fast-rotation contexts
- practical coach-ready organization

### `ksc_like`
A usable structure should include:
- a realistic session layout for the stated constraints
- enough detail to be practically useful
- no overcomplication beyond the case scenario

## Stable reason codes
Use these reason codes where relevant:

- `structure_unusable`
- `missing_required_structure`
- `duration_incoherent`
- `missing_practical_fields`
- `internally_incoherent_structure`
- `output_too_thin_to_run`

## Validation order
Structure usability should run after:
1. contract validation
2. equipment compatibility
3. age-band safety

And before:
- rubric scoring

Suggested order:

1. identify case type
2. inspect minimum structure for that case type
3. check duration coherence where relevant
4. check required practical fields
5. check internal organization for contradictions
6. record deterministic result
7. attach stable failure reason if needed

## Pass criteria
A case passes structure usability when:

- the output has enough practical structure for its case type
- organization is coherent
- required practical elements are present
- duration is believable where relevant
- a coach could realistically use the output without structural reconstruction

## Fail criteria
A case fails structure usability when any of these is true:

- minimum usable structure is missing
- duration is badly incoherent
- essential practical elements are missing
- structure contradicts itself
- output is too thin to run
- the case is an intentional weak-structure negative case

## Output expectation
The runner should record structure-usability outcomes in:

- `deterministicChecks.structureUsable`
- `failedChecks`
- `failureReasons`
- `status`

## Notes
- this check is deterministic-first
- this check protects coach usefulness
- this check must stay narrow and reviewable
- this check must not expand the product boundary

## Acceptance criteria
- minimum usable structure is explicit
- case-type interpretation is explicit
- duration and coherence rules are explicit
- stable reason codes are defined
- validation order is clear enough to guide implementation
