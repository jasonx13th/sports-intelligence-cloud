# SIC Execution Protocol

## Purpose

This document defines how SIC work should be executed with speed, discipline, and professional engineering judgment.

SIC should be built like a serious product, not like a classroom exercise.

## Operating Standard

Work should be:

- effective
- time efficient
- repo-aware
- source-of-truth driven
- tenant-safe
- cost-aware
- implementation-focused
- honest about what is shipped and what is only proposed

Do not create process for the sake of process.

## Branch Discipline

Do not create a branch for inspection, planning, or discussion.

Create a branch when making tracked repo changes that may become a pull request.

Use small branches with narrow names.

Examples:

- `training-brief-intake-ui`
- `training-brief-validation`
- `diagram-sequence-validator`
- `session-builder-handoff-mapping`

Avoid broad branches such as:

- `big-update`
- `platform-redesign`
- `misc-fixes`

## Codex Usage

Use Codex when it can accelerate:

- repo inspection
- code search
- implementation
- refactors
- tests
- validation
- repetitive edits

Do not use Codex blindly for:

- tenancy boundary decisions
- auth changes
- IAM/CDK changes
- data access changes
- broad architecture changes

Those require explicit human review and source-of-truth alignment.

## Implementation Style

Prefer thin vertical slices.

A good slice should:

- have a clear user or operator value
- touch the fewest files needed
- preserve existing architecture
- include validation where relevant
- avoid overstating runtime behavior
- produce a clean diff

## Source Of Truth

Use current GitHub/main and current repo docs as the source of truth.

Historical closeouts are useful for context, but they do not override current source files.

When documents conflict, prefer:

1. shipped source code
2. architecture principles
3. platform constitution
4. current product roadmap
5. API contracts
6. historical closeouts

## Non-Negotiables

Never weaken:

- tenant isolation
- server-derived tenant context
- entitlements
- validation
- observability
- cost-awareness
- fail-closed behavior
- product value before platform expansion

## Definition Of Done

A task is done when:

- the diff is narrow
- validation has been run
- shipped behavior is not overstated
- docs match implementation when needed
- Git status is clean after commit or merge
- the next step is clear
