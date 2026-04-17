# Week 19 Day 3 — Golden Examples Selection

## Purpose
Freeze the initial golden-example set for the Week 19 lightweight AI evaluation harness.

These golden examples are the small repeat-regression set that should be rerun consistently to detect drift in the current SIC AI slice.

## Goal
Select a narrow, representative set of cases that are:

- realistic
- stable
- high-value for repeat testing
- aligned to likely pilot usage
- useful for detecting meaningful regression

## Selection principles
Golden examples should be:

- representative of core product behavior
- strong enough to expect repeat stability
- practical for coach-facing usefulness review
- narrow enough to rerun often
- balanced across the current Week 19 categories

Golden examples should not be:
- random
- overly edge-case-heavy
- dependent on future product scope
- inflated into a full benchmarking suite

## Selected golden examples

| Golden ID | Source case ID | Category | Why it belongs in the golden set |
|---|---|---|---|
| GOLDEN_001 | `eval_env_001` | `environment_profile` | Clear indoor environment case with strong constraint visibility and high practical usefulness |
| GOLDEN_002 | `eval_env_003` | `environment_profile` | Tight futsal-style environment that checks small-space realism and practical environment grounding |
| GOLDEN_003 | `eval_setup_001` | `setup_to_drill` | Clear setup-to-drill case that should reliably produce one practical activity seed |
| GOLDEN_004 | `eval_setup_002` | `setup_to_drill` | Strong faithfulness case for bounded drill seeding from visible layout |
| GOLDEN_005 | `eval_futsoc_001` | `fut_soccer` | Strong Fut-Soccer bias case testing shared Session Builder usefulness in a tight indoor context |
| GOLDEN_006 | `eval_ksc_001` | `ksc_like` | Pilot-adjacent realistic coach scenario with mixed equipment and limited space |
| GOLDEN_007 | `eval_ksc_002` | `ksc_like` | Real-world fallback scenario that tests practical usefulness under compact indoor constraints |
| GOLDEN_008 | `eval_neg_004` | `negative_boundary` | Non-negotiable tenant spoof rejection case for repeat fail-closed regression coverage |

## Why this set is balanced
This initial golden set covers:

- 2 `environment_profile` cases
- 2 `setup_to_drill` cases
- 1 `fut_soccer` case
- 2 `ksc_like` cases
- 1 `negative_boundary` case

Total golden examples:
- 8 cases

This stays inside the Week 19 target range of 5 to 10 golden examples.

## Selection rationale by category

### `environment_profile`
These golden cases should confirm:
- practical environment understanding
- bounded assumptions
- strong constraint fit for image-assisted intake

### `setup_to_drill`
These golden cases should confirm:
- one clear activity seed
- visible setup faithfulness
- no widening beyond the Week 18 drill-seed boundary

### `fut_soccer`
This golden case should confirm:
- shared Session Builder usefulness under a sport-pack bias
- realistic small-space pacing
- practical session structure

### `ksc_like`
These golden cases should confirm:
- pilot-adjacent usefulness
- realistic constraint handling
- coach-ready output quality

### `negative_boundary`
This golden case should confirm:
- fail-closed tenant-boundary behavior remains intact
- client-supplied tenant spoofing is still rejected
- the harness preserves security-critical regression coverage

## Promotion rules
A case should be promoted into the golden set only if it is:

- representative of a core workflow
- likely to be rerun often
- useful for catching meaningful regression
- stable enough to expect repeat evaluation value

A case should not be promoted if it is:
- too ambiguous
- too edge-case-specific
- mainly useful as exploratory coverage rather than regression coverage

## Golden-set usage rules
The golden set should be used for:

- repeat regression checks
- pilot-readiness confidence review
- fast reruns after bounded fixes
- future comparison when the Week 19 harness evolves

The golden set should not be used as:
- a substitute for the full dataset
- a broad benchmark leaderboard
- a justification for expanding scope

## Failure interpretation for golden examples
Golden-example failure should be treated conservatively.

Interpretation guidance:
- repeated golden-case failure is more serious than one-off non-golden failure
- golden-case safety failure is pilot-blocking
- golden-case faithfulness drift is high severity for image-assisted credibility
- golden negative-boundary failure is a hard stop

## Review note
This golden set is the **initial frozen Week 19 golden set**.

It can be revised later only with explicit rationale, and only if the change improves regression value without widening product scope.

## Acceptance criteria
- 5 to 10 golden examples are explicitly selected
- the set covers core Week 19 categories
- each selected case has a clear reason for inclusion
- at least one fail-closed boundary case is included
- the set is narrow enough for repeat regression use
