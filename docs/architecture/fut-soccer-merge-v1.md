# Fut-Soccer Merge v1 Architecture

## Purpose and scope

This note documents the current shipped Week 17 Fut-Soccer merge v1 architecture in SIC.

It covers only the implemented and verified Week 17 slice:

- Day 1 scope lock
- Day 2 runtime support for Fut-Soccer-biased session-pack generation
- Day 3 documentation and demo evidence

This document is intentionally limited to the current implementation.
It does not introduce a separate Fut-Soccer app, a separate auth path, a separate tenancy path, a separate persistence path, save-route widening, futsal behavior, or broader multi-sport redesign.

---

## Current Week 17 surface area

Week 17 adds Fut-Soccer as a first-class coaching flow on top of the existing Session Builder foundation.

The current shipped surface is:

- the existing Club Vivo `/sessions/new` flow
- the existing `POST /session-packs` generation route
- the existing `POST /sessions` save route
- the existing `GET /sessions`
- the existing `GET /sessions/{sessionId}`
- the existing `GET /sessions/{sessionId}/pdf`

Week 17 does not add a new route family.
It keeps the generation, save, list, detail, and export surfaces in place.

---

## Canonical representation

Week 17 keeps soccer as the canonical domain sport identity.

Current v1 rules:

- `sport = "soccer"` remains canonical
- Fut-Soccer must not be modeled as `sport = "fut-soccer"`
- Fut-Soccer enters generation only as `sportPackId = "fut-soccer"`

Current allowed v1 generation combinations:

- `sport = "soccer"` with omitted `sportPackId`
- `sport = "soccer"` with `sportPackId = "fut-soccer"`

Current rejected combinations include:

- unsupported `sportPackId`
- `sportPackId = "fut-soccer"` with any non-soccer `sport`

---

## Sport pack and product flavor

Current Week 17 interpretation:

- Fut-Soccer is a backend and domain `sport pack`
- Fut-Soccer is a Club Vivo UX `product flavor`

Current architecture meaning of `sport pack`:

- a bias profile inside the shared Session Builder generation path
- may influence defaults, template selection, coaching language, and narrow validation assumptions
- does not create a separate generation engine or persistence model

Current product meaning of `product flavor`:

- a coach-facing selector or preset in the existing Club Vivo flow
- maps to the shared backend path underneath
- does not become the canonical saved sport identity

---

## Week 17 bridge note

The visible `Soccer` / `Fut-Soccer` selector shipped in Week 17 is a thin merge bridge for v1, not the intended long-term SIC product boundary.

Current target direction:

- one soccer-first assistant flow on top of the shared Session Builder foundation
- less visible product splitting at the coach UX layer over time
- Fut-Soccer absorbed more as internal coaching methodology, retrieval context, and generation bias rather than a permanent visible fork

Week 17 does not implement that fuller target UX yet.
It only ships the narrow bridge needed to merge Fut-Soccer safely into the current Session Builder surface.

---

## Runtime boundaries

The current runtime split is intentionally narrow.

### Generation path

The only widened request surface is:

- `POST /session-packs`

Current v1 behavior:

- accepts optional `sportPackId`
- validates the allowed `sport` and `sportPackId` combinations
- applies Fut-Soccer bias only inside deterministic Session Builder generation

### Save path

The current save path remains unchanged:

- `POST /sessions`

Current v1 limitation:

- generated and saved sessions remain canonically `sport = "soccer"`
- `sportPackId` is generation-only in v1
- saved sessions do not persist `sportPackId` in this slice

### Read and export paths

These remain unchanged:

- `GET /sessions`
- `GET /sessions/{sessionId}`
- `GET /sessions/{sessionId}/pdf`

Week 17 does not widen the session repository, list/detail response shape, or export behavior.

---

## Current Fut-Soccer bias surface

Fut-Soccer bias is currently narrow and deterministic.

Current v1 examples are limited to:

- reduced-space passing / build-up-under-pressure
- reduced-space pressure-and-cover / pressing

Current Week 17 does not add:

- futsal generation
- futsal defaults
- futsal UI selection
- tenant-configured sport-pack storage
- a separate Fut-Soccer save or export model

---

## Request flow

The current Fut-Soccer generation flow is:

1. The authenticated coach enters the existing Club Vivo `/sessions/new` flow.
2. The coach selects either `Soccer` or `Fut-Soccer`.
3. The UI sends `sport = "soccer"` and includes `sportPackId = "fut-soccer"` only for the Fut-Soccer selection.
4. `POST /session-packs` validates the request and rejects unsupported or mismatched sport-pack combinations.
5. The shared Session Builder pipeline applies deterministic template bias when `sportPackId = "fut-soccer"`.
6. The generated session-pack response remains a canonical soccer response shape.
7. If the coach saves a generated session, the existing `POST /sessions` path persists a normal saved soccer session.
8. Existing list, detail, and PDF export routes continue unchanged.

---

## Tenancy and security rules

These rules are unchanged and non-negotiable.

- tenant scope comes only from verified auth plus authoritative entitlements
- no request-derived tenant identity is accepted
- `tenant_id`, `tenantId`, and `x-tenant-id` remain forbidden from body, query, and headers
- no scan-then-filter pattern is introduced
- no auth-boundary, tenancy-boundary, or entitlements-model behavior changes are introduced
- no separate Fut-Soccer tenancy or persistence path is introduced

Week 17 keeps the shared Session Builder foundation tenant-safe by construction.

---

## Observability notes

Week 17 does not introduce a new observability subsystem.

Current evidence remains:

- existing route-level logs
- focused validator, template, pipeline, and handler tests
- Day 3 documentation and demo evidence

No new dashboards, alarms, or metric filters are required for this slice.

---

## Current limitations and explicit deferrals

Current limitations:

- Fut-Soccer is generation-only in v1
- saved sessions remain canonically `sport = "soccer"`
- `sportPackId` is not persisted through save/list/detail/export in this slice
- Fut-Soccer bias is limited to the first two approved example paths

Explicitly deferred:

- futsal behavior
- futsal selection in UI
- save-route widening for persisted `sportPackId`
- tenant-configured sport-pack storage
- separate Fut-Soccer app, auth path, tenancy path, or persistence path
- broader multi-sport redesign
- infra, IAM, CDK, auth, tenancy, or entitlements changes

---

## Summary

Week 17 ships Fut-Soccer as a sport-pack bias inside the shared Session Builder foundation.

That keeps SIC soccer-first, tenant-safe, and product-first:

- one app
- one authenticated coach flow
- one generation route family
- one save/list/detail/export path
- no futsal behavior in v1
