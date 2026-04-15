# SIC Coach Lite - Fut-Soccer Scope v1

## Status

Draft v1

## Purpose

This document defines what Fut-Soccer means in SIC Coach Lite v1.

Fut-Soccer is shipped in SIC v1 as a focused coaching flavor on top of the existing soccer Session Builder flow.
It is not a separate sport, not a separate product stack, and not a separate tenant or persistence model.

---

## Scope decision

Coach Lite v1 remains soccer-first.

Within that soccer-first scope, Fut-Soccer is supported as:

- a backend and domain sport-pack bias
- a Club Vivo product flavor in the existing session creation flow

Coach Lite v1 does not treat Fut-Soccer as:

- a separate canonical sport identity
- a separate app
- a separate auth path
- a separate tenancy path
- a separate save/list/detail/export path

---

## Target UX direction

The current Week 17 selector-based flow is a bridge slice, not the final intended SIC coach UX.

The target direction is that coaches should ultimately experience one soccer-first assistant and one shared soccer workflow.

In that target direction, Fut-Soccer should live primarily as:

- internal coaching methodology
- internal retrieval context when SIC later adds that layer
- internal generation bias inside the shared Session Builder flow

It should not remain a permanent visible product fork unless future product evidence clearly requires that.

---

## Canonical product interpretation

Current v1 rules:

- canonical `sport` remains `soccer`
- Fut-Soccer selection maps to `sportPackId = "fut-soccer"` during generation
- saved sessions remain canonically `sport = "soccer"` in v1

This means the coach can choose a Fut-Soccer-biased generation path without changing the downstream saved-session identity.

---

## Why Fut-Soccer fits inside soccer-first v1

The approved Week 17 product evidence supports Fut-Soccer as:

- a soccer-focused coaching knowledge and normalization layer
- a reduced-space coaching bias
- a youth-friendly and low-equipment coaching path
- a strong passing / build-up-under-pressure emphasis
- a strong pressure-and-cover / pressing emphasis

That evidence supports a focused soccer flavor inside SIC Coach Lite rather than a separate product boundary.

---

## In-scope Fut-Soccer behavior for v1

Fut-Soccer v1 may currently bias:

- coach selection or preset in `/sessions/new`
- reduced-space session framing
- minimal-equipment assumptions
- deterministic template selection
- coaching language aligned to the approved Week 17 examples

The first shipped Fut-Soccer-biased examples are limited to:

- reduced-space passing / build-up-under-pressure
- reduced-space pressure-and-cover / pressing

---

## What stays shared with soccer

Fut-Soccer uses the same shared Coach Lite foundation as standard soccer:

- the same Club Vivo app
- the same session creation flow
- the same `POST /session-packs` route
- the same `POST /sessions` save path
- the same session list path
- the same session detail path
- the same PDF export path
- the same tenant-safe platform rules

The coach experience changes at the generation bias layer, not at the platform boundary.

---

## Explicit v1 limitations

Current v1 limitations are intentional:

- Fut-Soccer is generation-only in v1
- saved sessions remain plain `sport = "soccer"`
- `sportPackId` is not persisted through save/list/detail/export in this slice
- the shipped Fut-Soccer content surface is limited to the first two approved examples

These limitations keep the Week 17 slice small and safe.

---

## Out of scope for v1

The following are out of scope for the shipped Fut-Soccer v1 slice:

- futsal behavior
- futsal defaults
- futsal templates
- futsal selection in the UI
- separate Fut-Soccer save semantics
- tenant-configured Fut-Soccer pack storage
- multi-sport product redesign
- new infra, IAM, auth, tenancy, or entitlements behavior

---

## Messaging guidance

The right message is:

SIC Coach Lite is soccer-first, and Fut-Soccer is an additional coached generation flavor inside the shared soccer Session Builder path.

For the longer-term product direction, the better expression is:

SIC Coach Lite should feel like one soccer-first assistant flow, with Fut-Soccer absorbed into internal methodology and generation behavior rather than presented as a lasting product split.

Avoid saying:

- Fut-Soccer is a separate sport in SIC
- Fut-Soccer has its own app or save path
- futsal is available now
- saved sessions keep a separate Fut-Soccer sport identity in v1

---

## Summary

Fut-Soccer scope v1 is intentionally narrow.

It gives Coach Lite a more specific soccer coaching flow for reduced-space, minimal-equipment session generation while preserving the same shared SIC foundation and the same canonical saved-session sport identity.
