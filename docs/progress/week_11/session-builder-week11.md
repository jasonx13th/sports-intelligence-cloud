# Session Builder Week 11 Runtime

## Purpose

This note documents the current hardened Week 11 Session Builder runtime as it exists now in the repo.

It is a current-state architecture note for the coach-facing Session Builder flow, not a future-state design.

## Week 11 scope

Week 11 focuses on stabilizing the Session Builder MVP core by:

- freezing the v1 API contract
- tightening validation behavior
- making the runtime generation pipeline explicit
- preserving fail-closed tenant safety

## Frozen v1 API surface

The current Week 11 Session Builder surface is:

- `POST /session-packs`
- `POST /sessions`
- `GET /sessions`
- `GET /sessions/{sessionId}`
- `GET /sessions/{sessionId}/pdf`

The frozen contract for this surface is documented in:

- [session-builder-v1-contract.md](/c:/Users/jleom/dev/sports-intelligence-cloud/docs/api/session-builder-v1-contract.md)

## Current explicit pipeline interpretation

The Week 11 runtime represents the full coach-facing flow across existing endpoints:

- `POST /session-packs` = `normalize -> generate -> validate`
- `POST /sessions` = `persist`
- `GET /sessions/{sessionId}/pdf` = `export`

This keeps endpoint semantics narrow:

- session packs are generated but not auto-saved
- session persistence remains a separate explicit action
- PDF export remains session-based and separate from admin domain export

## Main runtime components

### Handlers

- `services/club-vivo/api/session-packs/handler.js`
  - handles `POST /session-packs`
  - calls the explicit internal session-pack pipeline
- `services/club-vivo/api/sessions/handler.js`
  - handles `POST /sessions`
  - handles `GET /sessions`
  - handles `GET /sessions/{sessionId}`
  - handles `GET /sessions/{sessionId}/pdf`

### Session Builder pipeline

- `services/club-vivo/api/_lib/session-builder-pipeline.js`

Current explicit internal stages:

- `normalizeSessionPackInput(...)`
- `generateSessionPack(...)`
- `validateGeneratedPack(...)`
- `persistSession(...)`
- `exportPersistedSession(...)`

The pipeline result shape is internal only and may include:

```js
{
  normalizedInput,
  generatedPack,
  validatedPack,
  persistedSession,
  exportResult,
}
```

Only the fields relevant to the current stage are populated.

### Validators

- `services/club-vivo/api/_lib/session-validate.js`
- `services/club-vivo/api/_lib/session-pack-validate.js`
- `services/club-vivo/api/_lib/validate.js`

These enforce request-shape validation, canonical field normalization, and deterministic bad-request semantics.

### Session pack generation

- `services/club-vivo/api/_lib/session-pack-templates.js`

This module provides deterministic session-pack generation, theme normalization, duration padding, and generated session structure used by `POST /session-packs`.

### Session persistence

- `services/club-vivo/api/_lib/session-repository.js`

This repository handles tenant-scoped session create, list, and get-by-id flows using tenant-partitioned DynamoDB keys.

### Session PDF/export helpers

- `services/club-vivo/api/_lib/session-pdf.js`
- `services/club-vivo/api/_lib/session-pdf-storage.js`

These build the PDF buffer, write tenant-scoped PDF objects to S3, and return short-TTL presigned URLs for `GET /sessions/{sessionId}/pdf`.

## Validation invariants

### Duration totals

- `POST /sessions`
  - total activity minutes must remain within the request `durationMin` rule currently enforced by `session-validate.js`
- `POST /session-packs`
  - generated sessions must total `durationMin` exactly after deterministic padding

### Equipment compatibility

- equipment is optional
- if equipment is omitted, generation and validation do not fail on that basis
- if equipment is supplied, narrow deterministic compatibility checks apply
- current Week 11 rules are intentionally small and explicit rather than inferred

### Supported `ageBand` set

Week 11 currently supports:

- `u6`
- `u8`
- `u10`
- `u12`
- `u14`
- `u16`
- `u18`
- `adult`

Unsupported `ageBand` values are rejected as bad requests.

## Tenancy and security notes

- tenant scope is server-derived only
- client-supplied tenant fields are never accepted as trusted input
- normal requests do not use `tenant_id`, `tenantId`, or `x-tenant-id`
- handlers rely on platform tenant context, not request-supplied tenant selectors
- repository and storage access remain tenant-scoped by construction
- session PDF storage keys are derived from authoritative tenant context plus session id

This note does not change the broader platform tenancy model defined in:

- `docs/architecture/tenant-claim-contract.md`
- `docs/architecture/architecture-principles.md`

## Known intentional limitations

- legacy `clubId`, `teamId`, and `seasonId` tolerance still exists in runtime but remains undocumented in the frozen Session Builder v1 contract
- there is not yet a single end-to-end integration test covering generate -> save -> export as one combined coach flow
- admin domain export is intentionally out of scope for the Session Builder coach-facing flow
- the internal pipeline result shape is not exposed through public API responses

## References

- [session-builder-v1-contract.md](/c:/Users/jleom/dev/sports-intelligence-cloud/docs/api/session-builder-v1-contract.md)
- [sic-session-builder.md](/c:/Users/jleom/dev/sports-intelligence-cloud/docs/product/sic-coach-lite/sic-session-builder.md)
