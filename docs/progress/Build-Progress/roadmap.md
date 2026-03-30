# SPORTS INTELLIGENCE CLOUD (SIC) — PLATFORM ROADMAP V4
**Cadence:** 3 days/week, 7 hours/day (Day 3 includes **Docs + LinkedIn**)
**Update:** Week 5/6 re-sequenced to ship coach-value (Sessions/Workouts) earlier than governance (Clubs/Teams).

This roadmap reflects progress through Week 3 and defines the next build phases for a secure, multi-tenant Sports Intelligence Cloud platform supporting operational APIs, analytics, ML pipelines, and GenAI capabilities.

---

## Platform status after Week 3 (completed)
**Identity Layer**
- Cognito authentication with `custom:tenant_id` claim injection via Pre-Token Generation trigger
- Tenant identity propagation: Cognito → JWT → API Gateway → Lambda → Data Layer

**Authorization Layer**
- Server-side entitlement validation using DynamoDB entitlements table
- Fail-closed rules (missing claims / missing entitlements / invalid tenant → reject)

**API Layer**
- HTTP API Gateway + Lambda services
- Guardrails: deterministic parsing/validation, strict request schema validation

---

## WEEK 0 (COMPLETED)
**Goal:** foundational AWS + repo workflow bootstrapped.
### Day 1
- **Learn:** core AWS account setup + CLI/IAM basics
- **Build:** repo skeleton + initial CI hooks
- **Evidence:** baseline docs/logs
### Day 2
- **Learn:** serverless primitives (API GW, Lambda, DynamoDB)
- **Build:** “hello platform” endpoints
- **Verify:** deploy + smoke test
### Day 3 (Docs + LinkedIn)
- **Build:** learning log + architecture note
- **Evidence:** weekly post

## WEEK 1 (COMPLETED)
**Goal:** multi-tenant identity path established end-to-end.
### Day 1
- **Learn:** Cognito flows + JWT claims
- **Build:** tenant claim injection
- **Verify:** claim present and stable
### Day 2
- **Learn:** authorizers + request context
- **Build:** tenant context propagation pattern
- **Verify:** fail-closed when missing
### Day 3 (Docs + LinkedIn)
- **Build:** identity/tenancy note
- **Evidence:** weekly post

## WEEK 2 (COMPLETED)
**Goal:** entitlements enforcement and least-privilege access patterns.
### Day 1
- **Learn:** DynamoDB access patterns (no scan-then-filter)
- **Build:** entitlements table + lookup utilities
- **Verify:** tenant-scoped reads only
### Day 2
- **Learn:** IAM least privilege patterns
- **Build:** per-function policies (no wildcards)
- **Verify:** cdk diff evidence + deploy
### Day 3 (Docs + LinkedIn)
- **Build:** entitlements/runbook docs
- **Evidence:** weekly post

## WEEK 3 (COMPLETED + Day 4 hardening)
**Goal:** platform API baseline with fail-closed behavior and operational guardrails.
### Day 1
- **Learn:** request validation + error semantics
- **Build:** strict schema validation + deterministic responses
- **Verify:** negative tests
### Day 2
- **Learn:** observability fundamentals
- **Build:** structured logging + correlation IDs
- **Verify:** trace a request end-to-end
### Day 3 (Docs + LinkedIn)
- **Build:** weekly architecture note + post
- **Evidence:** certification mapping paragraph

---

## WEEK 4 (COMPLETED) — Operate SIC like a platform system
**Goal:** make the system reliably operable (logging, alarms, error semantics, runbooks) before expanding scope.
### Day 1 — Logging standard + correlation propagation
- **Learn:** structured logging patterns, correlation IDs, log-based metrics
- **Build:** standard log schema across functions; correlation propagation end-to-end
- **Verify:** generate traffic and filter logs by tenant-safe identifiers
### Day 2 — Reliability patterns + error contract
- **Learn:** timeouts, retries/backoff, throttling, failure-mode thinking for serverless
- **Build:** formal error contract (4XX client vs 5XX platform); tuned Lambda timeouts; retry guidance
- **Verify:** inject failures and confirm deterministic responses
### Day 3 (Docs + LinkedIn) — Runbooks + alarms + readiness narrative
- **Learn:** runbook structure + alarm hygiene
- **Build:** runbooks (auth failures, entitlement failures, DynamoDB issues); CloudWatch alarms + dashboards
- **Evidence:** weekly architecture note + LinkedIn post

---

## WEEK 5 (COMPLETED)— Domain v3: Sessions/Workouts + Event Timeline
**Goal:** ship the first real coach-facing demo (session planning + pack generation) and start time-series-ish records for downstream analytics.
### Day 1 — Session Domain (CRUD, tenant-scoped)
- **Learn:** DynamoDB time-ordered modeling (range keys, pagination), tenant-scoped access by construction (no scan-then-filter)
- **Build:** `Session` entity (tenant-scoped keys); `POST /sessions`, `GET /sessions`, `GET /sessions/{sessionId}`
- **Verify:** request validation + unknown-field rejection; tenant context from auth only
### Day 2 — Session Pack Generator + Export (Coach value)
- **Learn:** deterministic generation, fail-closed validation, secure export patterns (S3 prefixes + presigned URLs)
- **Build:** `POST /session-packs`; `GET /sessions/{sessionId}/pdf` (generate PDF → S3 tenant prefix → presigned URL)
- **Verify:** client cannot override S3 key; IAM allow-list (no scans)
### Day 3 (Docs + LinkedIn) — Observability + Demo Script
- **Learn:** operational signals for product metrics (success/failure/latency)
- **Build:** metrics + dashboards; runbooks (S3 denied, Dynamo throttling, PDF failure); demo narrative script
- **Evidence:** weekly architecture note + LinkedIn post

## WEEK 6 (COMPLETED) — Domain v2: Clubs/Teams + Membership + RBAC Checks
**Goal:** expand domain relationships + governance after the coach-value wedge exists.
### Day 1 — Clubs + Teams (tenant-scoped relationships)
- **Learn:** DynamoDB single-table relationship patterns (adjacency lists, GSIs) and hierarchical modeling
- **Build:** `Club` + `Team` entities; create/list endpoints (tenant-scoped)
- **Verify:** query-only patterns (no scan-then-filter)
### Day 2 — Membership model + authorization
- **Learn:** access control design (roles vs permissions), enforcing via entitlements + domain membership
- **Build:** membership records (coach belongs to club/team); RBAC checks in handlers (fail-closed)
- **Verify:** negative tests (cross-tenant and non-member access fails)
### Day 3 (Docs + LinkedIn) — API product discipline
- **Learn:** API contract discipline (examples + error cases)
- **Build:** API examples + error cases; test-data seeding notes
- **Evidence:** weekly architecture note + LinkedIn post

---

## WEEK 7 (COMPLETED)— Domain export contract v1 (lake-ready)
**Goal:** define stable data contracts and export strategy for analytics.
### Day 1 — Schema contracts + versioning
- **Learn:** schema versioning + backward compatibility
- **Build:** Domain Export Spec (v1) for core entities
- **Verify:** examples + evolution rules documented
### Day 2 — Export job (tenant-partitioned)
- **Learn:** S3 partitioning + tenant-safe prefixing
- **Build:** export Lambda/job writing tenant-partitioned datasets to S3
- **Verify:** access policies + prefix rules validated
### Day 3 (Docs + LinkedIn) — Export runbook + alarms
- **Learn:** operational readiness for batch/export jobs
- **Build:** runbook + alarms for export failures and volume anomalies
- **Evidence:** weekly post

## WEEK 8 (COMPLETED)— Testing & CI hardening sprint #1
**Goal:** raise quality bar: automated tests, CI gates, safer deployments.
### Day 1 — Unit + contract testing baseline
- **Learn:** test pyramid for serverless; contract testing
- **Build:** unit tests for validators/generators; contract examples for endpoints
- **Verify:** CI runs on PR and blocks regressions
### Day 2 — Integration smoke tests
- **Learn:** test harness patterns; environment separation
- **Build:** scripted smoke tests (auth, 4xx, 5xx) for key endpoints
- **Verify:** repeatable test run with clean outputs
### Day 3 (Docs + LinkedIn) — CI/CD documentation
- **Learn:** release hygiene (changelogs, versioning)
- **Build:** CI runbook + “how to ship” doc
- **Evidence:** weekly post

## WEEK 9 (COMPLETED)— S3 Data Lake foundations (tenant-safe)
**Goal:** tenant-safe data lake layout that supports analytics and ML.
### Day 1 — Lake layout + access controls
- **Learn:** S3 prefixing, bucket policies, least privilege
- **Build:** lake bucket + tenant partition conventions
- **Verify:** tenant cannot read other tenant prefixes
### Day 2 — Ingest exported datasets
- **Learn:** lifecycle policies + cost controls
- **Build:** automated ingest of domain exports into lake partitions
- **Verify:** cost notes + storage class rules
### Day 3 (Docs + LinkedIn) — Lake runbooks
- **Learn:** common lake failure modes
- **Build:** runbooks + alarms (access denied, volume anomalies)
- **Evidence:** weekly post

## WEEK 10 (COMPLETED)— Glue Catalog + ETL v1
**Goal:** make lake data queryable and transformable.
### Day 1 — Glue Catalog basics
- **Learn:** crawlers, tables, partitions
- **Build:** Glue catalog for exported datasets
- **Verify:** partitions discovered correctly
### Day 2 — ETL v1 (minimal)
- **Learn:** transform patterns + incremental updates
- **Build:** Glue job (or Lambda) to produce curated datasets
- **Verify:** sample output correctness + tenant partitions preserved
### Day 3 (Docs + LinkedIn) — ETL ops notes
- **Learn:** job monitoring + retries
- **Build:** ETL runbook + alarms
- **Evidence:** weekly post

## WEEK 11 — Athena query layer + cost discipline
**Goal:** empower ad-hoc analytics safely and cheaply.
### Day 1 — Athena query patterns
- **Learn:** partition pruning, CTAS, workgroups
- **Build:** Athena workgroup + guardrails
- **Verify:** example queries with predictable cost
### Day 2 — Cost controls
- **Learn:** cost allocation tags, budgets, query limits
- **Build:** budgets/alarms; query scan limits
- **Verify:** forced failure when exceeding limits
### Day 3 (Docs + LinkedIn) — Query cookbook
- **Learn:** making analytics usable
- **Build:** query cookbook + cost notes
- **Evidence:** weekly post

## WEEK 12 — QuickSight dashboards + tenant access controls
**Goal:** first dashboards while preserving tenant boundaries.
### Day 1 — Dashboard MVP
- **Learn:** dashboard design + metrics selection
- **Build:** MVP dashboard on curated datasets
- **Verify:** correctness against Athena queries
### Day 2 — Tenant access patterns
- **Learn:** row-level security + embedding options
- **Build:** tenant-safe access controls for dashboards
- **Verify:** no cross-tenant visibility
### Day 3 (Docs + LinkedIn) — Demo dashboard narrative
- **Learn:** presenting value clearly
- **Build:** demo dashboard + weekly post
- **Evidence:** architecture note + cert mapping

---

# PHASE 7 — ML FOUNDATION (Weeks 13–16)
---

## WEEK 13 — ML problem definition + labeling + feature plan
**Goal:** define an ML problem that is measurable, non-leaky, and useful to coaches.
### Day 1
- **Learn:** target definition, labeling, leakage risks
- **Build:** prediction target + label spec
- **Verify:** leakage review checklist
### Day 2
- **Learn:** feature planning + splits + evaluation design
- **Build:** feature spec, data splits, baseline eval plan
- **Verify:** offline evaluation plan sanity checks
### Day 3 (Docs + LinkedIn)
- **Build:** ML problem statement doc + weekly post
- **Evidence:** certification mapping paragraph

## WEEK 14 — Baseline training (SageMaker)
**Goal:** establish a reproducible baseline model + artifacts.
### Day 1
- **Learn:** training job anatomy + reproducibility
- **Build:** baseline training job; artifact storage
- **Verify:** training rerun produces comparable results
### Day 2
- **Learn:** evaluation + versioning
- **Build:** evaluation reporting + model versioning notes
- **Verify:** metrics tracked consistently
### Day 3 (Docs + LinkedIn)
- **Build:** baseline report + weekly post
- **Evidence:** artifacts + graphs committed/linked

## WEEK 15 — Improvement loop (tuning + better features)
**Goal:** improve baseline through tuning and better features.
### Day 1
- **Learn:** HPO + experiment tracking
- **Build:** tuning job + tracking of experiments
- **Verify:** reproducible best run selection
### Day 2
- **Learn:** error analysis methods
- **Build:** feature improvements + error analysis report
- **Verify:** measurable lift and why
### Day 3 (Docs + LinkedIn)
- **Build:** “what improved and why” doc + weekly post
- **Evidence:** updated eval summary

## WEEK 16 — Explainability + coach interpretation
**Goal:** make model outputs interpretable and safe for coaching use.
### Day 1
- **Learn:** explainability artifacts + limitations
- **Build:** explanation approach + limitations doc
- **Verify:** sanity checks on explanations
### Day 2
- **Learn:** UX for interpretation
- **Build:** coach-facing interpretation template + UX notes
- **Verify:** example output reviewed
### Day 3 (Docs + LinkedIn)
- **Build:** month recap + ML diagram update + weekly post
- **Evidence:** updated architecture note

---

# PHASE 8 — MLOPS PRODUCTION (Weeks 17–20)
---

## WEEK 17 — Pipelines + registry workflow
**Goal:** automate training-to-approval workflow.
### Day 1
- **Learn:** pipeline stages and orchestration
- **Build:** pipeline skeleton and stages
- **Verify:** pipeline runs end-to-end with dummy steps
### Day 2
- **Learn:** registry and approvals
- **Build:** model registry + approval rules
- **Verify:** promotion rules enforced
### Day 3 (Docs + LinkedIn)
- **Build:** pipeline runbook + weekly post
- **Evidence:** ops checklist

## WEEK 18 — Deploy model + integrate into API
**Goal:** serve predictions through a tenant-safe API with fallback.
### Day 1
- **Learn:** deployment patterns + IAM least privilege
- **Build:** inference deployment + scoped permissions
- **Verify:** smoke test inference endpoint
### Day 2
- **Learn:** API integration + resiliency
- **Build:** tenant-scoped `/predict` endpoint + fallback strategy
- **Verify:** failure-mode tests (model down, timeout)
### Day 3 (Docs + LinkedIn)
- **Build:** integration docs + weekly post
- **Evidence:** runbook updates

## WEEK 19 — Monitoring + drift + quality alerts
**Goal:** detect model degradation and data drift early.
### Day 1
- **Learn:** monitoring concepts (drift, quality, latency)
- **Build:** monitoring dashboards + alarms
- **Verify:** alerts trigger in simulated drift
### Day 2
- **Learn:** data quality checks
- **Build:** data validation + drift reports
- **Verify:** actionable thresholds
### Day 3 (Docs + LinkedIn)
- **Build:** monitoring runbook + weekly post
- **Evidence:** incident response steps

## WEEK 20 — Hardening pass #2 (security/cost/reliability)
**Goal:** production readiness across security, cost, and reliability.
### Day 1
- **Learn:** security review patterns
- **Build:** IAM tightening + threat modeling notes
- **Verify:** least-privilege audits
### Day 2
- **Learn:** cost + reliability reviews
- **Build:** cost guardrails + reliability improvements
- **Verify:** load/limit tests
### Day 3 (Docs + LinkedIn)
- **Build:** hardening recap + weekly post
- **Evidence:** updated ADRs/notes

---

# PHASE 9 — GENAI (Weeks 21–24)
---

## WEEK 21 — Bedrock summaries (athlete reports)
**Goal:** generate coach-friendly summaries with safety constraints.
### Day 1
- **Learn:** prompt patterns + grounding
- **Build:** summary generator MVP
- **Verify:** deterministic formatting + safe outputs
### Day 2
- **Learn:** evaluation of summaries
- **Build:** rubric + evaluation harness
- **Verify:** quality thresholds
### Day 3 (Docs + LinkedIn)
- **Build:** summary note + weekly post
- **Evidence:** examples (sanitized)

## WEEK 22 — RAG foundation (coach knowledge base)
**Goal:** retrieval-augmented coaching assistant grounded in tenant-safe data.
### Day 1
- **Learn:** RAG architecture + indexing
- **Build:** ingestion + indexing pipeline
- **Verify:** tenant partitioning in retrieval
### Day 2
- **Learn:** retrieval evaluation
- **Build:** retrieval quality metrics + tests
- **Verify:** no cross-tenant retrieval
### Day 3 (Docs + LinkedIn)
- **Build:** RAG architecture note + weekly post
- **Evidence:** evaluation summary

## WEEK 23 — Safety + evaluation harness
**Goal:** prove safety, reliability, and usefulness of GenAI features.
### Day 1
- **Learn:** safety patterns (PII, jailbreaks)
- **Build:** safety filters + red-teaming prompts
- **Verify:** failures blocked
### Day 2
- **Learn:** evaluation harness design
- **Build:** automated eval suite
- **Verify:** regression detection
### Day 3 (Docs + LinkedIn)
- **Build:** safety report + weekly post
- **Evidence:** mitigations documented

## WEEK 24 — Integrate GenAI into portal + platform
**Goal:** ship an end-to-end GenAI feature in the SIC product experience.
### Day 1
- **Learn:** product integration patterns
- **Build:** portal integration of summaries/RAG
- **Verify:** tenant-safe auth context used
### Day 2
- **Learn:** performance + cost controls
- **Build:** caching + rate limits + budget alarms
- **Verify:** cost per request measured
### Day 3 (Docs + LinkedIn)
- **Build:** integration recap + weekly post
- **Evidence:** demo narrative

---

# PHASE 10 — INGESTION + CAPSTONE (Weeks 25–26)
---

## WEEK 25 — Ruta Viva ingestion + storage
**Goal:** ingest external event data safely into SIC.
### Day 1
- **Learn:** ingestion patterns + validation
- **Build:** ingest pipeline + schema validation
- **Verify:** bad data rejected
### Day 2
- **Learn:** storage + partitioning
- **Build:** tenant-safe storage layout + indexes
- **Verify:** queryability + cost notes
### Day 3 (Docs + LinkedIn)
- **Build:** ingestion runbook + weekly post
- **Evidence:** sample dataset walkthrough

## WEEK 26 — Unified SIC experience + career package
**Goal:** unify platform story, polish demo, and prepare career-ready portfolio.
### Day 1
- **Learn:** platform narrative + architectural clarity
- **Build:** unify tenancy patterns + cross-service observability
- **Verify:** end-to-end traceability
### Day 2
- **Learn:** communicating tradeoffs
- **Build:** demo script + walkthrough architecture doc + interview stories
- **Verify:** rehearsal checklist
### Day 3 (Docs + LinkedIn)
- **Build:** final recap + portfolio index + weekly post
- **Evidence:** “career package” checklist

---

## Continuous engineering standards (always-on)
Every week, maintain:
- **Tenant isolation:** enforced in auth → API → data
- **Least privilege IAM:** no wildcards; scoped resources
- **Observability:** logs, metrics, alarms, dashboards maintained
- **Cost awareness:** note cost drivers and set guardrails
- **Documentation discipline:** architecture notes + learning logs
- **Technical communication:** diagrams and decision records kept current
