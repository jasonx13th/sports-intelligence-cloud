# ADR-0006 — Repository Boundary for Tenant-Safe Data Access

Status: Accepted
Date: 2026-03-13

## Context

Direct DynamoDB access from Lambda handlers risks:

- inconsistent query patterns
- cross-tenant access mistakes
- accidental Scan operations

Tenant enforcement must be centralized.

## Decision

Introduce a repository layer responsible for all domain data access.

Example repository:

services/club-vivo/api/src/domains/athletes/athlete-repository.js

Repository methods enforce tenant-scoped queries:

PK = TENANT#<tenantId>

Example query:

PK = TENANT#<tenantId>  
begins_with(SK, "ATHLETE#")

Pagination tokens follow a deterministic format:

nextToken = base64(JSON(LastEvaluatedKey))

Invalid tokens return:

400 invalid_next_token

## Alternatives Considered

Direct DynamoDB calls in handlers

Rejected because it spreads access logic across the codebase.

Scan-based queries

Rejected because scans risk cross-tenant exposure.

Multiple tables per entity

Rejected due to operational complexity.

## Consequences

Positive

- centralized data access logic
- enforced tenant isolation
- predictable query patterns

Negative

- additional abstraction layer

## Guardrails

All repository queries must include tenant partition keys.

Scan operations are prohibited for tenant-scoped data.