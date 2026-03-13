# ADR-0004 — Idempotent Athlete Creation

Status: Accepted
Date: 2026-03-13

## Context

Clients may retry requests because of:

- network instability
- timeouts
- mobile connectivity issues

Without protection, retries can create duplicate records.

## Decision

All create operations require an **Idempotency-Key header**.

DynamoDB transactions ensure that idempotency records and domain records are written atomically.

Transaction writes:

1. Idempotency record

PK = TENANT#<tenantId>  
SK = IDEMPOTENCY#<idempotencyKey>

2. Athlete record

PK = TENANT#<tenantId>  
SK = ATHLETE#<athleteId>

If the same Idempotency-Key is received again:

- the existing idempotency record is retrieved
- the original athleteId is returned
- no duplicate records are created

## Alternatives Considered

Deterministic athleteId derived from natural keys

Rejected because athlete records do not have stable natural identifiers.

Single conditional Put

Rejected because it cannot safely bind retries when the client does not control the ID.

External idempotency store

Rejected because it introduces unnecessary complexity.

## Consequences

Positive

- retry-safe API operations
- deterministic replay behavior
- improved system reliability

Negative

- additional DynamoDB writes
- transaction overhead