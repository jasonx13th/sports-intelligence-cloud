# ADR-0005 — Entitlements Provisioning via PostConfirmation Lambda

Status: Accepted
Date: 2026-03-13

## Context

SIC requires a server-side entitlements record for each user.

The entitlements record defines:

tenant_id  
role  
tier

During development it was discovered that authenticated users could receive a valid JWT token but still lack an entitlements record.

This caused requests to fail with:

403 missing_entitlements

Manual provisioning was unreliable.

## Decision

Use a Cognito **PostConfirmation Lambda trigger** to automatically create entitlements records.

The trigger performs two actions:

1. Add the user to a default Cognito group
2. Write an entitlements record to DynamoDB

Record structure:

PK = user_sub

Fields

tenant_id  
role  
tier

The Lambda receives the table name via environment variable:

TENANT_ENTITLEMENTS_TABLE

IAM permissions allow writes only to that table.

## Alternatives Considered

Manual entitlements creation

Rejected because it introduces operational risk.

Client-triggered provisioning

Rejected because entitlements must be server-side.

Separate provisioning service

Rejected because Cognito triggers already provide the required lifecycle event.

## Consequences

Positive

- automatic onboarding
- consistent entitlements state
- reduced operational overhead

Negative

- dependency on Cognito lifecycle triggers