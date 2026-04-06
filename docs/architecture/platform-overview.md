# SIC Platform Overview

## Purpose

This document describes the current SIC enforcement path for:

`auth -> tenant-context -> entitlements -> API -> data enforcement`

It reflects the implemented Club Vivo platform path and the repo's architecture/ADR guidance, with explicit notes where those sources disagree. Primary implementation lives in the API wrapper, tenant-context builder, auth triggers, and DynamoDB-backed repositories. Sources: `infra/cdk/lib/sic-auth-stack.ts`, `infra/cdk/lib/sic-api-stack.ts`, `services/auth/post-confirmation/handler.js`, `services/auth/pre-token-generation/handler.js`, `services/club-vivo/api/src/platform/http/with-platform.js`, `services/club-vivo/api/src/platform/tenancy/tenant-context.js`.

## End-to-End Flow

1. Cognito authenticates the user and issues JWTs.
2. API Gateway HTTP API validates the JWT with a Cognito JWT authorizer.
3. Lambda handlers run through `withPlatform(...)`, which resolves correlation IDs, starts structured logging, and blocks domain logic until tenant context is built.
4. `buildTenantContext(event)` reads verified JWT claims, requires `claims.sub`, and loads the authoritative entitlements row from DynamoDB using `user_sub = claims.sub`.
5. Tenant context is constructed as `{ userId, tenantId, role, tier, groups, requestId }`.
6. Handlers pass that tenant context into repositories.
7. Repositories enforce tenant isolation by constructing DynamoDB keys with `PK = TENANT#<tenantId>` and using `GetItem`, `Query`, or `TransactWriteItems`, not scans. Sources: `infra/cdk/lib/sic-api-stack.ts`, `services/club-vivo/api/src/platform/http/with-platform.js`, `services/club-vivo/api/src/platform/tenancy/tenant-context.js`, `services/club-vivo/api/src/domains/athletes/athlete-repository.js`, `services/club-vivo/api/src/domains/sessions/session-repository.js`, `docs/architecture/tenant-claim-contract.md`, `docs/architecture/tenancy-model.md`.

## 1. Auth

The API is fronted by an HTTP API JWT authorizer configured against the Cognito user pool issuer and client audience. Protected routes include `/me`, `/athletes`, `/sessions`, and `/session-packs`. Invalid tokens are rejected before Lambda, so those failures may not include the platform error envelope or correlation headers. Sources: `infra/cdk/lib/sic-api-stack.ts`, `docs/architecture/platform-error-contract.md`, `docs/runbooks/auth-failures.md`.

On the auth side, Cognito also wires two triggers:

- `PostConfirmation` assigns a default Cognito group and writes the entitlements row to DynamoDB.
- `Pre Token Generation` injects convenience claims such as `tenant_id`, `custom:tenant_id`, `custom:role`, and `custom:tier` into ID/access tokens.

Current enforcement does not authorize from those custom claims; they are supplemental. Sources: `infra/cdk/lib/sic-auth-stack.ts`, `services/auth/post-confirmation/handler.js`, `services/auth/pre-token-generation/handler.js`.

## 2. Tenant Context

`withPlatform(...)` is the mandatory Lambda wrapper for protected handlers. It emits `request_start`, validates or synthesizes `x-correlation-id`, and then calls `buildTenantContext(event)` before invoking any route logic. If tenant context resolution fails, the wrapper converts the failure into the platform error contract and returns a deterministic 4xx/5xx response. Sources: `services/club-vivo/api/src/platform/http/with-platform.js`, `services/club-vivo/api/src/platform/logging/logger.js`, `services/club-vivo/api/src/platform/errors/errors.js`, `docs/architecture/platform-error-contract.md`.

`buildTenantContext(event)` enforces these rules:

- JWT claims must exist at `event.requestContext.authorizer.jwt.claims`.
- `claims.sub` must exist, or the request is `401 Unauthorized`.
- `TENANT_ENTITLEMENTS_TABLE` must be configured, or the request is a platform `500`.
- A DynamoDB entitlements row must exist for `user_sub = sub`, or the request is `403 Forbidden`.
- `tenant_id`, `role`, and `tier` must be present in the entitlements row.
- `tenant_id` must match `^tenant_[a-z0-9-]{3,}$`, or the request fails closed with `403`.

The returned tenant context is the single trusted source handed to handlers and repositories. Sources: `services/club-vivo/api/src/platform/tenancy/tenant-context.js`, `docs/architecture/tenant-claim-contract.md`, `docs/architecture/tenancy-model.md`, `docs/adr/ADR-0003-fail-closed-authorization-model.md`.

## 3. Entitlements

The entitlements store is a DynamoDB table keyed by `user_sub`. The API stack creates it, and the auth stack imports it for PostConfirmation writes. The current authoritative authorization model is:

- identity from verified JWT `sub`
- tenant scope and capability from DynamoDB entitlements `{ tenant_id, role, tier }`

This lets tenant membership, role, and tier change without waiting for token refresh. Sources: `infra/cdk/lib/sic-api-stack.ts`, `infra/cdk/lib/sic-auth-stack.ts`, `services/auth/post-confirmation/handler.js`, `services/club-vivo/api/src/platform/tenancy/tenant-context.js`, `docs/architecture/tenant-claim-contract.md`, `docs/adr/ADR-0005-entitlements-provisioning-postconfirmation-lambda.md`.

PostConfirmation currently provisions:

- `user_sub`
- `tenant_id`
- `role` derived from the assigned default group
- `tier` defaulting to `free`

That provisioning path is what prevents the "valid token but missing entitlements" failure mode documented in the runbooks. Sources: `services/auth/post-confirmation/handler.js`, `docs/runbooks/tenant-entitlements-onboarding.md`, `docs/runbooks/entitlement-failures.md`.

## 4. API Enforcement

Protected handlers do not accept tenant identity from body, query, or headers. Instead, they rely on `tenantCtx` injected by the platform wrapper. This pattern is visible in:

- `/me`: returns the already-resolved `userId`, `tenantId`, `role`, and `tier`
- `/athletes`: requires tenant context before create/list/get flows
- `/sessions`: same pattern for create/list/get
- `/session-packs`: requires tenant context even though it is currently stateless

Handlers also fail closed on missing env configuration and normalize errors through shared error types. Sources: `services/club-vivo/api/me/handler.js`, `services/club-vivo/api/athletes/handler.js`, `services/club-vivo/api/sessions/handler.js`, `services/club-vivo/api/session-packs/handler.js`, `services/club-vivo/api/src/platform/errors/errors.js`.

## 5. Data Enforcement

Tenant isolation is enforced again at the repository boundary. Repositories require `tenantContext.tenantId`; without it they error out instead of guessing. They build tenant-scoped keys directly:

- athletes: `PK = TENANT#<tenantId>`, `SK = ATHLETE#<athleteId>`
- athlete idempotency: `PK = TENANT#<tenantId>`, `SK = IDEMPOTENCY#<idempotencyKey>`
- sessions: `PK = TENANT#<tenantId>`, `SK = SESSION#...`
- session lookup rows: `PK = TENANT#<tenantId>`, `SK = SESSIONLOOKUP#<sessionId>`

The key properties of the current data boundary are:

- no `Scan` in repository code
- list paths use `Query` with tenant PK and sort-key prefixes
- get paths use exact tenant-scoped keys
- create paths use `TransactWriteItems` under the tenant partition
- pagination tokens are opaque DynamoDB `LastEvaluatedKey` encodings, not tenant selectors

This matches the tenancy-model and repository ADR guidance that tenant isolation must come from key construction, not post-read filtering. Sources: `services/club-vivo/api/src/domains/athletes/athlete-repository.js`, `services/club-vivo/api/src/domains/sessions/session-repository.js`, `docs/architecture/tenancy-model.md`, `docs/adr/ADR-0006-repository-boundary-tenant-safe-data-access.md`, `docs/adr/ADR-0001-multi-tenant-dynamodb-single-table-model.md`.

## Logging and Redaction Rules

The intended platform logging contract is structured JSON with stable fields such as `requestId`, `correlationId`, `eventType`, and `http.*`. `tenantId` may only be logged after tenant context resolves successfully. 4xx auth/validation failures log at `WARN`; 5xx failures log at `ERROR`. Sources: `services/club-vivo/api/src/platform/logging/logger.js`, `services/club-vivo/api/src/platform/http/with-platform.js`, `docs/architecture/platform-observability.md`, `docs/architecture/observability-signals.md`.

Redaction and omission rules in the repo are explicit:

- never log raw JWTs, tokens, `Authorization` headers, cookies, or secrets
- never include stack traces or raw exceptions in client error bodies
- avoid full request bodies with user or athlete data
- prefer safe metadata such as field names, status codes, entity ids, and reason codes
- if a supplied correlation ID is invalid, log only safe metadata such as length, not the raw value

Sources: `docs/architecture/platform-observability.md`, `docs/architecture/platform-error-contract.md`, `services/club-vivo/api/src/platform/logging/logger.js`, `services/club-vivo/api/src/platform/http/with-platform.js`, `docs/runbooks/repo-public-safety.md`.

Current implementation notes:

- API Gateway access logs include `sourceIp`, method, route, status, and integration error text.
- `tenant-context.js` logs startup and entitlements-load diagnostics including `userSub`, table name, and lookup latency.
- Auth triggers log provisioning details such as `username`, `tenantId`, `groupName`, and written claim names. These are not secrets, but they are broader than the API logging contract and should be treated as operational data, not public examples.

Sources: `infra/cdk/lib/sic-api-stack.ts`, `services/club-vivo/api/src/platform/tenancy/tenant-context.js`, `services/auth/post-confirmation/handler.js`, `services/auth/pre-token-generation/handler.js`.

## Secret Handling

The repo's operating rule is that secrets do not live in code or plaintext config. Runtime configuration such as `TENANT_ENTITLEMENTS_TABLE` and `SIC_DOMAIN_TABLE` is injected via Lambda environment variables, but handlers must treat missing values as misconfiguration and fail closed rather than defaulting to unsafe behavior. Sources: `infra/cdk/lib/sic-api-stack.ts`, `infra/cdk/lib/sic-auth-stack.ts`, `services/club-vivo/api/athletes/handler.js`, `services/club-vivo/api/sessions/handler.js`, `services/club-vivo/api/session-packs/handler.js`, `docs/architecture/SIC architecture principles.md`.

Secret-handling rules reflected in repo docs:

- do not commit credentials, private keys, AWS account identifiers, real client IDs, or real API IDs
- use placeholders like `<JWT>`, `<api-id>`, and `<redacted-account-id>` in docs
- keep generated infrastructure artifacts that may contain identifiers out of version control
- do not expose secrets, tokens, stack traces, or internal exceptions in client-visible error bodies
- do not log auth headers or raw tokens during runtime

Sources: `docs/runbooks/repo-public-safety.md`, `docs/architecture/platform-observability.md`, `docs/architecture/platform-error-contract.md`, `docs/architecture/SIC architecture principles.md`.

## Current-State Ambiguities

There is one material architecture mismatch in the repo:

- `docs/adr/ADR-0002-jwt-tenant-identity-propagation.md` says tenant identity should come exclusively from JWT claims and rejects a per-request database lookup.
- Current code and newer docs instead use JWT `sub` only for identity, then authorize through a DynamoDB entitlements lookup on every request.

The implemented path is therefore:

- authenticate with JWT
- authorize tenant scope from entitlements
- treat token custom claims as convenience only

That newer model is supported by `services/club-vivo/api/src/platform/tenancy/tenant-context.js`, `docs/architecture/tenant-claim-contract.md`, and `docs/architecture/SIC architecture principles.md`, and appears to be the actual source of truth.

## Source Files Used

- `infra/cdk/lib/sic-auth-stack.ts`
- `infra/cdk/lib/sic-api-stack.ts`
- `services/auth/post-confirmation/handler.js`
- `services/auth/pre-token-generation/handler.js`
- `services/club-vivo/api/src/platform/http/with-platform.js`
- `services/club-vivo/api/src/platform/logging/logger.js`
- `services/club-vivo/api/src/platform/tenancy/tenant-context.js`
- `services/club-vivo/api/src/platform/errors/errors.js`
- `services/club-vivo/api/src/domains/athletes/athlete-repository.js`
- `services/club-vivo/api/src/domains/sessions/session-repository.js`
- `services/club-vivo/api/me/handler.js`
- `services/club-vivo/api/athletes/handler.js`
- `services/club-vivo/api/sessions/handler.js`
- `services/club-vivo/api/session-packs/handler.js`
- `docs/architecture/tenant-claim-contract.md`
- `docs/architecture/tenancy-model.md`
- `docs/architecture/platform-observability.md`
- `docs/architecture/platform-error-contract.md`
- `docs/architecture/observability-signals.md`
- `docs/architecture/SIC Architecture Diagrams.md`
- `docs/architecture/SIC architecture principles.md`
- `docs/adr/ADR-0001-multi-tenant-dynamodb-single-table-model.md`
- `docs/adr/ADR-0002-jwt-tenant-identity-propagation.md`
- `docs/adr/ADR-0003-fail-closed-authorization-model.md`
- `docs/adr/ADR-0005-entitlements-provisioning-postconfirmation-lambda.md`
- `docs/adr/ADR-0006-repository-boundary-tenant-safe-data-access.md`
- `docs/runbooks/auth-failures.md`
- `docs/runbooks/entitlement-failures.md`
- `docs/runbooks/tenant-entitlements-onboarding.md`
- `docs/runbooks/repo-public-safety.md`
