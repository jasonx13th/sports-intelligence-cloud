# Week 19 Day 2 — Runner Boundary

## Purpose
Define the boundary for the Week 19 lightweight AI evaluation runner before validator logic is implemented.

This runner exists to evaluate the already-defined Week 19 dataset against the current SIC Session Builder product slice. It is a local, bounded evaluation tool, not a new product subsystem.

## Runner goal
Run sanitized evaluation cases and produce structured pass/fail results that help measure practical coaching usefulness and pilot readiness.

## In scope
The runner is allowed to:
- load frozen evaluation cases
- execute evaluation cases against the current Week 19 harness boundary
- run deterministic checks first
- apply simple coach-usefulness scoring after deterministic checks
- emit structured per-case results
- emit run-level summary results
- surface stable failure reason codes
- support repeatable local execution

## Out of scope
The runner must not:
- create a new production API surface
- introduce a new AI workflow
- change Session Builder runtime behavior
- change auth, entitlements, or tenancy boundaries
- add infra, IAM, CDK, or analytics platform dependencies
- depend on dashboards, queues, or background workers
- become a general benchmarking framework
- evaluate features outside the current shipped SIC slice

## Runner inputs
The runner consumes:
- frozen evaluation case files
- frozen rubric shape
- deterministic validation rules
- optional local fixture references
- current shared Session Builder evaluation boundary

The runner must consume only sanitized data.

## Runner outputs
The runner produces:
- per-case structured result records
- stable pass/fail status
- deterministic check outcomes
- rubric scores where applicable
- stable failure reason codes where applicable
- run summary output

## Core flow
The runner flow is:

1. Load evaluation cases
2. Validate fixture shape enough to start evaluation
3. Execute case against the current harness boundary
4. Run deterministic checks
5. Record pass/fail and reason codes
6. Apply rubric scoring only where appropriate
7. Emit per-case results
8. Emit run summary

## Deterministic-first rule
The runner must always apply deterministic checks before rubric scoring.

Examples of deterministic-first checks:
- contract validity
- equipment compatibility
- age-band safety
- setup faithfulness where required
- structure usability

If a case fails a hard deterministic rule, that failure must be visible in the result before any subjective score is considered.

## Rubric rule
Rubric scoring is secondary.

The rubric exists to measure practical usefulness, not to hide hard failures.

The runner must never allow:
- a safety failure to appear acceptable because of a high rubric score
- an invalid contract to appear acceptable because the idea was good
- a tenancy-boundary rejection case to be treated as a normal weak score

## Category coverage
The runner must support:
- `environment_profile`
- `setup_to_drill`
- `fut_soccer`
- `ksc_like`
- `negative_boundary`

Negative cases must remain clearly separated from positive usability scoring.

## Execution mode
The runner should be:
- local-first
- lightweight
- synchronous
- simple to rerun
- realistic for a solo builder

It should not require new cloud infrastructure to provide value in Week 19.

## Non-negotiables
- keep Session Builder as the shared core
- no client-trusted tenant input
- no normal fixture may include `tenantId`, `tenant_id`, or `x-tenant-id`
- one labeled tenant spoof rejection case may exist only as a negative case
- no platform expansion through the evaluation harness
- no infra/IAM/auth/tenancy/entitlements drift

## Done definition for this step
This step is complete when:
- runner responsibilities are explicit
- runner non-goals are explicit
- input and output boundaries are explicit
- deterministic-first behavior is explicit
- rubric order is explicit
- local-first execution is explicit
- no product or platform expansion is implied

## Handoff
The next step is to freeze the expected per-case result shape and run-summary shape for runner output.
