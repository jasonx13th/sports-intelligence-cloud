# AI Evaluation Harness — Week 19

## Status
Week 19 architecture/process note

## Purpose
Define the lightweight AI evaluation harness for the current SIC Session Builder AI slice.

This harness exists to measure practical coaching usefulness and bounded output quality for the shipped Week 18 image-assisted intake and shared Session Builder flow. It is not a new product surface, not a general benchmarking framework, and not a broad AI platform subsystem.

## Why this exists
Week 18 added image-assisted intake v1 inside the shared Session Builder workflow. That created a real, narrow AI-assisted product slice with two supported image modes:

- `environment_profile`
- `setup_to_drill`

Week 19 adds the smallest useful evaluation layer on top of that shipped slice so SIC can:

- measure whether outputs are practically useful
- detect repeat failure patterns
- preserve fail-closed boundaries
- define pilot-readiness thresholds
- freeze a small golden regression set before Week 20

## Scope
The Week 19 harness evaluates only the current narrow SIC AI slice:

- `environment_profile` cases
- `setup_to_drill` cases
- Fut-Soccer-biased shared Session Builder cases
- KSC-like practical coaching scenarios
- fail-closed negative boundary cases

The harness is intentionally narrow.

## Non-goals
This harness does not:

- create a new production API
- create a new coach-facing UI
- expand the chatbot surface
- introduce RAG
- introduce a general-purpose model benchmark
- replace real product feedback
- widen the Session Builder product boundary
- change auth, tenancy, entitlements, IAM, or infra

## Design principles
The harness follows these rules:

- product-first
- deterministic checks first
- coach usefulness second
- local-first execution
- low-cost by default
- narrow and reviewable
- fail-closed on boundary cases
- no client-trusted tenant input
- no platform expansion through evaluation work

## Evaluation categories
The harness supports these frozen categories:

- `environment_profile`
- `setup_to_drill`
- `fut_soccer`
- `ksc_like`
- `negative_boundary`

These categories reflect current shipped behavior plus realistic pilot-adjacent usage.

## Inputs
The harness consumes:

- sanitized evaluation case definitions
- frozen case schema
- frozen coach-usefulness rubric
- deterministic validation rules
- frozen golden-example selection
- optional local fixture references

All evaluation inputs must remain sanitized.

## Output types
The harness produces:

- per-case structured result records
- deterministic check outcomes
- stable failure reason codes
- rubric scores for positive cases
- run-level summary output
- golden-candidate summary
- pilot-readiness interpretation support

## Core runner flow
The evaluation flow is:

1. load frozen evaluation cases
2. validate case shape enough to begin evaluation
3. execute the current harness boundary
4. run deterministic checks
5. record pass, fail, or warning
6. apply rubric scoring where appropriate
7. emit per-case results
8. emit run summary
9. classify weak patterns for pilot-readiness review

## Deterministic validation layers
The harness uses these deterministic checks first:

### 1. Contract validation
Confirms:
- required structure exists
- category is valid
- positive vs negative case shape is coherent
- expected-check fields are present
- forbidden tenant input does not appear in normal cases

### 2. Equipment compatibility
Confirms:
- output does not require unavailable equipment
- normalized equipment mapping stays bounded
- low-equipment cases remain practical

### 3. Age-band safety
Confirms:
- output is appropriate for the stated age band
- intensity does not drift too high
- progression complexity stays bounded
- unsafe load or contact assumptions are not accepted

### 4. Structure usability
Confirms:
- output is practically usable
- essential structural elements are present
- duration logic is coherent where relevant
- output is not too thin to run

### 5. Setup faithfulness
Confirms:
- image-assisted output stays credibly grounded in visible setup or environment
- unsupported layout invention is rejected
- ambiguous cases remain bounded
- `setup_to_drill` stays inside one drill/activity seed scope

## Rubric layer
After deterministic checks, the harness applies a small usefulness rubric for positive cases.

Rubric dimensions:

- runnable today
- clarity
- age appropriateness
- constraint fit
- edit burden

The rubric is a usefulness layer, not a safety override.

## Result interpretation
The harness uses three result states:

- `pass`
- `fail`
- `warning`

Interpretation rules:

- deterministic failures lead
- warnings remain visible but separate from fails
- negative boundary cases are successful only when they fail in the expected fail-closed way
- rubric scores never override hard deterministic failures

## Negative boundary handling
Negative cases exist to confirm fail-closed behavior.

Current negative coverage includes:

- invalid contract shape
- equipment incompatibility
- unsafe age-band mismatch
- tenant spoof rejection

These cases must remain clearly separated from positive coach-usefulness scoring.

## Golden set role
The harness freezes a small golden-example set for repeat regression use.

The golden set exists to:

- catch meaningful drift
- provide a fast rerun path
- support pilot-readiness confidence
- preserve coverage for high-value core cases
- keep one fail-closed boundary case in repeat coverage

Golden cases are more important than one-off exploratory cases when judging pilot confidence.

## Pilot-readiness role
The harness is not the pilot itself.

Its job is to help answer:

- is the current slice safe enough?
- is the current slice credible enough?
- is the current slice practically useful enough?
- where do targeted fixes matter most?
- are golden cases stable enough?

The final output of Week 19 should support a simple decision:
- pass
- hold
- fail

for Week 20 pilot-readiness progression.

## Tenancy and security rules
The harness must preserve SIC’s non-negotiable tenancy rules.

Specifically:

- no normal evaluation case may include `tenantId`, `tenant_id`, or `x-tenant-id`
- one clearly labeled tenant spoof rejection case may exist only inside `negative_boundary`
- the harness must treat client-supplied tenant input as forbidden in normal cases
- no auth, tenancy, or entitlements model changes are part of this work

The harness evaluates boundary behavior. It must not weaken that boundary.

## Observability stance
Week 19 keeps observability intentionally light.

Current evidence should come from:

- structured runner output
- stable failure reason codes
- run summaries
- golden-case summaries
- Week 19 docs and closeout notes

This does not require a new dashboarding or analytics subsystem.

## Cost stance
The harness should stay low-cost by design.

Current cost rules:

- local-first
- small frozen dataset
- bounded golden set
- deterministic validation before any broader scoring logic
- no new infra required to get value
- no analytics-platform dependency

## Operator workflow
The intended Week 19 workflow is:

1. freeze dataset and rubric
2. run harness
3. review deterministic failures
4. review usefulness patterns
5. classify issues
6. apply only bounded fixes
7. rerun golden cases and full dataset as needed
8. decide pass, hold, or fail for pilot-readiness progression

## Evidence expected from this harness
Week 19 should produce:

- frozen evaluation categories
- frozen case schema
- frozen rubric
- frozen validator rules
- frozen golden set
- repeatable run output
- failure classification note
- pilot-readiness thresholds
- closeout summary
- architect log update

## What this harness intentionally avoids
This harness avoids:

- broad ML ops work
- large-scale eval infrastructure
- benchmark sprawl
- conversational AI expansion
- future-feature scoring
- overbuilt analytics for a narrow current slice

## Summary
The Week 19 AI evaluation harness is a small, local-first, product-bounded evaluation layer for SIC’s current AI-assisted Session Builder slice.

Its purpose is to measure practical coaching usefulness, preserve fail-closed platform behavior, surface repeat failure patterns, and support a credible Week 20 pilot-readiness decision without widening the current product or platform scope.
