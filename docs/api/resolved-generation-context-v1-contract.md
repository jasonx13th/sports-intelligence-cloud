# Resolved Generation Context v1 Contract

## Purpose

This document freezes the first `Resolved Generation Context v1` groundwork behind the server-owned Generation Context boundary.

This is internal groundwork only. It does not change live Session Builder behavior yet.

## Scope

Resolved Generation Context v1 is:

- server-owned
- internal only
- built from an existing `generationContext` plus optional internal team and methodology inputs

Resolved Generation Context v1 is not:

- a public API change
- a route change
- a handler change
- a frontend change
- live team or methodology lookup wiring
- database-backed resolution

## Core rules

- `durationMin` remains request-owned
- request-owned fields remain unchanged during resolution
- team/program/methodology lookup wiring is future work
- no database access is required in this groundwork step
- this object stays internal to the server

## Resolver inputs

The resolver accepts:

- `generationContext`
- optional `teamContext`
- optional `methodologyRecords`

### Narrow teamContext shape

```json
{
  "programType": "travel",
  "ageBand": "u14",
  "playerCount": 16
}
```

Notes:

- `programType` is optional
- supported program types in this step are `travel` and `ost`
- `ageBand` and `playerCount` are accepted as future-facing internal inputs only

### Narrow methodology input shape

```json
{
  "shared": {
    "scope": "shared",
    "title": "Shared methodology",
    "content": "Shared guidance",
    "status": "published"
  },
  "travel": {
    "scope": "travel",
    "title": "Travel methodology",
    "content": "Travel guidance",
    "status": "published"
  },
  "ost": {
    "scope": "ost",
    "title": "OST methodology",
    "content": "OST guidance",
    "status": "published"
  }
}
```

## Resolved output shape

The resolved output includes all existing Generation Context fields plus:

```json
{
  "teamContextUsed": true,
  "resolvedProgramType": "travel",
  "resolvedMethodologyScope": "travel",
  "appliedMethodologyScopes": ["shared", "travel"],
  "methodologyGuidance": "Shared methodology\nShared guidance\n\nTravel methodology\nTravel guidance",
  "resolutionSources": {
    "resolvedProgramTypeSource": "teamContext.programType",
    "resolvedMethodologyScopeSource": "methodology.travel",
    "appliedMethodologySources": ["methodology.shared", "methodology.travel"]
  }
}
```

## Resolution rules

### Team/program resolution

- if no `teamContext` is provided:
  - `teamContextUsed = false`
  - `resolvedProgramType = null`
- if `teamContext.programType = "travel"`:
  - `teamContextUsed = true`
  - `resolvedProgramType = "travel"`
- if `teamContext.programType = "ost"`:
  - `teamContextUsed = true`
  - `resolvedProgramType = "ost"`

### Methodology resolution

Methodology application is additive:

- `shared` applies when provided
- `travel` also applies when `resolvedProgramType = "travel"`
- `ost` also applies when `resolvedProgramType = "ost"`

If no methodology records apply:

- `resolvedMethodologyScope = null`
- `appliedMethodologyScopes = []`
- `methodologyGuidance = null`

## Explicit non-goals for this step

This step does not:

- wire the resolver into the live Session Builder pipeline yet
- look up team data
- look up methodology data
- change `POST /session-packs`
- change public request or response shapes
- infer or override `durationMin`

## Ownership note

Resolved Generation Context v1 is a server-owned internal object so the backend can expand internal planning and resolution rules later without exposing those intermediate steps as public API contract.
