# Week 17 Day 1 Scope Lock

## Status

Frozen Day 1 scope lock for the Week 17 Fut-Soccer merge v1 planning and docs slice.

This document is a tracked progress artifact only.
It does not change runtime behavior, route behavior, UI behavior, persistence behavior, infra, IAM, auth, tenancy boundaries, entitlements, or Bedrock architecture.

Tracked SIC docs remain the source of truth for platform, tenancy, and roadmap decisions.
External Fut-Soccer repo findings are used here only as product evidence.

---

## Purpose

Freeze the smallest safe SIC merge shape for Fut-Soccer v1 as a first-class coaching flow on top of the existing Session Builder foundation.

This Day 1 scope lock is product-first and architecture-strong:

- keep the shared Session Builder foundation
- keep the same save, list, detail, and export path
- keep tenant scope server-derived from verified auth plus authoritative entitlements
- never accept `tenant_id`, `tenantId`, or `x-tenant-id` from client input
- avoid scan-then-filter patterns
- avoid any separate Fut-Soccer app, auth path, or tenancy path

---

## Frozen Merge Shape

### Sport

For this slice, `sport` means the canonical saved and generated sport identity used by SIC domain contracts.

Week 17 Day 1 frozen rule:

- `sport` remains `soccer`
- Fut-Soccer must not be modeled as `sport = "fut-soccer"`

### Sport pack

For this slice, a `sport pack` is a backend and domain-level bias profile that runs inside the existing Session Builder stack.

A sport pack may define:

- intake defaults
- normalization bias
- template bias
- coaching-language bias
- validation bias

A sport pack does not create:

- a separate app
- a separate auth model
- a separate tenancy model
- a separate save/list/detail/export path
- a separate session synthesis stack

### Product flavor

For this slice, a `product flavor` is a Club Vivo UX-level selector or preset that routes the coach into an existing shared Session Builder flow with preselected defaults.

A product flavor is presentation and workflow guidance.
It is not the canonical backend representation.

### Canonical internal representation

The Week 17 Day 1 canonical internal representation for Fut-Soccer v1 is:

- `sport = "soccer"`
- `sportPackId = "fut-soccer"`

Frozen Day 1 decision:

- Fut-Soccer is both:
  - a sport pack in backend and domain terms
  - a product flavor in Club Vivo UX terms

---

## Product Evidence Basis

The external Fut-Soccer repo evidence used for this scope lock is:

- Fut-Soccer currently behaves like a soccer-focused coaching knowledge and normalization layer, not a separate session engine
- it defaults to soccer
- it shows reduced-space and half-field bias
- it appears youth and beginner friendly
- it assumes minimal equipment
- it shows strong pressure-and-cover emphasis
- it shows strong passing and build-up-under-pressure emphasis
- shared session generation is downstream or mocked there
- it does not own true session synthesis, save, export, or a separate tenancy model
- futsal-specific behavior is not actually defined there
- some Fut-Soccer doc vs code mismatches exist, so inferred behavior must be marked clearly

This evidence supports a sport-pack merge into SIC rather than a parallel product stack.

---

## Intake-Difference Matrix

Legend:

- `evidenced` = directly supported by current SIC docs or the approved Fut-Soccer evidence
- `inferred` = reasonable Day 1 planning bias, but requires human confirmation before implementation detail expands
- `unresolved` = not evidenced enough to drive behavior in this slice

| profile | default space | likely surface | likely duration bias | rotation tempo | ball mastery emphasis | passing emphasis | pressing emphasis | equipment assumptions | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fut-soccer | reduced-space / half-field `(evidenced)` | constrained soccer space, likely indoor-compatible `(inferred)` | no frozen duration rule yet `(unresolved)` | faster rotations `(inferred)` | youth-friendly technical touches `(inferred)` | strong passing / build-up-under-pressure `(evidenced)` | strong pressure-and-cover `(evidenced)` | minimal equipment `(evidenced)` | soccer-focused normalization layer, not separate engine `(evidenced)` |
| soccer | full / half / small-sided area support `(evidenced)` | grass / turf / indoor spaces large enough for soccer `(evidenced)` | no explicit duration bias `(unresolved)` | no explicit default rotation bias `(unresolved)` | supported session category `(evidenced)` | supported session category `(evidenced)` | supported session category `(evidenced)` | cones + balls baseline, additional optional gear `(evidenced)` | soccer-first v1 remains the primary SIC launch identity `(evidenced)` |
| futsal | unresolved `(unresolved)` | unresolved `(unresolved)` | unresolved `(unresolved)` | unresolved `(unresolved)` | unresolved `(unresolved)` | unresolved `(unresolved)` | unresolved `(unresolved)` | unresolved `(unresolved)` | futsal remains unresolved for this slice and must not become selectable or specified beyond explicit unresolved notes `(evidenced)` |

### Frozen interpretation rules

- Fut-Soccer may bias soccer intake and generation behavior.
- Standard soccer remains the shared default path.
- Futsal specifics are not yet evidenced enough to drive implementation.
- No futsal-specific assumptions, templates, validation rules, or UI selection behavior should be introduced in this slice.

---

## Shared vs Sport-Pack-Biased Logic

### Shared Session Builder foundation

The following stay shared:

- authenticated request flow
- tenant context construction from verified auth plus authoritative entitlements
- handler structure and route ownership
- `POST /session-packs`
- `POST /sessions`
- `GET /sessions`
- `GET /sessions/{sessionId}`
- `GET /sessions/{sessionId}/pdf`
- current save, list, detail, and export path
- current repository and storage boundaries
- current session persistence contract
- current export path and PDF behavior
- current fail-closed validation posture
- current logging and observability posture

### Sport-pack-biased logic

The following may become sport-pack-biased in later implementation:

- generation-time defaults
- intake presets
- theme normalization bias
- template/example selection bias
- coaching language and framing bias
- reduced-space assumptions
- minimal-equipment assumptions
- pack-aware validation additions

### Must not move into a separate stack

The following must not become a separate Fut-Soccer stack:

- app surface
- auth flow
- tenancy path
- entitlements model
- session persistence path
- save/list/detail/export route family
- session synthesis ownership boundary

---

## Day 2 Handoff

Day 2 remains implementation work and is not part of this Day 1 docs-only slice.

The smallest approved Day 2 vertical slice is:

- add optional `sportPackId` on the session-pack generation path only
- add a Club Vivo selector or preset for Fut-Soccer as a product flavor
- add 2 initial Fut-Soccer-biased examples
- add pack-aware validation additions
- preserve the existing save, list, detail, and export path

### Day 2 backend shape

The smallest Day 2 backend contract change is:

- optional `sportPackId` on the `POST /session-packs` generation path

Frozen Day 1 rule:

- do not redesign routes
- do not widen tenancy or auth behavior
- do not create a separate Fut-Soccer endpoint family

### Day 2 frontend shape

The smallest Day 2 frontend change is:

- a Club Vivo Fut-Soccer selector or preset inside the existing Session Builder flow

Frozen Day 1 rule:

- Fut-Soccer appears as a product flavor in UX terms
- it still resolves to the shared Session Builder path underneath

### Day 2 initial examples

The first 2 Fut-Soccer-biased examples should stay narrow and evidenced by the approved product signal:

- reduced-space passing / build-up-under-pressure
- reduced-space pressure-and-cover / pressing

### Day 2 validation additions

The first validation additions should stay narrow:

- pack-aware sport-pack validation
- allowed combination checks between `sport` and `sportPackId`
- assumption guardrails tied to the approved Fut-Soccer evidence

### Day 2 save semantics note

If future save semantics are discussed:

- persist `sportPackId` only if it can ride through existing save payloads without route redesign
- otherwise generation-time-only is acceptable for v1 and must be documented as a limitation

---

## In Scope for Day 1

- freeze the Week 17 merge shape
- define `sport`
- define `sport pack`
- define `product flavor`
- freeze the canonical internal representation
- freeze the intake-difference matrix
- freeze the shared vs sport-pack-biased logic split
- document the smallest approved Day 2 handoff
- document out-of-scope boundaries
- document stop flags

---

## Explicitly Out of Scope

- runtime behavior changes
- route changes
- UI changes
- persistence changes
- infra changes
- IAM changes
- CDK changes
- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- Bedrock architecture changes
- cross-app architecture changes
- separate Fut-Soccer app creation
- separate Fut-Soccer auth path
- separate Fut-Soccer tenancy path
- separate Fut-Soccer save/list/detail/export path
- futsal implementation details
- futsal selector behavior
- futsal validation rules
- futsal templates or examples

---

## Stop Flags

Stop and escalate instead of widening scope if Week 17 Day 1 starts to require:

- infra changes
- IAM changes
- CDK changes
- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- Bedrock architecture changes
- cross-app architecture changes
- a separate Fut-Soccer application surface
- a separate Fut-Soccer route family
- a separate Fut-Soccer persistence path

If any of the above become necessary, this Day 1 scope lock is no longer the smallest safe slice and must be re-approved before implementation proceeds.

---

## Tenancy and Security Check

- Tenant scope remains server-derived from verified auth plus authoritative entitlements.
- Never accept `tenant_id`, `tenantId`, or `x-tenant-id` from body, query, or headers.
- No scan-then-filter patterns are allowed.
- The shared Session Builder foundation remains intact.
- No separate Fut-Soccer tenancy path is allowed.
- No separate Fut-Soccer auth path is allowed.

---

## Observability Note

Week 17 Day 1 is documentation only.

This slice does not change:

- logging behavior
- metrics
- alarms
- dashboards
- event schemas

Existing observability posture remains unchanged.

---

## Product Impact Note

This Day 1 scope lock unblocks the smallest safe Week 17 Day 2 implementation by freezing:

- how Fut-Soccer fits inside SIC
- what remains shared
- what may become pack-biased
- what must remain unresolved
- what must not expand into a separate stack

It protects SIC's soccer-first foundation while making room for a first-class Fut-Soccer flow on top of the existing Session Builder path.
