# Week 3 — Day 2 Unified Closeout Summary

## Objective

Move from **fail-closed authentication and tenant context** to
**tenant-safe data operations** by implementing deterministic CRUD
patterns using a tenant-partitioned DynamoDB design.

------------------------------------------------------------------------

# What We Built

## 1. Domain DynamoDB Table (Single-Table Design)

Provisioned a **tenant-partitioned domain table**:

    sic-domain-<env>
    PK (string)
    SK (string)
    Billing: PAY_PER_REQUEST

This table stores all tenant domain entities using a **single-table
multi-tenant pattern**.

Example key layout:

    PK = TENANT#<tenantId>
    SK = ATHLETE#<athleteId>

This design ensures: - strict tenant isolation - deterministic access
patterns - efficient DynamoDB queries

------------------------------------------------------------------------

## 2. API Lambda Environment Injection

Injected environment variable:

    SIC_DOMAIN_TABLE=<tableName>

Lambda startup now **fails closed** if this variable is missing:

    500 misconfig_missing_env

This prevents silent misconfiguration in production.

------------------------------------------------------------------------

## 3. Tenant-Scoped Athlete Listing

Implemented DynamoDB **Query-based listing**:

    PK = TENANT#<tenantId>
    begins_with(SK, "ATHLETE#")

This guarantees: - zero cross-tenant reads - efficient partition
access - no Scan usage

Pagination implemented with strict cursor validation.

------------------------------------------------------------------------

## 4. Idempotent Athlete Creation

Implemented **Option A (transactional idempotency)** using:

    TransactWriteItems

Transaction writes:

### Idempotency record

    PK = TENANT#<tenantId>
    SK = IDEMPOTENCY#<idempotencyKey>

### Athlete record

    PK = TENANT#<tenantId>
    SK = ATHLETE#<athleteId>

Behavior:

  Request                Result
  ---------------------- ---------------------------
  First request          Athlete created
  Retry with same key    Original athlete returned
  Duplicate prevention   Guaranteed

Replay returns deterministic response:

    replayed=true

------------------------------------------------------------------------

## 5. Replay Failure Hardening

Improved transaction failure handling to ensure: - real DynamoDB errors
are not masked - only legitimate idempotency replays trigger replay
behavior

------------------------------------------------------------------------

## 6. Response Normalization

Converted DynamoDB responses from AttributeValue maps:

    { "displayName": { "S": "Maria" } }

into clean JSON:

    {
      "displayName": "Maria"
    }

This keeps API contracts clean.

------------------------------------------------------------------------

# Files Changed

### Infrastructure

    infra/cdk/lib/sic-api-stack.ts

### Application

    services/club-vivo/api/_lib/athlete-repository.js
    services/club-vivo/api/test-tenant/handler.js

### Documentation

    docs/architecture/tenancy-model.md
    docs/adr/ADR-00xx-idempotent-athlete-create.md

### Learning Log

    .a_PROGRESS/Q&A's/Questions_answers.md

------------------------------------------------------------------------

# Architectural Decisions

## Tenant Isolation by Construction

Tenant ID is **never accepted from client payload**.

Instead:

    buildTenantContext(event)

derives tenant identity from entitlements.

------------------------------------------------------------------------

## DynamoDB Access Discipline

Allowed operations:

    Query
    GetItem
    PutItem
    UpdateItem
    DeleteItem
    TransactWriteItems

Explicitly **no Scan permission** granted to API Lambda.

This prevents accidental cross-tenant reads.

------------------------------------------------------------------------

## Idempotent Create Strategy

Selected **transaction-based idempotency**.

Reasons: - atomic consistency - deterministic replay - clean recovery
behavior - avoids duplicate resource creation

------------------------------------------------------------------------

# Validation Evidence

### Infrastructure

    cdk synth
    cdk diff SicApiStack-Dev
    cdk deploy SicApiStack-Dev

### API tests

    POST /athletes
    GET /athletes

Results verified:

  Test                Result
  ------------------- ---------------
  create athlete      201
  idempotent replay   replayed=true
  tenant isolation    verified
  pagination          deterministic

------------------------------------------------------------------------

# Observability

Structured logs include:

    requestId
    userId
    tenantId
    eventCode
    statusCode

Key events emitted:

    athlete_create_success
    athlete_create_idempotent_replay
    athlete_list_success
    invalid_request

------------------------------------------------------------------------

# Security Review

IAM role for API Lambda scoped to:

    dynamodb:Query
    dynamodb:GetItem
    dynamodb:PutItem
    dynamodb:UpdateItem
    dynamodb:DeleteItem
    dynamodb:TransactWriteItems

Resource restricted to:

    arn:aws:dynamodb:<region>:<acct>:table/sic-domain-*

No wildcard resource usage.

------------------------------------------------------------------------

# Cost Awareness

Using DynamoDB:

    PAY_PER_REQUEST

Appropriate for early platform stages.

Potential scaling risks: - hot tenant partitions - very large tenant
datasets - large item payloads

Mitigation strategies documented in cost model.

------------------------------------------------------------------------

# Certification Mapping

## AWS Developer Associate (DVA-C02)

Concepts implemented: - Lambda environment configuration - IAM least
privilege - DynamoDB Query vs Scan - Transactional writes - API
idempotency patterns

------------------------------------------------------------------------

## AWS Machine Learning Associate (MLA-C01)

Foundation for: - tenant-safe feature pipelines - training dataset
partitioning - governance boundaries

------------------------------------------------------------------------

## AWS AI Practitioner (AIF-C01)

System reliability patterns: - deterministic system behavior -
guardrails - fail-closed architecture

------------------------------------------------------------------------

# Where This Fits in SIC

This CRUD pattern becomes the **template for all platform entities**:

    Athletes
    Teams
    Sessions
    Training plans
    Analytics records
    ML feature stores

All will use the same tenant-partitioned structure.

------------------------------------------------------------------------

# Next Session Starting Point (Week 3 Day 3)

Promote `/test-tenant` prototypes into real endpoints:

    POST /athletes
    GET /athletes
    GET /athletes/{athleteId}

Add CloudWatch metric filters for:

    athlete_create_success
    athlete_create_idempotent_replay
    athlete_create_failure

Add audit events:

    PK = TENANT#<tenant>
    SK = AUDIT#<timestamp>#CREATE_ATHLETE

Add API contract documentation:

    docs/api/athletes.md