# Week 19 Day 1 — Scope Lock

## Week goal
Create a lightweight AI evaluation harness for the shipped Session Builder AI slice so SIC can measure real coaching usefulness before Week 20 pilot readiness.

## Shipped baseline from Week 18
Week 18 already shipped:
- image-assisted intake v1 inside the shared Session Builder flow
- one image per request
- two modes:
  - `environment_profile`
  - `setup_to_drill`
- structured draft profile output
- coach review, edit, and confirm before generation
- shared downstream Session Builder flow preserved
- tenant-safe, fail-closed boundaries preserved

## Week 19 in-scope
- evaluation dataset
- sanitized fixtures
- lightweight local evaluation runner
- deterministic checks first
- simple coach-usefulness rubric
- pilot-readiness thresholds
- 5–10 golden examples for repeat regression

## Week 19 out of scope
- new AI product surfaces
- chatbot expansion
- RAG
- new analytics platform work
- auth changes
- entitlements changes
- tenancy-boundary changes
- infra/IAM/CDK changes
- accepting client-supplied `tenantId`, `tenant_id`, or `x-tenant-id`

## Non-negotiables
- Session Builder remains the shared core
- tenant scope remains server-derived from verified auth plus authoritative entitlements
- no client-trusted tenant input
- no scan-then-filter tenant isolation
- keep the slice low-cost and realistic for a solo builder
- stop if infra, IAM, auth, tenancy boundary, or entitlements model must change

## Day 1 target
Freeze:
1. evaluation case schema
2. rubric shape
3. case categories
4. case counts
5. negative-test boundaries

## Acceptance criteria
- scope is explicit
- non-goals are explicit
- no platform expansion is implied
- no tenancy/auth drift is introduced
- file is ready to guide Day 1 fixture work
