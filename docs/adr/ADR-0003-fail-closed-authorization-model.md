# ADR-0003 — Fail-Closed Authorization Model

Status: Accepted
Date: 2026-03-13

## Context

Multi-tenant systems must ensure that authorization failures never expose data accidentally.

If authorization context is missing or invalid, the safest behavior is to reject the request.

## Decision

SIC follows a **fail-closed authorization strategy**.

Requests are rejected when:

- JWT claims are missing
- entitlements record is missing
- tenant identifier is invalid

Error semantics:

401 → authentication failure  
403 → authorization failure

Authorization is resolved using:

JWT claims + DynamoDB entitlements store

Handlers must resolve tenant context before executing any domain logic.

## Alternatives Considered

### Fail-open behavior

Allow partial access when context is missing.

Rejected because it risks cross-tenant data exposure.

### Client-side authorization checks

Rejected because security must be enforced server-side.

## Consequences

Positive

- strong security guarantees
- predictable failure behavior
- easier auditing

Negative

- stricter onboarding flows
- additional validation logic in handlers