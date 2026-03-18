# Errors

This folder is a reader friendly entry point for how SIC handles failure.

SIC treats failure as part of the API contract. The goal is predictable behavior under pressure, clear next steps for clients, and safe multi tenant boundaries.

## Source of truth

- Platform Error Contract: ../architecture/platform-error-contract.md

This contract applies to Lambda and API handlers wrapped by `withPlatform()` and defines the error envelope, status mapping, retry rules, correlation fields, and safety requirements.

## Quick summary

- Every post authorizer error returns the same JSON envelope
- Errors include `correlationId` and `requestId` for fast tracing
- Clients use `retryable` for retry guidance
- Multi tenant access fails closed when tenant context cannot be verified
- Write retries are safe only with idempotency enforcement

## Related

- Tenant identity and claims: ../architecture/tenant-claim-contract.md
