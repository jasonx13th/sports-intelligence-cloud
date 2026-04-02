# ADR-0009 - Session Builder Runtime Boundaries and Explicit Coach Flow

Status: Accepted
Date: 2026-04-02

## Context

By Week 11, the Session Builder coach-facing surface was already implemented, but the runtime boundary between generation, persistence, and export needed to be made explicit.

The public Week 11 v1 contract freezes the documented API surface for:

- `POST /session-packs`
- `POST /sessions`
- `GET /sessions`
- `GET /sessions/{sessionId}`
- `GET /sessions/{sessionId}/pdf`

The platform also needed a clear current-state runtime interpretation for the coach-facing flow without weakening tenancy or changing the existing request contract.

SIC remains multi-tenant and fail closed:

- tenant scope remains server-derived from verified auth plus authoritative entitlements
- `tenant_id`, `tenantId`, and `x-tenant-id` are never accepted from client input
- repository and storage access remain tenant-scoped by construction

## Decision

SIC will keep the Week 11 public API contract and the Week 11 runtime interpretation documented as separate but aligned artifacts.

The explicit coach-facing runtime boundary is:

- `POST /session-packs` = normalize -> generate -> validate
- `POST /sessions` = persist
- `GET /sessions/{sessionId}/pdf` = export

This means:

- session-pack generation remains stateless and does not auto-save sessions
- session persistence remains a separate explicit action
- PDF export remains a separate session-based action
- the frozen v1 contract documents the public API surface
- the runtime note documents the current internal coach-facing flow and pipeline interpretation

This decision does not change the existing tenant or auth model.

## Consequences

Positive

- clarifies the coach-facing flow without changing public endpoint shapes
- separates product contract documentation from runtime architecture documentation
- makes generation, persistence, and export responsibilities easier to reason about
- keeps tenant-scoped persistence and export boundaries explicit

Negative

- the main v1 contract document does not fully detail every runtime or export behavior
- readers must use both the contract note and the runtime note to understand the full current-state picture
- there is still no single combined end-to-end integration test for generate -> save -> export

## Alternatives considered

### Treat `POST /session-packs` as generation plus implicit persistence

Rejected because Week 11 intentionally keeps generation and persistence as separate explicit actions.

### Document runtime behavior only in the contract freeze

Rejected because the public API contract and the runtime pipeline serve different governance purposes.

### Collapse export into the persistence step

Rejected because export remains a separate session-based action and should not be coupled to create-time persistence.
