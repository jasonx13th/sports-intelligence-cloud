# Sports Intelligence Cloud – Architecture Principles

This document defines the **non-negotiable engineering principles** for the Sports Intelligence Cloud (SIC) platform.

These principles govern all current SIC platform modules and future expansions.

If a decision violates these principles, it must be re-evaluated. Any exception requires an ADR.

---

## 1. Multi-Tenant First (Fail Closed)

- **Every authenticated request must resolve a tenant context** from a trusted path.
- **Tenant identity is never accepted from client input**.
  - No `tenant_id` or `tenantId` from body, query, or headers
  - No trust in headers such as `x-tenant-id`
- Tenant isolation must be enforced at:
  - API layer
  - Application logic layer
  - Data access layer
  - Storage prefix level (S3)
- Tiering never changes data boundaries. Tier affects **capabilities**, not tenant isolation.
- Isolation must be deterministic, testable, and reviewed.
- No “filter after read” patterns for tenant isolation.

**Current SIC contract alignment**
- Verified identity comes from **JWT claims**.
- Authoritative `{ tenant_id, role, tier }` comes from the **entitlements store** keyed by authenticated user identity.
- Missing or invalid claims or entitlements must **deny access** rather than guess.

---

## 2. Product Value Before Platform Expansion

- SIC grows through **thin vertical slices** that deliver usable product value.
- Product capabilities come before broad platform expansion unless security, tenancy, or operability requires otherwise.
- New infrastructure should be introduced only when it:
  - unlocks a real product capability
  - improves operational safety
  - supports a proven next step in the roadmap
- Avoid building infrastructure with no immediate user or operator value.
- Prefer shipping something coaches or organizations can use over expanding platform depth too early.

---

## 3. Serverless-First Philosophy

- Prefer managed AWS services over self-managed infrastructure.
- Use Lambda, API Gateway, DynamoDB, S3, Cognito, CloudWatch, EventBridge, Step Functions, Glue/Athena, and Bedrock before EC2.
- Introduce containers only with explicit justification and an ADR.
- Avoid premature complexity.
- Optimize for iteration speed, operability, and low-cost delivery.

---

## 4. Infrastructure as Code Is Mandatory

- All infrastructure must be provisioned via CDK or equivalent IaC.
- No manual console configuration for production resources.
- Environments must be repeatable, isolated, and documented.
- Infrastructure changes require evidence:
  - `cdk synth`
  - `cdk diff` reviewed before deploy

---

## 5. Observability Is Not Optional

- If you cannot observe it, you cannot operate it.
- Every production component must emit:
  - Logs
  - Metrics
  - Alarms
- Logs must be structured and searchable.
- Correlation identifiers must flow through the request path.
- Dashboards and basic runbooks are part of done.
- Observability should be **minimal but real**, not performative.

---

## 6. AI and ML Lifecycle Discipline

- AI and ML features must be treated as operational systems, not just experiments.

### AI-assisted product features
Managed foundation model features are allowed before full custom ML systems, provided they include:
- clear service boundaries
- deterministic validation where applicable
- cost guardrails
- logging and failure handling
- safe and reviewable output patterns

### Custom ML systems
Any custom model that is trained and operated by SIC must include:
- versioned dataset assumptions
- reproducible training pipeline
- evaluation metrics and baseline comparison
- deployment strategy and rollback strategy
- monitoring for quality, drift, latency, and cost
- retraining trigger policy

- If a custom model cannot be operated safely, it does not ship.

---

## 7. Security by Default

- Default posture is deny-by-default and least privilege.
- Encryption is standard:
  - at rest where applicable
  - in transit everywhere
- Secrets never live in code or plaintext config.
- No wildcard IAM in application roles.
  - Exception only with explicit justification, ADR, and compensating controls
- Threat modeling is expected for new external endpoints and sensitive data flows.
- Authentication and authorization paths must fail closed.

---

## 8. Cost Awareness Before Production

- Cost is a first-class design constraint.
- Any new service addition must include:
  - expected cost drivers
  - scaling risk
  - guardrails such as budgets, alarms, quotas, or usage limits
- Optimize for sustainable scale, not theoretical maximums.
- Favor low-cost services and low-operational-overhead choices in the current SIC stage.

---

## 9. Failure-Mode Thinking

- Assume components fail. Design for graceful degradation.
- Identify failure modes for:
  - external integrations
  - exports
  - data pipelines
  - AI/ML inference
  - auth and identity paths
  - entitlements provisioning
- Use timeouts, retries with backoff, idempotency, and dead-letter patterns where appropriate.
- Incidents should produce a postmortem note and a prevention backlog item.

---

## 10. CI/CD Discipline

- Every meaningful change goes through CI checks.
- Deployments must be automated and repeatable.
- Infrastructure and application code should ship together intentionally.
- Rollback strategy must exist for each meaningful production deployment path.

---

## 11. Documentation and Decision Records

- If it is not documented, it does not exist.
- Architectural decisions require ADRs.
- APIs require an explicit contract, including error semantics where relevant.

**Weekly evidence remains mandatory**
- 1 architecture note or equivalent doc update
- 1 ADR if an architectural decision changed
- 1 learning log
- 1 progress summary or public build summary

---

## 12. Product Tiers, Entitlements, and Usage Metering

SIC is a product platform with multiple customer types.

- SIC must support tiered access.
- Tiers must be enforced through **server-side entitlements**.
- Front-end hiding is not authorization.
- Tiering must never weaken tenant isolation.
- Premium or advanced capabilities should be designed with:
  - usage metering where appropriate
  - quotas or limits
  - cost control in mind

**Current SIC contract alignment**
- Entitlements are authoritative for tenant scope and capabilities.
- Tokens authenticate identity.
- Entitlements authorize tenant context and feature access.

---

## 13. Tooling Discipline and Repo Guardrails

- Repo-level guardrails must be committed and kept current:
  - `.github/copilot-instructions.md`
  - `.github/hooks/*.json`
  - `docs/runbooks/*`
- AI coding tools may accelerate implementation, but:
  - tenancy boundary changes require explicit human review
  - infra, IAM, and CDK changes require explicit approval
  - evidence is required for completion

---

## 14. Engineering Growth Standard

The builder should continue growing across:
- system design depth
- security awareness
- observability maturity
- cost modeling discipline
- product judgment
- AI and ML rigor over time
- clear technical communication

SIC should become more disciplined as it grows, not more chaotic.
