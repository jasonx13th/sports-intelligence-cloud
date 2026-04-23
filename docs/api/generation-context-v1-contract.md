# Generation Context v1 Contract

## Purpose

This document freezes the first server-side `Generation Context v1` groundwork for Session Builder.

This is a normalization boundary only. It does not add a user-facing feature, and it does not change live generation behavior yet.

## Scope

Generation Context v1 is:

- server-owned
- internal groundwork only
- built from the already-normalized `POST /session-packs` request shape

Generation Context v1 is not:

- a public Session Builder API change
- a new route
- a handler change
- a frontend change
- a pipeline or generation-behavior change

## Core rules

- `durationMin` remains request-owned
- `durationMin` must come from the current Session Builder or Quick Session generation request
- team context is not used in v1
- methodology is not used in v1
- team and methodology integration are future work
- no database lookup is part of Generation Context v1

## Generation Context v1 shape

The normalized Generation Context v1 object is:

```json
{
  "sport": "soccer",
  "sportPackId": "fut-soccer",
  "ageBand": "u14",
  "durationMin": 60,
  "theme": "pressing",
  "sessionsCount": 3,
  "equipment": ["cones", "balls"],
  "confirmedProfile": {
    "mode": "environment_profile"
  },
  "sources": {
    "durationMinSource": "request",
    "ageBandSource": "request",
    "themeSource": "request",
    "equipmentSource": "request"
  },
  "methodologyScope": null,
  "teamContextUsed": false
}
```

Field notes:

- `sportPackId` is optional
- `confirmedProfile` is optional
- `methodologyScope` is always `null` in v1
- `teamContextUsed` is always `false` in v1
- request ownership is stamped through the `sources` object

## Input boundary

Generation Context v1 accepts the already-normalized Session Builder request shape produced by existing request validation.

That means this groundwork assumes the incoming object has already been validated for fields such as:

- `sport`
- `sportPackId` when present
- `ageBand`
- `durationMin`
- `theme`
- `sessionsCount`
- `equipment`
- `confirmedProfile`

## Explicit v1 non-goals

This step does not:

- look up Team
- look up Methodology
- infer duration from Team
- read from the database
- change `POST /session-packs`
- change the public Session Builder v1 contract
- wire Generation Context into the live generation pipeline yet

## Ownership note

Generation Context is server-owned so the backend can expand it later without exposing each internal normalization step as part of the public API contract.
