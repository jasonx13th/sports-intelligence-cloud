# Sports Intelligence Cloud – Architecture Principles (vNext, Updated)

This document defines the **non-negotiable engineering principles** for the Sports Intelligence Cloud (SIC) platform.

These principles are the constitutional rules for all capstones:
- Club Vivo
- Athlete Evolution AI
- Ruta Viva
- Expansion modules

If a decision violates these principles, it must be re-evaluated. Any exception requires an ADR.

---

## 1. Multi-Tenant First (Fail Closed)

- **Every authenticated request must resolve a tenant context** from a trusted path (authorizer → middleware → data).
- **Tenant identity is never accepted from client input** (no `tenant_id` from body/query/headers like `x-tenant-id`).
- Tenant isolation must be enforced at:
  - API layer (authorizer + middleware)
  - Application logic layer (handlers/services)
  - Data access layer (keys/queries scoped by tenant)
  - Storage prefix level (S3)
- Tiering never changes data boundaries: tier affects **capabilities**, not tenant isolation.
- Isolation must be deterministic, testable, and reviewed (no “filter after read”).

**Current SIC contract alignment (today):**
- Verified identity comes from **JWT claims** (required: `sub`).
- Authoritative `{ tenant_id, role, tier }` comes from **entitlements store** (DynamoDB) keyed by `user_sub = claims.sub`.
- Missing/invalid claims or entitlements must **deny access** (401/403) rather than guess.

---

## 2. Serverless-First Philosophy

- Prefer managed AWS services over self-managed infrastructure.
- Use Lambda, API Gateway, DynamoDB, S3, Step Functions, EventBridge, Glue/Athena, SageMaker/Bedrock before EC2.
- Introduce containers only with explicit justification and an ADR.
- Avoid premature complexity; optimize for operability and iteration speed.

---

## 3. Infrastructure as Code Is Mandatory

- All infrastructure must be provisioned via CDK (preferred) or equivalent IaC.
- No manual console configuration for production resources.
- Environments (dev/stage/prod) must be repeatable, isolated, and documented.
- Infra changes require evidence:
  - `cdk synth`
  - `cdk diff` reviewed before deploy

---

## 4. Observability Is Not Optional

- If you cannot observe it, you cannot operate it.
- Every production component must emit:
  - Logs (structured, searchable)
  - Metrics (latency, errors, throughput, throttles)
  - Alarms (actionable thresholds)
- Correlation identifiers must flow through the request path (e.g., requestId).
- Operational dashboards and basic runbooks are part of “done.”

---

## 5. ML Lifecycle Completeness

- ML is not “a notebook”; it is an operational system.
- Every model must have:
  - Versioned dataset assumptions
  - Reproducible training pipeline
  - Evaluation metrics and baseline comparison
  - Deployment strategy + rollback strategy
  - Monitoring (quality, drift, latency, cost)
  - Retraining trigger policy (time-based or performance-based)
- If we cannot retrain it safely, we do not ship it.

---

## 6. Security by Default

- Default posture is deny-by-default and least privilege.
- Encryption is standard:
  - At rest (KMS where applicable)
  - In transit (TLS everywhere)
- Secrets never live in code or plaintext config.
- No wildcard IAM (`Action:"*"` or `Resource:"*"`) in application roles.
  - Exception only with explicit justification + ADR + compensating controls.
- Threat modeling is expected for new external endpoints and sensitive data flows.
- Authentication/authorization paths must fail closed (never “best effort” auth).

---

## 7. Cost Awareness Before Production

- Cost is a first-class design constraint.
- Any new service addition must include:
  - Expected cost drivers
  - Scaling risk (what explodes first)
  - Guardrails (budgets/alarms/quotas)
- Optimize for sustainable scale, not theoretical maximums.

---

## 8. Failure-Mode Thinking

- Assume components fail. Design for graceful degradation.
- Identify failure modes for:
  - External integrations
  - Data pipelines
  - Model inference
  - Auth/identity paths (including entitlements provisioning)
- Use timeouts, retries with backoff, idempotency, and dead-letter patterns where appropriate.
- Incidents produce a postmortem note and a prevention backlog item.

---

## 9. CI/CD Discipline

- Every meaningful change goes through CI checks (lint/test/build).
- Deployments are automated and repeatable.
- Infrastructure and application code ship together intentionally (versioned releases).
- Rollback strategy must exist for each production deployment path.

---

## 10. Documentation and Decision Records

- If it is not documented, it does not exist.
- Architectural decisions require ADRs (why this choice, alternatives, tradeoffs).
- APIs require an explicit contract (OpenAPI or equivalent), including error semantics.

**Weekly evidence is mandatory:**
- 1 repo architecture note (docs)
- 1 ADR if any architectural decision changed
- 1 learning log (what changed, what broke, what we learned)
- 1 LinkedIn post summarizing the week’s build + lessons

---

## 11. Engineering Growth Standard

The student must evolve across months in:
- System design depth
- ML rigor
- Security awareness
- Observability maturity
- Cost modeling discipline
- Clear technical communication (diagrams + written decisions)

If growth plateaus, increase challenge.

---

## 12. Product Tiers, Entitlements, and Usage Metering

SIC is a product platform with multiple customer types.

- SIC must support tiered access:
  - **Free/Basic** Coach tier: limited features for participation and onboarding
  - **Premium/Org** tier (clubs/NGOs/sport orgs): full feature set + governance + analytics/ML
- Tiers must be enforced through **server-side entitlements**:
  - Claims/roles/permissions and feature flags — not “front-end hiding”
  - Server-side authorization is mandatory for every gated feature
- Premium features must be designed with:
  - Usage metering (events/records) for future billing and cost control
  - Quotas/limits to protect the platform (rate limits, storage caps, request caps)
- Tiering must never weaken tenant isolation: tier affects capability, not data boundaries.

**Current SIC contract alignment (today):**
- Entitlements are authoritative in DynamoDB (user_sub → tenant_id/role/tier).
- Tokens authenticate identity; entitlements authorize tenant scope and capabilities.

---

## 13. Tooling Discipline (VS Code Copilot Chat + Repo Guardrails)

- Repo-level guardrails must be committed and kept current:
  - `.github/copilot-instructions.md` (always-on Copilot Chat instructions)
  - `.github/hooks/*.json` (Copilot Chat hooks/reminders)
  - `docs/runbooks/*` (operational runbooks)
- Copilot may accelerate work, but:
  - infra/IAM/tenancy boundary changes require explicit human approval
  - evidence (tests/lint, `cdk synth/diff`) is required for completion