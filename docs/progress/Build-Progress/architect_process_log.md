# Architect Process Log

Audit-oriented summary of architecture progress and decisions derived from `docs/progress/week_0/` through `docs/progress/week_5/` notes only.

## Running index

- [Week 0](#week-0)
- [Week 1](#week-1)
- [Week 2](#week-2)
- [Week 3](#week-3)
- [Week 4](#week-4)
- [Week 5](#week-5)
- [Week 6](#week-6)

## Week 0

Week 0 notes are sparse and mostly foundational. This section stays minimal on purpose.

### Goals

- Establish a safe AWS sandbox baseline for early SIC work.
- Define first-draft security architecture for IAM, KMS, VPC, secrets, and tenant isolation.

### Work completed

- Set one personal AWS account as the SIC sandbox.
- Decided root user is for billing/account setup only; daily work uses IAM user `j-admin` with MFA.
- Configured AWS CLI for `us-east-1` and JSON output.
- Created and tested an S3 bucket as an initial CLI validation exercise.
- Wrote a first-draft shared responsibility model for SIC.
- Drafted first-pass IAM, KMS, VPC, and secrets-management models.
- Established the principle that APIs must enforce `tenant_id` from validated JWT claims, not client input.

### Key decisions + tradeoffs

- Use one personal AWS account as an early sandbox.
  - Why: fastest path for early experiments across solo-coach and club scenarios.
  - Tradeoff: production workloads are expected to move to dedicated accounts/environments later.
- Use IAM roles for workloads and avoid long-lived IAM user keys in applications.
  - Why: aligns with least privilege and safer workload identity handling.
  - Tradeoff: exact least-privilege patterns for more complex multi-tenant access were still noted as an area needing more practice.
- Plan for SSE-KMS and secrets managers from the start.
  - Why: sensitive athlete and platform data need encryption and secret isolation by default.
  - Tradeoff: implementation details were still preview-level in notes.

### Tenancy/security checks

- Root user reserved for account-level tasks only.
- `j-admin` uses MFA for daily operations.
- Tenant isolation principle documented as non-negotiable: future APIs must derive `tenant_id` from validated JWT claims only.
- Secrets must not be hard-coded in the repo; Parameter Store and/or Secrets Manager are the intended runtime sources.

### Observability notes

- Budget guardrail documented: monthly cost budget set to `$5` with email alerts.
- Monitoring/logging responsibility was explicitly assigned to the application/platform owner in the shared responsibility notes.
- Specific logs/metrics/alarms beyond the budget note were not yet implemented in the week notes.

### Evidence

- Commands run:
  - `aws --version`
  - `aws configure`
  - `aws sts get-caller-identity`
  - `aws s3 mb s3://sic-dev-jleom --region us-east-1`
  - `aws s3 cp sic-test.txt s3://sic-dev-jleom/`
  - `aws s3 ls s3://sic-dev-jleom/`
- Outputs referenced:
  - CLI configured for `us-east-1`
  - S3 bucket test completed successfully
- PR/commit placeholders:
  - `(unknown — not found in notes)`

### Issues/bugs + fixes

- No explicit implementation bugs were recorded in Week 0 notes.

### Next steps

- Carry the documented security-by-default principles into actual auth, JWT, and tenant-boundary implementation work in later weeks.
- Continue designing least-privilege IAM and tenant-safe data access patterns.

## Week 1

### Goals

- Turn the Week 0 security direction into a working multi-tenant auth foundation.
- Establish Cognito as the SIC auth backbone.
- Prove protected API access with tenant-aware identity flow.
- Close the week with a security-centered onboarding and tenancy strategy.

### Work completed

- Defined the Week 1 auth and IAM architecture for multi-tenant Club Vivo.
- Established Cognito user roles/groups: `cv-admin`, `cv-coach`, `cv-medical`, `cv-athlete`.
- Documented `tenant_id` flow from onboarding to Cognito profile to JWT to API to data access.
- Deployed `SicAuthStack-Dev`.
- Created a working Cognito User Pool, Hosted UI domain, and app client for Club Vivo.
- Added and tested a PostConfirmation Lambda trigger for group assignment.
- Verified `custom:tenant_id` on users.
- Deployed `SicApiStack-Dev`.
- Implemented a tenant-aware protected `/me` endpoint.
- Attached a Pre Token Generation trigger so `tenant_id` is injected into JWTs.
- Verified end-to-end flow: Cognito login -> JWT -> API Gateway authorizer -> Lambda -> tenant-aware response.
- Closed the week with a documented two-mode onboarding strategy and a four-layer multi-tenant security model.

### Key decisions + tradeoffs

- Use Cognito as the managed identity backbone for SIC.
  - Why: managed auth, standards-based JWTs, and direct API Gateway integration reduce custom auth risk.
  - Tradeoff: Cognito configuration and token claim behavior introduced operational complexity that had to be learned and corrected during deployment.
- Treat `tenant_id` as a first-class identity thread from onboarding through API/data access.
  - Why: tenant isolation depends on the same tenant identifier being enforced across all layers.
  - Tradeoff: user attributes alone were insufficient; token injection had to be explicitly added.
- Separate identities by purpose: IAM users for operators, IAM roles for workloads, Cognito users for app end-users.
  - Why: cleaner security boundaries and no long-lived workload credentials.
  - Tradeoff: cross-stack and multi-identity configuration adds complexity early.
- Accept a temporary IAM wildcard for `AdminAddUserToGroup` to break a circular dependency.
  - Why: unblock the MVP deployment.
  - Tradeoff: least privilege was knowingly deferred and documented for later tightening.
- Keep self-sign-up disabled while onboarding strategy remains planned rather than implemented.
  - Why: security model first, onboarding flows later.
  - Tradeoff: product-led onboarding remained a design, not a shipped capability.

### Tenancy/security checks

- API Gateway Cognito authorizer validates issuer, audience, signature, and expiration before Lambda runs.
- `/me` verified `401 Unauthorized` without token.
- `/me` verified `200 OK` with a valid token.
- Lambda behavior documented to trust tenant identity only from validated JWT claims.
- Tenant isolation model defined across identity, API, application, and data layers.
- Pre Token Generation trigger used to inject `tenant_id` into JWT claims.
- CloudWatch logs validated the trigger and protected flow behavior.

### Observability notes

- Week 1 notes explicitly called for auth observability via API Gateway logs, Lambda logs, and CloudWatch alarms.
- CloudWatch logs were verified for the PostConfirmation Lambda.
- `/me` protected-path behavior was validated with live requests.
- Detailed alarms for auth failure spikes were discussed as needed, but not yet fully described as implemented by end-of-week notes.

### Evidence

- Commands run / referenced:
  - `npx cdk bootstrap aws://<redacted-account-id>/us-east-1`
  - `npx cdk deploy SicAuthStack-Dev`
  - `aws cognito-idp admin-update-user-attributes --user-pool-id <redacted-userpool-id> --username <redacted-user-sub> --user-attributes Name=custom:tenant_id,Value=club-vivo-1234 --region us-east-1`
  - `curl -i https://<api-id>.execute-api.us-east-1.amazonaws.com/me`
- Outputs/results referenced:
  - `UserPoolId = <redacted-userpool-id>`
  - `UserPoolDomain = https://<redacted-userpool-domain>`
  - `ClubVivoWebClientId = 4ssfg7va608hn9uolatbhsma7g`
  - `/me` without token -> `401 Unauthorized`
  - `/me` with valid token -> `200 OK`
  - Decoded JWT includes `"tenant_id": "club-vivo-1234"`
- PR/commit placeholders:
  - `(unknown — not found in notes)`

### Issues/bugs + fixes

- Missing CDK bootstrap.
  - Fix: bootstrapped the account/region before deploy.
- CloudFormation circular dependency between Cognito trigger and Lambda policy.
  - Fix: temporary wildcard resource policy to unblock deployment.
- Lambda runtime error `Cannot find module 'aws-sdk'`.
  - Fix: migrated to AWS SDK v3 and packaged the needed dependency.
- API authorizer audience mismatch caused invalid token failures.
  - Fix: updated the API stack to use the correct app client id.
- `custom:tenant_id` existed in user attributes but not JWTs.
  - Fix: added a Pre Token Generation trigger to inject `tenant_id`.

### Next steps

- Remove the temporary IAM wildcard and return to least privilege.
- Expand beyond `/me` into real tenant-enforced CRUD flows.
- Implement real onboarding flows for solo and org modes.
- Add stronger audit logging and monitoring.
- Introduce data-layer enforcement patterns in DynamoDB and S3 as persistence expands.

## Week 2

### Goals

- Tighten the auth boundary into an explicit tenant claim contract.
- Move from token-only identity to server-authoritative tenant entitlements.
- Prove the request pipeline is fail-closed and deterministic.
- Add basic alarms, runbooks, and structured error diagnostics.

### Work completed

- Added a tenant claim contract document.
- Enforced tenant claim handling in the `/me` path.
- Added HTTP API access logs and alarms in the API stack.
- Tightened `AdminAddUserToGroup` IAM scope to the user pool ARN.
- Added an auth/API alarms runbook.
- Implemented DB-backed tenant context resolution in `buildTenantContext(event)`.
- Added shared request guardrails for safe JSON parsing and required-field validation.
- Standardized packaging so shared `_lib` code is included in deployed Lambdas.
- Added `POST /test-tenant` to prove tenant context, parsing, and validation end to end.
- Added and wired the tenant entitlements DynamoDB table.
- Stabilized token minting so negative tests were reproducible.
- Proved deterministic fail-closed outcomes for missing entitlements and invalid inputs.
- Upgraded logs so error cases include request/user/tenant context fields.

### Key decisions + tradeoffs

- Trust tenant claims only from verified JWT context and enforce them again in Lambda middleware.
  - Why: defense in depth for tenant identity.
  - Tradeoff: more explicit error-path handling between authorizer and Lambda was required.
- Distinguish `401` from `403`.
  - Why: `401` means auth failed before Lambda; `403` means authenticated request failed tenant or entitlement rules.
  - Tradeoff: tests had to be carefully staged so the intended layer was exercised.
- Choose Path 2: DB-backed entitlements as the source of truth for tenant context.
  - Why: instant revocation, central authority, stronger auditability, and stronger tenant isolation than relying on client-visible claims alone.
  - Tradeoff: every request depends on entitlements state and missing rows must fail closed.
- Manage alarms through IaC rather than console configuration.
  - Why: avoid drift.
  - Tradeoff: alarm changes now ride through the deploy workflow instead of ad hoc console changes.

### Tenancy/security checks

- Fail-closed rules documented and exercised:
  - missing claims -> `401/403`
  - missing entitlements -> `403 missing_entitlements`
  - invalid tenant format -> `403 invalid_tenant_claim`
  - missing role/tier -> `403 missing_role_claim` / `403 missing_tier_claim`
- Tenant format enforced as `^tenant_[a-z0-9-]{3,}$`.
- `/me` and `/test-tenant` were intended to share the same tenant-context path.
- Tenant identity derived from `claims.sub` plus entitlements table state, not from client input.
- Negative tests proved fail-closed behavior rather than permissive fallback behavior.

### Observability notes

- HTTP API access logs and alarms were added in Week 2 Day 1 notes.
- Structured logs were upgraded to include `requestId`, `userId`, `tenantId`, `error.code`, and `statusCode`.
- Notes explicitly identified logs as part of "done," not optional.
- Metric filters on auth/tenant failure codes were listed as a follow-up rather than clearly completed.

### Evidence

- Commands run / referenced:
  - `aws sts get-caller-identity`
  - `aws cloudformation describe-stacks --stack-name <redacted-auth-stack> ...`
  - `aws dynamodb delete-item ...`
  - `aws dynamodb scan --table-name <redacted-entitlements-table> ...`
  - `npx cdk deploy <redacted-api-stack>`
- Outputs/results referenced:
  - repeatable token minting restored
  - `/me` -> `403` with `missing_entitlements`
  - `/test-tenant` malformed JSON -> `400 invalid_json`
  - `/test-tenant` missing fields -> `400 missing_fields`
  - entitlements table scan showed `Count: 0` after fail-closed validation reset
- PR/commit placeholders:
  - `(unknown — not found in notes)`

### Issues/bugs + fixes

- Wrong Cognito client id caused token minting/auth failures.
  - Fix: use CloudFormation outputs as the source of truth.
- PowerShell quoting and execution policy issues complicated auth and deploy commands.
  - Fix: single-quote passwords, use file-based JSON for DynamoDB CLI, and set `RemoteSigned` for `npx` when needed.
- Missing entitlements prevented body-validation paths from being reached.
  - Fix: temporarily restored a valid entitlements row to exercise deterministic `400` paths.
- Logs lacked enough context for quick diagnosis.
  - Fix: added consistent structured error logging fields.

### Next steps

- Ensure `/me` and `/test-tenant` consistently use `buildTenantContext(event)`.
- Add documented negative test coverage for malformed JSON, missing fields, and missing entitlements.
- Add metric filters/alarms for top auth failure categories.
- Formalize the tenant-context/entitlements contract in ADR-style docs.

## Week 3

### Goals

- Move from fail-closed auth into tenant-safe data operations.
- Make entitlements provisioning automatic for new users.
- Introduce tenant-partitioned DynamoDB CRUD patterns.
- Promote prototypes into real athlete endpoints with auditability and operational signals.
- Remove insecure test-only surface area and improve operational maturity.

### Work completed

- Added editor guardrails via Copilot instructions and hooks to reinforce SIC constraints.
- Updated PostConfirmation provisioning so it writes entitlements rows automatically.
- Validated auth stack changes with `cdk synth`, `cdk diff`, and deploy.
- Added tenant-safe `AthleteRepository.listAthletes` using `PK = TENANT#<tenantId>` and `begins_with(SK, "ATHLETE#")`.
- Added deterministic cursor validation for list pagination.
- Extended `/test-tenant` to prove deterministic fail-closed behavior before the domain table existed.
- Provisioned the tenant-partitioned domain table with `PAY_PER_REQUEST`.
- Injected `SIC_DOMAIN_TABLE` into API Lambdas and failed closed when missing.
- Implemented transactional idempotent athlete creation.
- Normalized DynamoDB responses into clean API JSON.
- Promoted prototype behavior into real authenticated routes:
  - `POST /athletes`
  - `GET /athletes`
  - `GET /athletes/{athleteId}`
- Added audit records for mutation on first write.
- Added CloudWatch metric filters and an alarm for athlete-create outcomes.
- Added API contract docs for athletes.
- Removed `/test-tenant` and its wiring.
- Added a CloudWatch dashboard baseline for create success/replay/failure signals.
- Standardized pagination naming to `nextToken` with temporary `cursor` alias support.
- Documented the tenant id format contract in architecture docs.

### Key decisions + tradeoffs

- Keep tenant identity authoritative from `buildTenantContext(event)` and never from client payloads.
  - Why: tenant isolation by construction.
  - Tradeoff: handlers and repos must consistently honor the shared context path.
- Use a single-table, tenant-partitioned DynamoDB model.
  - Why: deterministic access patterns, efficient queries, and a repeatable template for future entities.
  - Tradeoff: hot-tenant and large-item risks were acknowledged for future scaling work.
- For create operations, choose transaction-based idempotency.
  - Why: atomic consistency, deterministic replay, and duplicate prevention.
  - Tradeoff: transaction complexity and replay-path handling needed explicit hardening.
- Remove `/test-tenant` once real endpoints and signals exist.
  - Why: reduce risk surface and retire non-production pathways.
  - Tradeoff: debugging convenience moved into dashboards, logs, and real route validation instead of a helper endpoint.
- Standardize pagination contract on `nextToken`.
  - Why: AWS-aligned naming and clearer contract consistency.
  - Tradeoff: temporary alias support was retained for backward compatibility.

### Tenancy/security checks

- Entitlements provisioning created rows keyed by `claims.sub`.
- `/me` returned tenant context after provisioning validation.
- Repository and real endpoints enforced tenant scoping through DynamoDB key design rather than scans.
- API Lambda permissions explicitly excluded `dynamodb:Scan` for the athlete path.
- Missing domain-table config failed closed as `500 misconfig_missing_env`.
- Missing/invalid tenant context and idempotency edge cases were exercised and documented.
- Removing `/test-tenant` reduced isolation bypass risk surface.

### Observability notes

- CloudWatch logs included `requestId`, `userId`, `tenantId`, `code`, and `statusCode`.
- Metric filters added for:
  - `athlete_create_success`
  - `athlete_create_idempotent_replay`
  - `athlete_create_failure`
- Alarm added for athlete-create failures.
- Dashboard `sic-dev-ops` added to visualize domain signals.
- Notes stressed domain signals vs raw logs as a production mindset shift.

### Evidence

- Commands run / referenced:
  - `cdk synth`
  - `cdk diff`
  - `cdk deploy SicAuthStack-Dev`
  - `cdk deploy SicApiStack-Dev`
  - `npx cdk deploy SicApiStack-Dev -c env=dev`
  - live `POST /athletes` and `GET /athletes` API tests
- Outputs/results referenced:
  - entitlements row created
  - `/me` returns tenant context
  - `/test-tenant` deterministic `missing_domain_table` before table provision
  - create athlete -> `201`
  - idempotent replay -> deterministic replay behavior
  - audit records verified with DynamoDB query
  - dashboard visible with datapoints after refresh
- Commits explicitly recorded in notes:
  - `2197c67` - `chore(api): remove /test-tenant endpoint`
  - `bfd1c5b` - `ops(cloudwatch): add ops dashboard baseline`
  - `3032ef5` - `refactor(api): standardize pagination token as nextToken`
  - `7d8d35b` - `docs(tenancy): document tenant_id format contract`

### Issues/bugs + fixes

- Existing users lacked auto-created entitlements.
  - Fix: updated PostConfirmation provisioning and table wiring.
- Packaging issues meant shared code or moved repository code was not always included.
  - Fix: standardized packaging and moved code into bundled locations.
- Runtime/export mismatches in handlers caused breakage.
  - Fix: corrected module wiring for body parsing and validation.
- CloudWatch metric filter pattern was initially invalid.
  - Fix: used the correct JSON field filter pattern.
- CLI and PowerShell issues (`curl` alias, BOM/param file quirks, CDK app path confusion) slowed validation.
  - Fix: standardized on `curl.exe`, `file://` parameter files, and running `npx cdk` from `infra/cdk`.

### Next steps

- Expand audit events into a more formal audit event system.
- Expand alarms beyond the first domain metrics.
- Add safe local tooling/scripts for token minting and API calls.
- Continue documenting tenancy contracts and operational runbooks.

## Week 4

### Goals

- Improve production readiness through logging quality, correlation, error contracts, and runbooks.
- Make handlers operable by default.
- Clean up signal semantics and restore public-safe deployment posture.

### Work completed

- Wrote a platform observability contract covering structured JSON logs, correlation, request IDs, error semantics, and evidence queries.
- Added a shared logger utility for normalized JSON logs and correlation handling.
- Added a `with-platform` wrapper that standardizes lifecycle logs, structured error logs, correlation propagation, and response headers.
- Wrapped `/me` and `/athletes` with platform middleware.
- Added API-local AWS SDK v3 dependencies required by runtime modules.
- Increased Lambda timeouts after diagnosing `/me` timeout behavior.
- Added tenant-context diagnostics including `tenant_context_start`, `tenant_context_entitlements_loaded`, and `ddbLatencyMs`.
- Implemented a deterministic platform error contract with typed errors and a standard error envelope.
- Hardened wrapper behavior for Lambda proxy responses and post-authorizer error responses.
- Updated athlete endpoints to use typed `400/404/500` behavior.
- Added docs for the platform error contract.
- Added a Platform 5XX runbook.
- Linked the signals catalog to runbooks.
- Corrected logging semantics so expected `4XX` failures do not emit `handler_error`.
- Restored a public-safe deploy pattern by reading Cognito identifiers from environment variables instead of hardcoding them.
- Updated repo/public-safety documentation.

### Key decisions + tradeoffs

- Make `context.awsRequestId` the canonical `requestId`, and log `apigwRequestId` separately.
  - Why: clearer request tracing semantics.
  - Tradeoff: log schema grew more explicit and required code changes across wrappers and diagnostics.
- Accept validated client correlation IDs, otherwise fall back to request ID.
  - Why: consistent tracing without trusting malformed correlation input.
  - Tradeoff: invalid client correlation values are dropped rather than echoed.
- Reserve `handler_error` for unexpected `5XX` failures and treat `4XX` as expected warning-level events.
  - Why: signal hygiene and lower false alarm noise.
  - Tradeoff: log/event taxonomy became stricter and required coordinated updates.
- Use a namespaced error taxonomy with explicit retryability.
  - Why: deterministic client behavior and safer post-authorizer responses.
  - Tradeoff: pre-Lambda authorizer failures still cannot guarantee the same contract body/headers.
- Never commit real Cognito identifiers to the public-safe repo.
  - Why: public repo safety without breaking deploy posture.
  - Tradeoff: deploy now depends on env/parameter injection being present.

### Tenancy/security checks

- Tenant isolation remained fail-closed and entitlements-driven.
- `tenantId` is not logged before tenant context resolves.
- Correlation handling avoids echoing invalid values unsafely.
- Error contract preserves safe client messages and warns about identifier-containing `details` outside dev.
- Public-safe deploy posture removed hardcoded/redacted Cognito identifiers from committed code.

### Observability notes

- Structured lifecycle logs added: `request_start`, `tenant_context_resolved`, `request_end`.
- Structured error and validation event types differentiated.
- Platform docs include saved evidence queries.
- Runbooks now map signals to remediation docs.
- Follow-up remained to migrate metric filters from legacy `eventCode` to `eventType`.

### Evidence

- Commands run / referenced:
  - `npx cdk` deploys from `infra/cdk`
  - CLI reads for callback URL troubleshooting
  - `npx cdk diff SicApiStack-Dev`
- Outputs/results referenced:
  - `/me` and `/athletes` returned correlation headers
  - invalid correlation input triggered `correlation_invalid` with fallback behavior
  - logs showed lifecycle and domain chains by correlation ID
  - `cdk diff` after env injection showed only Lambda code S3 key changes
  - `cdk deploy SicApiStack-Dev` succeeded and API URL was confirmed
- Commits explicitly recorded in notes:
  - `3ed8775` - `ops(runbooks): add platform 5xx runbook; link signals; fix 4xx logging; env-inject Cognito ids`
- Additional PR/commit placeholders:
  - `(unknown — not found in notes)`

### Issues/bugs + fixes

- Missing runtime AWS SDK modules in local/API packaging.
  - Fix: API-local dependencies added and installed.
- `/me` timed out at 3 seconds.
  - Fix: increased timeouts and added DDB latency diagnostics.
- Correlation headers were missing in some responses.
  - Fix: added headers in success and error paths.
- PowerShell and CLI quirks complicated token exchange and API testing.
  - Fix: standardized on reliable command paths and request tools.
- Legacy metric filter naming and error taxonomy drift created observability inconsistency.
  - Fix: moved toward typed errors, platform error docs, and event-type cleanup.

### Next steps

- Add an endpoint Definition of Done checklist for errors, logs, metrics, alarms, and cost notes.
- Add throttling/backoff runbook coverage.
- Complete migration from `eventCode` to `eventType` in metric filters and alarms.

## Week 5

### Goals

- Add a tenant-safe Sessions domain.
- Add deterministic Session Pack generation with strict validation.
- Reinforce tenant guardrails with tests and CI checks.

### Work completed

- Added strict, fail-closed session creation validation with unknown-field rejection.
- Implemented a session repository using tenant-partitioned single-table patterns and scan-free access.
- Added session routes and handler:
  - `POST /sessions`
  - `GET /sessions`
  - `GET /sessions/{sessionId}`
- Added lookup-item design for get-by-id without scans or GSIs.
- Wired sessions into the API stack with least-privilege table access.
- Fixed malformed JSON handling so bad session-create input returns `400 invalid_json` instead of `500`.
- Added strict Session Pack validation.
- Added deterministic pack generation that re-validates generated sessions through session validation.
- Added `POST /session-packs` as a stateless handler.
- Wired a SessionPacks Lambda and route with least-privilege entitlements access.
- Added contract tests around `buildTenantContext(event)`.
- Added a minimal GitHub Actions workflow to preserve tenant guardrails in CI.
- Added server-side session PDF export at `GET /sessions/{sessionId}/pdf`.
- Added pure-JS minimal PDF generation and tenant-scoped S3 export storage helpers.
- Added a route-specific `pdf_export_failed` structured log marker so PDF failures are observable without changing shared platform logging.
- Wired session PDF export infrastructure in CDK:
  - dedicated private S3 bucket
  - least-privilege `s3:PutObject` / `s3:GetObject` access for `SessionsFn`
  - `PDF_BUCKET_NAME` and `PDF_URL_TTL_SECONDS` on `SessionsFn`
  - authenticated `GET /sessions/{sessionId}/pdf` route
- Added an API-only CDK entrypoint for synth/diff and made the main CDK app fail-soft when API auth env vars are missing.
- Added a Week 5 demo/runbook covering onboarding checks, `/me`, sessions, packs, PDF export, and cross-tenant negative tests.
- Added minimal coach-loop observability in CDK with metric filters, a dashboard, and a PDF export failure alarm.

### Key decisions + tradeoffs

- Keep DynamoDB as the operational store with tenant-partitioned single-table patterns.
  - Why: continuity with earlier tenant-safe CRUD patterns.
  - Tradeoff: sessions-specific dashboards/alarms were not yet added in the notes.
- Implement get-by-id via a lookup item rather than scan or GSI.
  - Why: tenant-scoped retrieval without scans.
  - Tradeoff: extra write/storage per created session.
- Keep list responses summary-only for sessions.
  - Why: better cost/performance profile.
  - Tradeoff: clients need a second call for full payload details.
- Reject unknown request fields, including `tenantId`, rather than ignoring them.
  - Why: prevent tenant spoofing and preserve strict request contracts.
  - Tradeoff: stricter client behavior can require more explicit error handling/documentation.
- Keep Session Packs stateless and deterministic for the initial slice.
  - Why: safer, predictable baseline before adding heavier generation paths.
  - Tradeoff: persistence strategy was intentionally deferred.
- Use lightweight CI guardrails for banned tenant-id patterns.
  - Why: cheap preventative enforcement of tenancy doctrine.
  - Tradeoff: string-level pattern checks are intentionally narrow and may need refinement later.
- Generate PDFs server-side and return short-lived presigned URLs rather than streaming bytes through the API.
  - Why: keeps the API thin, reduces Lambda/API Gateway response complexity, and aligns with S3 as the artifact store.
  - Tradeoff: export artifacts now require bucket lifecycle/retention decisions as the feature grows.
- Use a dedicated session-PDF bucket rather than reusing another artifact bucket.
  - Why: simpler IAM scoping, lower accidental mixing of data classes, and cleaner future retention policy control.
  - Tradeoff: one more infrastructure resource to manage.
- Add a route-specific PDF failure event type instead of relying only on generic `handler_error`.
  - Why: dynamic session PDF paths are hard to isolate with CloudWatch metric filters; a specific event type makes failure metrics reliable.
  - Tradeoff: small route-local logging logic is needed in addition to shared platform logging.
- Add an API-only CDK entrypoint with placeholder Cognito identifiers for synth/diff.
  - Why: unblocks infrastructure review when auth env vars are not available locally.
  - Tradeoff: synth-time JWT authorizer values can be placeholders only for local inspection and must not be used for deploys.

### Tenancy/security checks

- Sessions derive tenant identity from verified auth plus entitlements only.
- Unauthenticated `GET /sessions` returned `401`.
- Body tenant spoof attempts were rejected as invalid/unknown fields.
- Session Pack requests reject `tenantId` in request bodies.
- Notes explicitly reaffirmed that entitlements keyed by `user_sub = claims.sub` are authoritative.
- Contract tests covered missing `claims.sub`, missing entitlements, malformed entitlements, and the success path.
- CI workflow checks `services/` for banned tenant-id patterns.
- Session PDF export derives S3 object keys only from server-side tenant context plus `sessionId`; no client-controlled tenant or path input is accepted.
- Cross-tenant access to both `GET /sessions/{sessionId}` and `GET /sessions/{sessionId}/pdf` was validated to fail closed with `404`.
- Session PDF bucket access stayed least-privilege at the object ARN level for the sessions Lambda only.

### Observability notes

- Existing platform logging was reused for sessions and session packs.
- Added coach-loop observability for Week 5:
  - `session_create_success`
  - `session_pack_success`
  - `pdf_export_success`
  - `pdf_export_failure`
  - `handler_error`
- Added CloudWatch dashboard `sic-club-vivo-${envName}` for session create / pack / PDF signals.
- Added alarm `sic-dev-pdf-export-failures` with `TreatMissingData = notBreaching`.
- Error responses include `correlationId` and `requestId`.
- Tenant-context diagnostic logging was observed during local test runs.
- Added `pdf_export_failed` as a route-specific structured log signal to make PDF export failures measurable via log metric filters.

### Evidence

- Commands run / referenced:
  - `git log --oneline -10`
  - `git show --name-only --oneline -1`
  - `git status`
- Outputs/results referenced:
  - `GET /me` -> `200`
  - `POST /sessions` -> `201`
  - `GET /sessions?limit=10` -> `200`
  - `GET /sessions/{sessionId}` -> `200`
  - `GET /sessions/{sessionId}/pdf` -> `200` with `{ url, expiresInSeconds: 300 }`
  - downloaded PDF opened successfully
  - cross-tenant `GET /sessions/{sessionId}/pdf` -> `404`
  - malformed JSON on sessions create -> `400 invalid_json`
  - unauthenticated `GET /sessions` -> `401`
  - `POST /session-packs` returned a `pack` with `sessionsCount = 3`
  - invalid JSON and unknown field cases on `/session-packs` returned fail-closed responses
  - latest commit in local history added the tenant guardrails workflow
- Commits explicitly recorded in notes:
  - `6182c2b` - `feat: add session create validation`
  - `420bcfe` - `feat: add session repository persistence`
  - `25b16d4` - `feat: add sessions routes and handler`
  - `<ADD_YOUR_FIX_COMMIT_HASH_HERE>` - `fix: return 400 for invalid JSON in sessions create`
  - `3b0c8ca` - `validation`
  - `da37f2c` - `templates / deterministic generator`
  - `977ff5a` - `session-packs handler`
  - `a849bef` - `CDK: add session-packs route + lambda`
  - `45da42225e5580a02ae7619de8496a9575863b99` - `chore(ci): add tenant guardrails workflow`
  - `9938306aea99f94184663137bc40d161cc8eadc2` - `test(tenant): add contract tests and DI seam for buildTenantContext`
  - `88add42` - `API-only PDF export (helpers + handler route + tests)`
  - `cdb9211` - `CDK: PDF exports bucket + route + env vars + entrypoint support`
  - `fa435a0` - `Docs: Week 5 demo runbook`
  - `6b4ed60` - `API: add pdf_export_failed structured log marker + test`
  - `ea950c2` - `CDK: coach-loop observability (metric filters + dashboard + alarm)`

### Issues/bugs + fixes

- Malformed JSON on `POST /sessions` returned `500 platform.internal`.
  - Fix: converted parse failure into a typed bad-request path so the response becomes `400 invalid_json`.
- `Invoke-RestMethod` behavior on non-2xx responses complicated PowerShell verification.
  - Fix: validated fail-closed behavior by inspecting returned JSON/error bodies carefully.
- Generated Session Pack duration did not fully match `durationMin` (`55` vs `60` minutes).
  - Fix: not resolved in notes; recorded as an open decision.
- Unknown fields returned a generic bad-request code rather than a more specific code.
  - Fix: not changed in notes; recorded as optional consistency work.
- CDK synth/diff was blocked locally when Cognito env vars were missing or AWS account resolution was unavailable.
  - Fix: added a fail-soft main entrypoint and a dedicated API-only entrypoint for synth/diff review; account-resolution still depends on local AWS/CDK environment.
- Windows Node test runner intermittently failed with `spawn EPERM`.
  - Fix: used targeted test invocation patterns and validated code changes separately from the local runner limitation.

### Next steps

- Decide whether generated session templates must sum exactly to `durationMin` or allow documented buffer minutes.
- Add a small integration-style test harness or script for repeated fail-closed validation.
- Extend tenant-enforcement coverage one layer higher around the wrapped request path.
- Add the new Week 5 demo runbook to the broader runbook index/signals mapping if it becomes a regular operator artifact.
- Decide lifecycle/retention policy for session PDF exports as the artifact volume grows.
- Resolve local CDK account-resolution friction so `cdk diff` can be used consistently for API-only review.

## Week 6

### Goals

- Expand Club Vivo from coach-facing session flows into governance-oriented domain relationships.
- Ship Clubs, Teams, and Memberships as tenant-safe domain slices with fail-closed RBAC.
- Wire Memberships into the deployed API with least-privilege IAM.
- Document upgrade and active-tenant-selection direction without weakening the tenant authority model.

### Work completed

- Shipped the Clubs slice:
  - `POST /clubs`
  - `GET /clubs`
- Added tenant-safe RBAC tests for Clubs.
- Shipped the Teams slice:
  - `POST /teams`
  - `GET /teams`
- Added tenant-safe RBAC tests for Teams.
- Shipped the Memberships slice:
  - `POST /memberships`
  - `GET /memberships`
- Added Memberships tests proving spoofed tenant input is not propagated.
- Wired Memberships into CDK with:
  - `MembershipsFn`
  - authenticated `/memberships` routes behind the existing JWT authorizer
- Added the Week 6 Day 3 closeout note:
  - `docs/progress/week_6/day-3-notes.md`
- Added ADR:
  - `docs/adr/ADR-0008-coach-basic-to-org-premium-upgrade-and-active-tenant-selection.md`

### Key decisions + tradeoffs

- Keep tenant authority in verified auth plus entitlements rather than domain membership records.
  - Why: preserves the fail-closed security boundary established earlier in the platform.
  - Tradeoff: membership is useful for org modeling and application logic, but cannot be treated as the authorization source of truth.
- Ship Memberships with a dedicated Lambda and route family.
  - Why: matches the existing per-resource API stack pattern and keeps ownership clear.
  - Tradeoff: adds another Lambda/function resource to manage in CDK.
- Keep IAM least-privilege and table-specific for memberships.
  - Why: aligns with SIC security doctrine and avoids accidental permission creep.
  - Tradeoff: permissions must be maintained explicitly as the memberships feature grows.

### Tenancy/security checks

- Clubs, Teams, and Memberships derive tenant scope from `tenantCtx` only.
- Tenant context remains derived from verified JWT identity plus authoritative entitlements.
- Memberships handler never trusts `tenant_id`, `tenantId`, or `x-tenant-id` from request input.
- Spoofed tenant fields are not propagated to the memberships repository.
- DynamoDB access remains tenant-scoped by construction:
  - `PK = TENANT#<tenantId>`
  - entity-specific `SK` prefixes
- Memberships CDK IAM stayed least-privilege:
  - no wildcard `Action`
  - no wildcard `Resource`
  - no `Scan`
  - `membershipsFn` does not receive `TransactWriteItems`

### Observability notes

- Memberships routes inherit the platform wrapper path:
  - JWT authorizer
  - `withPlatform`
  - `buildTenantContext(event)`
- Existing structured request lifecycle logging continues to apply to the new Memberships handler.
- Week 6 documentation now includes a closeout note and ADR so the governance expansion is traceable in repo docs.

### Evidence

- Closeout note:
  - `docs/progress/week_6/day-3-notes.md`
- ADR:
  - `docs/adr/ADR-0008-coach-basic-to-org-premium-upgrade-and-active-tenant-selection.md`
- Key commits:
  - `e6550c3`
  - `bd3ac7f`
  - `b99d6c1`
  - `c450705`

### Issues/bugs + fixes

- No new cross-tenant access pattern was introduced in Week 6 work.
- A key correction during the memberships wiring pass was to keep IAM narrower than the reusable write list used elsewhere, specifically avoiding unnecessary `TransactWriteItems`.

### Next steps

- Move into Week 7 domain export contract work for lake-ready entity data.
- Decide whether Clubs and Teams should now be wired into the deployed API using the same authenticated route pattern as Memberships.
