# SIC Engineering Process Log
**Purpose:** Chronological engineering log capturing what we built, the architectural decisions we made, and the evidence that proves it.  
**Cadence:** Updated weekly on Day 3 (Docs + LinkedIn).  
**Last updated:** 2026-03-13

---

## How to use this log
Each week includes:
- **Goal**
- **What we built (artifacts + paths)**
- **Key decisions**
- **Guardrails enforced (tenancy/security/fail-closed)**
- **Observability & operations**
- **Evidence (commands/tests/dashboards/docs)**
- **Next focus**

> This log is derived from Week 0–3 engineering notes (zip) and reflects actual progress and file-level artifacts.

---

# Week 0 — Foundations (COMPLETED)

## Goal
Establish AWS account security, CLI baseline, and a repo/docs structure suitable for a production-minded multi-tenant platform.

## What we built (artifacts)
- AWS CLI configured (region: `us-east-1`, output: `json`)
- Initial S3 test bucket created via CLI (`sic-dev-jleom`)
- Repository initialized with docs baseline
- Security orientation notes captured

## Key decisions
- Use a personal AWS account as an SIC sandbox early; keep a path to dedicated accounts/environments later.
- Root user restricted to billing/account setup only; daily dev via IAM user with MFA.
- Cost guardrails start immediately (budget at $5, email alerts).

## Guardrails enforced (tenancy/security/fail-closed)
- MFA for privileged identity
- Root account not used for development
- Budget alerts as a “non-optional” baseline control

## Observability & operations
- Cost monitoring via AWS Budgets alerts

## Evidence
Commands executed:
```bash
aws --version
aws configure
aws sts get-caller-identity

aws s3 mb s3://sic-dev-jleom --region us-east-1
aws s3 cp sic-test.txt s3://sic-dev-jleom/
aws s3 ls s3://sic-dev-jleom/
```

## Next focus
Identity and API entry point: Cognito + JWT authorizer + first protected endpoint.

---

# Week 1 — Identity model decisions (COMPLETED)

## Goal
Build the authentication entry point and establish the rule: **tenant identity is platform-derived and never trusted from client input**.

## What we built (artifacts)
- CDK bootstrap performed to enable deployments:
  - `npx cdk bootstrap aws://<redacted-account-id>/us-east-1`
- Auth foundation deployed (Cognito User Pool + Hosted UI + App Client)
- Role groups created: `cv-admin`, `cv-coach`, `cv-medical`, `cv-athlete`
- PostConfirmation Lambda trigger implemented and tested:
  - auto-assigns user to a group on signup/confirmation
  - validated via CloudWatch logs
- Product onboarding strategy documented (two modes planned)
  - Mode A: Solo coach self-sign-up (planned; `selfSignUpEnabled: false` in Week 1)
  - Mode B: Org onboarding via invites/admin (planned)

## Key decisions
- One tenancy model; two onboarding modes (planned) — product growth without compromising isolation.
- Tenant enforcement must occur in layers; identity is the first gate (Cognito + JWT).
- Infrastructure outputs are the source of truth (CloudFormation outputs used for IDs and wiring).

## Guardrails enforced (tenancy/security/fail-closed)
- Authentication required for protected routes via JWT authorizer (no “open dev” backdoors).
- Tenant identifiers are not accepted from body/query/headers in any backend code path (policy established).

## Observability & operations
- CloudWatch logs used to validate trigger execution and early auth flows.

## Evidence
- CDK bootstrap output and successful `cdk deploy` flows.
- CloudWatch logs confirming PostConfirmation trigger executed.
- Week 1 Day 3 security closeout doc consolidating the tenancy model and onboarding strategy.

## Next focus
Introduce server-side authorization and tenancy guardrails: **fail-closed** and **entitlements-backed** tenant context.

---

# Week 2 — Fail-closed architecture (COMPLETED)

## Goal
Implement **server-side tenant enforcement** and make failure modes deterministic, testable, and operationally diagnosable.

## What we built (artifacts + paths)

### Day 1 — Least privilege IAM + tenant claim contract + alarms
- Tenant Claim Contract doc:
  - `docs/architecture/tenant-claim-contract.md`
- Tenant claim enforcement guard in `/me`:
  - `services/club-vivo/api/me/handler.js`
- Observability (IaC-managed):
  - HTTP API access logs + alarms in `infra/cdk/lib/sic-api-stack.ts`
- Least privilege IAM tightening:
  - scoped `cognito-idp:AdminAddUserToGroup` to the user pool ARN in `infra/cdk/lib/sic-auth-stack.ts`
- Runbook:
  - `docs/runbooks/auth-api-alarms.md`

### Day 2 — Tenant isolation + shared API guardrails
- Tenant context boundary (DB-backed entitlements path):
  - `services/club-vivo/api/_lib/tenant-context.js`
  - source of truth:
    - `userId` ← JWT `claims.sub`
    - `tenantId/role/tier` ← DynamoDB entitlements table
  - enforced tenant format: `^tenant_[a-z0-9-]{3,}$`
- Shared guardrails utilities:
  - `services/club-vivo/api/_lib/parse-body.js` → deterministic `400 invalid_json`
  - `services/club-vivo/api/_lib/validate.js` → deterministic `400 missing_fields`
- Packaging standardization so `_lib` ships with Lambdas:
  - CDK packages entire `services/club-vivo/api` directory
- Proving endpoint:
  - `POST /test-tenant` validates the full pipeline end-to-end

### Day 3 — Deterministic negative tests + token stability
- Token minting stabilized to eliminate “random 401” failures by:
  - pulling the Cognito App Client ID from CloudFormation outputs (source of truth)
  - correcting PowerShell quoting for `$` in passwords
  - ensuring `--auth-parameters` passed correctly
- Fail-closed behavior proven:
  - deleting the entitlements row yields `403 missing_entitlements` on `/me`
- Deterministic 400-series tests enabled once entitlements restored:
  - malformed JSON → `400 invalid_json`
  - missing required fields → `400 missing_fields`

## Key decisions
- **Tenant claims are trusted only from verified JWT + enforced in Lambda middleware** (defense-in-depth).
- **401 vs 403 policy:**
  - `401` = missing/invalid auth context (never reached Lambda)
  - `403` = authenticated but missing/invalid tenant claim contract or entitlements
- **Entitlements store is authoritative** (supports instant revocation and tier/role gating).

## Guardrails enforced (tenancy/security/fail-closed)
- `buildTenantContext(event)` / tenant-context boundary is mandatory first step in every handler.
- Missing claims or missing entitlements always fails closed with deterministic error codes.
- IAM actions narrowed (least privilege) and alarms managed via IaC (no console drift).

## Observability & operations
- Access logs enabled for HTTP API.
- Alarms created and documented via runbook.
- Logs standardized to include `requestId`, `userId`, `tenantId`, and `error.code` to support ops diagnosis.

## Evidence
Commands/tests referenced in notes:
```bash
aws sts get-caller-identity
aws cloudformation describe-stacks --stack-name SicAuthStack-Dev
aws dynamodb delete-item --table-name sic-tenant-entitlements-dev ...
aws dynamodb scan --table-name sic-tenant-entitlements-dev ...
```

Behavior proven:
- `/me` with valid JWT but no entitlements row → `403 missing_entitlements`
- `/test-tenant` malformed JSON → `400 invalid_json`

## Next focus
Tenant-safe domain persistence: single-table DynamoDB, deterministic CRUD, idempotency, auditability, and CloudWatch operational signals.

---

# Week 3 — Tenant-safe persistence and observability (COMPLETED, incl. Day 4)

## Goal
Move from “tenant-safe authorization” to “tenant-safe data operations,” with production-minded behavior: deterministic CRUD, idempotency, audits, and real operational signals.

## What we built (artifacts + paths)

### Pre–Day 1 — Guardrails + entitlements onboarding automation
- VS Code/AI guardrails:
  - `.github/copilot-instructions.md`
  - `.github/hooks/sic-hooks.json`
- Entitlements onboarding automation (to solve missing entitlements rows):
  - Updated `SicAuthStack` to import `TenantEntitlementsTableName-<env>`
  - Set `TENANT_ENTITLEMENTS_TABLE` env var on the PostConfirmation Lambda
  - Granted DynamoDB write permissions for entitlements provisioning
- PostConfirmation provisioning behavior:
  - adds user to `cv-athlete`
  - writes entitlements row `{{ user_sub, tenant_id, role, tier }}`

**Validation evidence**
- `cdk synth` ✅
- `cdk diff` ✅ (Auth stack only)
- `cdk deploy SicAuthStack-Dev` ✅
- entitlements row created ✅
- `/me` returns tenant context ✅

### Day 1 — Tenant-safe repository boundary + deterministic pagination
- Tenant-safe repository boundary (example):
  - `services/club-vivo/api/_lib/athlete-repository.js`
  - `listAthletes` enforces:
    - `PK = TENANT#<tenantId>` and `begins_with(SK, "ATHLETE#")`
  - Pagination:
    - `nextToken = base64(JSON(LastEvaluatedKey))`
    - deterministic `400 invalid_next_token` on decode/shape failures
- `/test-tenant` enhanced with `op: "list_athletes"` branch:
  - deterministic fail-closed `500 missing_domain_table` until domain table exists

### Day 2 — Domain table + deterministic CRUD patterns
- Domain DynamoDB table provisioned:
  - `sic-domain-<env>` (PAY_PER_REQUEST)
  - `PK`/`SK` strings
- Key layout example:
  - `PK = TENANT#<tenantId>`
  - `SK = ATHLETE#<athleteId>`
- Deterministic CRUD and access patterns designed to be query-only (no scans).

### Day 3 — Real athlete endpoints + audit + metrics
- Promoted prototype into real authenticated endpoints:
  - `POST /athletes`
  - `GET /athletes`
  - `GET /athletes/{athleteId}`
- Tenant scoping enforced by key design (partition isolation by construction).
- Auditability:
  - atomic write includes `ATHLETE` record + `AUDIT` record
- Operational metrics:
  - `athlete_create_success`
  - `athlete_create_failure`
  - `athlete_create_idempotent_replay`
- CloudWatch operational dashboard:
  - `sic-dev-ops`

### Day 4 — Operational maturity hardening (extra session)
- Removed insecure/temporary endpoints
- Validated the full chain: auth → entitlements → tenant context → data access
- Standardized API contract naming (pagination naming)
- Captured architectural contracts in docs
- Verified dashboard with real traffic

## Key decisions
- Single-table DynamoDB is the default for tenant-partitioned domain entities.
- Idempotency is required for write operations to enable safe retries and deterministic replays.
- “Observability is a feature”: metrics + dashboards are part of the definition of done.

## Guardrails enforced (tenancy/security/fail-closed)
- Tenant context required before any domain data access.
- Tenant scoping by construction (`PK = TENANT#...`) — no scan-then-filter.
- Deterministic error codes for token decode, missing tables, and validation failures.
- Entitlements provisioning automated to prevent manual, error-prone onboarding.

## Observability & operations
- Logs confirmed to include `requestId`, `userId`, `tenantId`, `code`, `statusCode`
- Custom metrics created for success/failure/replay
- Dashboard (`sic-dev-ops`) verified with live traffic

## Evidence
Deployment and runtime evidence cited in notes:
- `cdk deploy SicApiStack-Dev` ✅
- `/test-tenant` with ACCESS token + `{"name":"ping"}` → `200`
- `/test-tenant` with `{"op":"list_athletes"}` → deterministic `missing_domain_table`
- CloudWatch dashboard shows metric activity for athlete creates and replays

## Next focus
Production readiness pass #1 (Week 4):
- standardized logging contract + correlation propagation
- formal error contract (4XX vs 5XX)
- alarms + runbooks completeness
- reliability patterns (timeouts/retries/throttling) as “done”

---

## Open ADR triggers (capture when they happen)
- Adding GSIs or new relationship patterns to the DynamoDB single-table design
- Domain export contract for analytics (schema versioning + governance)
- Tenant isolation strategy for BI (Athena/QuickSight RLS patterns)
- ML/GenAI tenancy boundaries and prompt/data handling policies
