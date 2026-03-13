# SPORTS INTELLIGENCE CLOUD (SIC) — PLATFORM ROADMAP V3
**Updated after Week 3 Day 4**  
Cadence: **3 days/week, 7 hours/day** (Day 3 includes **Docs + LinkedIn**)

This roadmap reflects real progress through Week 3 and defines the next build phases for a secure, multi-tenant Sports Intelligence Cloud platform supporting operational APIs, analytics, ML pipelines, and GenAI capabilities.

---

## Platform status after Week 3 (completed)
**Identity Layer**
- Cognito authentication with `custom:tenant_id` claim injection via Pre-Token Generation trigger
- Tenant identity propagation: Cognito → JWT → API Gateway → Lambda → Data Layer

**Authorization Layer**
- Server-side entitlement validation using DynamoDB entitlements table (`sic-tenant-entitlements-dev`)
- Fail-closed rules (missing claims / missing entitlements / invalid tenant → reject)

**API Layer**
- HTTP API Gateway + Lambda services
- Guardrails: deterministic parsing/validation, error handling, strict request schema validation

**Domain Data Layer**
- Tenant-partitioned DynamoDB single-table model (`sic-domain-dev`)
  - `PK = TENANT#<tenantId>`
  - `SK = ENTITY#<id>`
- Athlete domain endpoints (POST/GET/list + pagination)
- Idempotency-Key required for writes; deterministic replay behavior
- Atomic writes include domain record + audit record

**Observability Layer**
- Structured logs include `requestId`, `userId`, `tenantId`, error codes
- CloudWatch metrics + operational dashboard (`sic-dev-ops`)

---

# PHASE 0 — PLATFORM FOUNDATIONS
## WEEK 0 (COMPLETED)
**Goal:** Establish AWS account security, repository structure, and development baseline.

**Achievements**
- AWS CLI configured; initial S3 bucket created
- Root restricted to billing; IAM admin user created; MFA enabled
- Budget alerts configured
- Repo created; docs structure established

---

# PHASE 1 — IDENTITY AND API FOUNDATION
## WEEK 1 (COMPLETED)
**Goal:** Build the authentication and API entry point for the platform.

**Achievements**
- Cognito User Pool deployed with Hosted UI
- Groups implemented: `cv-admin`, `cv-coach`, `cv-medical`, `cv-athlete`
- Tenant identity via `custom:tenant_id` claim injected into JWT tokens
- API Gateway HTTP API + Lambda backend + Cognito authorizer
- `GET /me` endpoint validates auth + tenant propagation

---

# PHASE 2 — AUTHORIZATION AND TENANT GUARDRAILS
## WEEK 2 (COMPLETED)
**Goal:** Implement strong server-side tenant enforcement and fail-closed behavior.

**Achievements**
- `buildTenantContext(event)` resolves authoritative tenant context from JWT claims + entitlements table
- Fail-closed rules:
  - Missing JWT claims → reject
  - Missing entitlements → reject
  - Invalid tenant identifier → reject
- Entitlements store: DynamoDB table keyed by `user_sub` with fields `{tenant_id, role, tier}`
- Shared utilities for parsing, validation, tenant verification, deterministic errors
- Structured logging improvements

---

# PHASE 3 — TENANT-SAFE DOMAIN PERSISTENCE
## WEEK 3 (COMPLETED + Day 4 hardening)
**Goal:** Tenant-scoped domain data operations + operational observability.

### Day 1 — Multi-Tenant Data Modeling
- Selected single-table DynamoDB architecture (`sic-domain-dev`)
- Key design:
  - `PK = TENANT#<tenantId>`
  - `SK = ENTITY#<id>`
- Guarantees strict partitioning + efficient queries (no cross-tenant scans)

### Day 2 — Domain CRUD Implementation (Athletes)
- Endpoints:
  - `POST /athletes`
  - `GET /athletes`
  - `GET /athletes/{athleteId}`
- Tenant-scoped queries, deterministic validation, pagination

### Day 3 — Auditability + Operational Signals
- Atomic writes: `ATHLETE` + `AUDIT`
- Metrics:
  - `athlete_create_success`
  - `athlete_create_failure`
  - `athlete_create_idempotent_replay`
- CloudWatch dashboard: `sic-dev-ops`

### Day 4 — Operational Maturity
- Removed unsafe dev endpoints
- Validated full entitlement flow using Cognito tokens
- Enforced strict schema validation and Idempotency-Key for writes
- Verified dashboard with real traffic

---

# PHASE 4 — PRODUCTION READINESS PASS #1
## WEEK 4 (NEXT) — Operate SIC like a platform system
**Goal:** Make the system reliably operable (logging, alarms, error semantics, runbooks) before expanding scope.

### Day 1 (7h) — Logging standard + correlation propagation
**Concept mastery (2h)**
- Structured logging patterns, correlation IDs, log-based metrics

**Build (4h)**
- Standard log schema (fields/levels/error codes) across functions
- Correlation/request ID propagation end-to-end

**Verification (1h)**
- Generate test traffic and confirm logs can be filtered by `tenantId/userId/requestId`

### Day 2 (7h) — Reliability patterns + error contract
**Concept mastery (2h)**
- Timeouts, retries/backoff, throttling, failure-mode thinking for serverless

**Build (4h)**
- Formal error contract: 4XX client vs 5XX platform errors
- Tuned Lambda timeouts; safe retry guidance; throttling notes

**Verification (1h)**
- Inject failures (bad input, missing entitlements, idempotency replay) and confirm deterministic responses

### Day 3 (7h, Docs + LinkedIn) — Runbooks + alarms + readiness narrative
**Concept mastery (1.5h)**
- Runbook structure + alarm hygiene

**Build (3.5h)**
- Runbooks: auth failures, entitlement failures, Dynamo throttling, idempotency replay
- Alarm thresholds + dashboard review

**Evidence (2h)**
- Update diagrams + weekly architecture note + LinkedIn post

---

# PHASE 5 — DOMAIN EXPANSION + API PRODUCTIZATION
## WEEK 5 — Domain v2: Clubs/Teams + Membership + RBAC checks
**Goal:** Create real relationships for analytics/ML while preserving tenant isolation by construction.

### Day 1 (7h) — Clubs + Teams entities
- Learn: single-table relationship patterns (adjacency lists, GSIs)
- Build: `Club` + `Team` entities (tenant-scoped), create/list endpoints
- Verify: query-only access patterns (no scan-then-filter)

### Day 2 (7h) — Membership model + authorization
- Learn: roles vs permissions; domain membership enforcement
- Build: coach/team membership records; enforce membership in handlers
- Verify: negative tests (cross-tenant and non-member access fails)

### Day 3 (7h, Docs + LinkedIn) — API product discipline
- Build: API examples + error cases; test-data seeding notes
- Evidence: weekly architecture note + LinkedIn post

## WEEK 6 — Domain v3: Sessions/Workouts + timeline events
**Goal:** Add time-ordered records for downstream analytics and ML.

### Day 1 (7h) — Session entity + list patterns
- Learn: time ordering and pagination patterns in DynamoDB
- Build: `Session` create/list endpoints; tenant-scoped pagination
- Verify: access patterns and index usage documented

### Day 2 (7h) — Idempotent event writes + audit
- Learn: idempotency for event writes and replay handling
- Build: Idempotency-Key required; replay metadata; audit record on mutation
- Verify: replay metrics + deterministic response behavior

### Day 3 (7h, Docs + LinkedIn) — Operational signals for sessions
- Build: metrics/dashboards for session writes (success/failure/replay/latency)
- Evidence: weekly post + updated diagrams if needed

## WEEK 7 — Domain export contract v1 (lake-ready)
**Goal:** Define stable data contracts and export strategy for analytics.

### Day 1 (7h) — Schema contracts + versioning
- Learn: schema versioning + backward compatibility
- Build: “Domain Export Spec” for Athlete/Club/Team/Session (v1)
- Verify: examples + evolution rules documented

### Day 2 (7h) — Export job (tenant-partitioned)
- Learn: S3 partitioning concepts + tenant-safe prefixing
- Build: export Lambda/job (manual trigger ok) writing tenant-partitioned datasets to S3
- Verify: access policies and prefix rules validated

### Day 3 (7h, Docs + LinkedIn) — Export runbook + alarms
- Build: runbook + alarms for export failures and volume anomalies
- Evidence: weekly post

## WEEK 8 — Testing & CI hardening sprint #1
**Goal:** Prevent regressions in tenant isolation, contracts, and operability.

### Day 1 (7h) — Integration test suite
- Learn: integration test strategy for serverless APIs
- Build: cross-tenant access tests must fail; contract tests for key endpoints

### Day 2 (7h) — CI gates + quality bar
- Learn: PR gating and deployment safety patterns
- Build: CI steps for lint + unit tests + integration tests (where feasible)

### Day 3 (7h, Docs + LinkedIn) — Month 2 recap
- Build: recap doc + updated diagrams + LinkedIn post

---

# PHASE 6 — DATA LAKE AND ANALYTICS (Weeks 9–12)
## WEEK 9 — S3 Data Lake foundations (tenant-safe)
### Day 1
- Design lake layout (Bronze/Silver/Gold), encryption, prefix conventions
### Day 2
- Lifecycle policies + cost controls, audit/logging strategy
### Day 3 (Docs + LinkedIn)
- Lake README + tenant access guide + post

## WEEK 10 — Glue Catalog + ETL v1
### Day 1
- Glue Catalog + crawler strategy; schema evolution approach
### Day 2
- Bronze→Silver ETL job v1 (partitioned Parquet)
### Day 3 (Docs + LinkedIn)
- ETL runbook + alarms + post

## WEEK 11 — Athena query layer + cost discipline
### Day 1
- Curated Athena views for core metrics; partition-aware design
### Day 2
- Performance/cost playbook (“query rules” doc)
### Day 3 (Docs + LinkedIn)
- Metrics glossary + sample queries + post

## WEEK 12 — QuickSight dashboards + tenant access controls
### Day 1
- Dataset modeling + dashboard prototype
### Day 2
- Tenant isolation strategy for BI (RLS pattern)
### Day 3 (Docs + LinkedIn)
- Month recap + diagram refresh + post

---

# PHASE 7 — ML FOUNDATIONS (Weeks 13–16)
## WEEK 13 — ML problem definition + labeling + feature plan
### Day 1
- Define prediction targets and label spec; leakage risks
### Day 2
- Feature spec + data splits + baseline eval plan
### Day 3 (Docs + LinkedIn)
- ML problem statement doc + post

## WEEK 14 — Baseline training (SageMaker)
### Day 1
- Baseline training job + artifact storage + reproducibility notes
### Day 2
- Evaluation reporting + versioning
### Day 3 (Docs + LinkedIn)
- Baseline report + post

## WEEK 15 — Improvement loop (tuning + better features)
### Day 1
- Hyperparameter tuning + experiment tracking
### Day 2
- Error analysis + feature improvements
### Day 3 (Docs + LinkedIn)
- “What improved and why” post + doc update

## WEEK 16 — Explainability + coach interpretation
### Day 1
- Explanation artifacts + limitations
### Day 2
- Coach-facing interpretation template + UX notes
### Day 3 (Docs + LinkedIn)
- Month recap + ML diagram update + post

---

# PHASE 8 — MLOPS PRODUCTION (Weeks 17–20)
## WEEK 17 — Pipelines + registry workflow
### Day 1
- Pipeline skeleton and stages
### Day 2
- Model registry + approval rules
### Day 3 (Docs + LinkedIn)
- Pipeline runbook + post

## WEEK 18 — Deploy model + integrate into API
### Day 1
- Inference deployment + IAM least privilege
### Day 2
- Tenant-scoped `/predict` endpoint + fallback strategy
### Day 3 (Docs + LinkedIn)
- Integration docs + post

## WEEK 19 — Monitoring + drift + quality alerts
### Day 1
- Capture inference inputs/outputs dataset (tenant-safe)
### Day 2
- Drift/quality checks + alarms + runbook
### Day 3 (Docs + LinkedIn)
- Failure-modes post + doc updates

## WEEK 20 — Hardening pass #2 (security/cost/reliability)
### Day 1
- Security checklist + fixes
### Day 2
- Cost model + scaling constraints backlog
### Day 3 (Docs + LinkedIn)
- Month recap + diagrams + post

---

# PHASE 9 — GENAI LAYER (Weeks 21–24)
## WEEK 21 — Bedrock summaries (athlete reports)
### Day 1
- Prompt template + rubric; safety disclaimers
### Day 2
- Summarization endpoint + caching + guardrails
### Day 3 (Docs + LinkedIn)
- Guidance doc + post

## WEEK 22 — RAG foundation (coach knowledge base)
### Day 1
- Tenant-aware ingestion + metadata strategy
### Day 2
- Retrieval endpoint + citations format
### Day 3 (Docs + LinkedIn)
- RAG reliability post + docs

## WEEK 23 — Safety + evaluation harness
### Day 1
- Prompt injection mitigations + IO filtering rules
### Day 2
- Automated eval harness + regression thresholds
### Day 3 (Docs + LinkedIn)
- Safety/eval post + docs

## WEEK 24 — Integrate GenAI into portal + platform
### Day 1
- Feature flags + UX patterns
### Day 2
- LLM observability + cost alarms
### Day 3 (Docs + LinkedIn)
- Month recap + diagrams + post

---

# PHASE 10 — RUTA VIVA INTEGRATION + UNIFIED SIC (Weeks 25–26)
## WEEK 25 — Ruta Viva ingestion + storage
### Day 1
- Ingestion endpoint + tenant-safe S3 layout
### Day 2
- Validation + data quality + audit signals
### Day 3 (Docs + LinkedIn)
- Product framing doc + post

## WEEK 26 — Unified SIC experience + career package
### Day 1
- Unify tenancy patterns + cross-service observability
### Day 2
- Demo script + walkthrough architecture doc + interview stories
### Day 3 (Docs + LinkedIn)
- Final recap + portfolio index + post

---

## Continuous engineering standards (always-on)
Every week, maintain:
- **Tenant isolation:** enforced in auth → API → data
- **Least privilege IAM:** no wildcards; scoped resources
- **Observability:** logs, metrics, alarms, dashboards maintained
- **Cost awareness:** note cost drivers and set guardrails
- **Documentation discipline:** architecture notes + learning logs
- **Technical communication:** diagrams and decision records kept current