# ADR-0002 — JWT Tenant Identity Propagation

Status: Accepted
Date: 2026-03-13

## Context

Every request in SIC must be associated with a tenant.

Allowing clients to provide tenant identifiers in request payloads would allow malicious users to access data belonging to other tenants.

The platform needs a trusted identity source.

## Decision

Tenant identity is derived exclusively from **JWT claims issued by Amazon Cognito**.

The tenant identifier is stored in the user profile as:

custom:tenant_id

Request flow:

Cognito  
→ JWT token  
→ API Gateway Authorizer  
→ Lambda  
→ Data layer

Backend services must never trust tenant identifiers coming from:

- request body
- query parameters
- headers

Only verified JWT claims are used.

## Alternatives Considered

### Client-provided tenant ID

Rejected because it is insecure and easily spoofed.

### Database lookup per request

Rejected because it introduces latency and still requires a trusted identity source.

## Consequences

Positive

- strong tenant isolation
- consistent identity propagation
- simpler authorization checks

Negative

- tenant changes require token refresh
- dependency on Cognito claim structure