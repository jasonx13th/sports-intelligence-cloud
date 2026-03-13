# ADR-0001 — Multi-Tenant DynamoDB Single-Table Model

Status: Accepted
Date: 2026-03-13

## Context

Sports Intelligence Cloud (SIC) is a multi-tenant platform serving multiple organizations, coaches, and athletes.

The system must guarantee:

- strict tenant isolation
- predictable query performance
- scalable serverless APIs
- clear data access patterns

A core architectural question was how to structure the domain data layer.

Possible approaches included:

- relational databases
- multiple DynamoDB tables
- a single multi-tenant DynamoDB table

Because SIC is built on a serverless-first architecture, DynamoDB is the preferred database technology.

## Decision

SIC will use a **single DynamoDB table** for domain data with tenant-partitioned keys.

Table example:

sic-domain-dev

Primary key structure:

PK = TENANT#<tenantId>  
SK = ENTITY#<entityId>

Example records:

PK = TENANT#ORG#999  
SK = ATHLETE#123

PK = TENANT#ORG#999  
SK = SESSION#2026-03-01

All domain queries must include the tenant partition key.

This guarantees that all reads and writes are automatically scoped to a tenant.

## Alternatives Considered

### Separate tables per entity

Example tables:

Athletes  
Teams  
Sessions  

Rejected because:

- more operational complexity
- harder to maintain tenant isolation
- requires additional joins or queries

### Relational database (Aurora/PostgreSQL)

Rejected because:

- heavier operational overhead
- join-heavy access patterns
- does not align with the serverless-first philosophy

## Consequences

Positive

- deterministic tenant isolation
- predictable query performance
- scalable serverless architecture
- simpler operational reasoning

Negative

- schema design must anticipate access patterns
- relationships require careful modeling

## Guardrails

- DynamoDB Scan operations are not allowed for tenant-scoped data.
- All access patterns must include the tenant partition key.