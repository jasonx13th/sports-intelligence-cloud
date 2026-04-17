# Week 20 Day 1 — Scope Lock

## Theme

KSC Pilot Readiness

## Status

Frozen scope note for Week 20 execution.

## Purpose

Lock the Week 20 boundary before any pilot-readiness work continues so SIC stays aligned to the current product wedge, current roadmap, and current multi-tenant contract.

This note exists to keep Week 20 narrow, coach-facing, and supportable.

## Strategic objective

Prepare SIC for a real Kensington Soccer Club coach pilot using the existing shared Session Builder flow, including Fut-Soccer bias and image-assisted session creation, without widening into broader platform work or weakening tenancy, auth, or entitlements boundaries.

This stays aligned to SIC’s current product path:

1. Session Builder
2. Coach Workspace
3. Team Layer
4. Club Layer
5. Sports Organization OS foundations
6. Intelligence features later, based on real workflows and real data

## Why this week matters

Week 20 is the bridge between internal build progress and a real coach-facing pilot.

The roadmap target for this week is KSC Pilot Readiness through a narrow set of pilot-enablement tasks:

- pilot tenant setup scripts
- KSC tenant configuration
- pilot users with organization email sign-in
- website login entry path for coaches
- improved support logging
- pilot feedback capture
- onboarding documentation
- coach quick-start guidance
- internal operator checklist
- pilot walkthrough evidence

The goal is not to expand SIC into a broader platform. The goal is to make the current Session Builder flow usable, supportable, and reviewable for a real pilot.

## Source-of-truth alignment

This scope lock follows the current SIC source of truth:

- platform-constitution: product-first, low-cost, architecture-strong, multi-tenant by design
- architecture-principles: fail-closed tenancy, product value before platform expansion, minimal but real observability, security by default
- vision: Session Builder remains the current product wedge
- tenant-claim-contract: tenant scope comes from verified auth plus authoritative entitlements, never from client input
- roadmap-vnext: Week 20 is KSC Pilot Readiness, not broader system expansion

## Week 20 in scope

Week 20 is limited to the smallest safe pilot-readiness slice.

### 1. Pilot tenant setup definition and scripts

Define the minimum pilot setup path needed for KSC.

This includes:

- defining what the pilot setup script is allowed to create
- defining what inputs come from sanitized config
- identifying what remains manual versus automated
- keeping secrets, live identifiers, and sensitive values out of tracked files

### 2. KSC tenant configuration

Define the smallest tenant configuration shape needed for the KSC pilot.

This includes only pilot-relevant settings such as:

- tenant display name
- sport-pack defaults
- pilot-safe feature flags
- image-assisted intake enablement assumptions
- coach-facing defaults needed for the current flow

### 3. Pilot-user setup assumptions and safe login entry path

Define the bounded pilot-user setup model and the narrowest coach login path.

This includes:

- organization email sign-in assumptions
- minimal pilot user provisioning expectations
- role and tier assumptions that remain server-derived from entitlements
- a clear website entry path into the existing authenticated coach flow

### 4. Support and debug visibility improvements

Improve pilot supportability without introducing a new observability subsystem.

This includes:

- clearer structured logs
- stable reason codes
- route-level support visibility
- pilot triage notes for common failure paths

### 5. Pilot feedback capture

Define and implement the smallest useful pilot feedback shape for real coach learning.

Required pilot feedback areas:

- session quality
- drill usefulness
- image analysis accuracy
- missing features

### 6. Pilot onboarding and operator documentation

Produce the minimum documentation pack needed to run and support the pilot.

This includes:

- pilot onboarding note
- coach quick-start guide
- internal operator checklist
- walkthrough script

### 7. Pilot walkthrough preparation

Prepare the real coach flow for internal review and pilot execution.

This includes walkthrough readiness for:

- sign in
- create session
- upload environment photo
- generate drill from setup
- save and export
- submit feedback

## Explicit non-goals

The following are out of scope for Week 20:

- broad AI platform expansion
- new chatbot surfaces
- RAG or broad tenant knowledge systems
- analytics platform expansion
- QuickSight-first reporting work
- Glue-heavy or Athena-heavy product dependencies
- SageMaker pipeline work
- entitlements redesign
- auth-boundary changes
- tenancy-boundary changes
- client-trusted tenant identity
- accepting `tenant_id`, `tenantId`, or `x-tenant-id` from body, query, or headers
- broad club-layer or org-layer settings frameworks
- broad support dashboards or dashboard sprawl
- new infrastructure introduced for elegance rather than immediate pilot value

## Week 20 success criteria

By the end of Week 20, SIC should have:

1. a narrow pilot tenant setup path for KSC
2. a defined KSC tenant config
3. an explicit pilot-user setup path with organization email sign-in assumptions
4. a visible and understandable login entry path for coaches
5. improved support logging and pilot debug visibility
6. bounded pilot feedback capture for:
   - session quality
   - drill usefulness
   - image analysis accuracy
   - missing features
7. a usable onboarding pack for coaches and the internal operator
8. a walkthrough script covering the real pilot flow
9. evidence that the pilot slice improved readiness without widening platform scope

## Acceptance criteria for this scope lock

This scope lock is correct only if all of the following are true:

- Week 20 remains centered on Session Builder as the shared core
- pilot-readiness work is limited to KSC enablement and supportability
- no task depends on trusting tenant identity from client input
- no task requires scan-then-filter tenancy patterns
- no task assumes auth, tenancy, or entitlements redesign
- no task requires infra, IAM, or CDK changes unless explicitly escalated and approved
- documentation and supportability are treated as part of the shipped pilot slice
- the resulting week is realistic for a solo builder and low-cost to operate

## Non-negotiables

The following rules remain mandatory for every Week 20 task:

- Session Builder remains the shared core
- tenant scope must remain server-derived from verified auth plus authoritative entitlements
- tenant identity is never accepted from client input
- handlers must build tenant context before data access
- reads and writes must remain tenant-scoped by construction
- no scan-then-filter tenancy
- tier affects capabilities, not isolation
- auth and authorization must fail closed
- no wildcard IAM in app roles
- no infra, IAM, or CDK drift without explicit approval and evidence
- supportability and clarity are more important than feature expansion

## Execution rules for Week 20

Week 20 should be executed as thin, safe slices.

Preferred execution style:

- reuse existing web auth and current coach-facing flows
- extend existing Session Builder and feedback surfaces where possible
- keep pilot setup narrow and sanitized
- prefer docs, config definition, support logging clarity, and bounded feedback over new platform depth
- keep changes reviewable and reversible

Avoid during execution:

- introducing new product subsystems
- building future platform layers early
- solving speculative future org-wide needs
- adding dependencies that are not justified by the pilot

## Stop rules

Stop and escalate immediately if any Week 20 task requires:

- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- infra, IAM, or CDK drift
- broad AI platform expansion
- a new client-supplied tenant identity path
- a second parallel auth or coach access model
- a broad org-settings framework beyond current pilot need

## Expected end-of-week evidence

By the end of Week 20, expected evidence should include:

- pilot tenant setup definition
- KSC tenant config definition
- pilot-user setup assumptions
- coach login entry path note
- support logging and debug visibility note
- pilot feedback capture definition
- pilot onboarding documentation
- coach quick-start guide
- operator checklist
- walkthrough script
- closeout summary with validation, risks, and next-step readiness

## Definition of done for Day 1 scope lock

Day 1 scope lock is done when:

- the pilot boundary is frozen in writing
- in-scope work is clear
- non-goals are explicit
- Week 20 success criteria are concrete
- stop rules are documented
- the note clearly prevents platform drift before implementation begins
