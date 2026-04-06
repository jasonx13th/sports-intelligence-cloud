# Sports Intelligence Cloud

Sports Intelligence Cloud (SIC) is a multi-tenant, serverless sports platform on AWS.

SIC starts with **coach workflow tools** that help coaches create and run training sessions under real-world constraints. Over time, it is designed to evolve into a **Sports Organization OS** for clubs, academies, and sports programs.

This repository is both:

- a real product build in progress
- a cloud and AI engineering portfolio project

---

## Current Product Focus

SIC is currently focused on the **Session Builder** as its first product wedge.

The goal is to help coaches:

- generate training sessions from real constraints
- save and reuse sessions
- export session packs
- organize work by team over time
- provide lightweight feedback signals for future intelligence features

Current expansion path:

1. Coach Session Builder
2. Coach Workspace
3. Team Layer
4. Club Layer
5. Sports Organization OS foundations
6. Intelligence features built on real usage data

---

## Why SIC Exists

Coaches and sports organizations often work with fragmented tools, scattered notes, spreadsheets, chats, and inconsistent workflows.

SIC aims to solve this by creating a platform where:

- coaches can plan and run training more easily
- clubs can retain institutional knowledge over time
- organizations can own their data instead of losing it when staff changes
- future AI and ML features can be built on structured, trustworthy workflows

---

## Architecture Direction

SIC is being built with the following non-negotiable platform principles:

- multi-tenant by design
- fail-closed tenant isolation
- tenant context derived only from verified auth
- serverless-first architecture
- minimal but real observability
- cost-aware service selection
- product value before platform expansion

The active near-term AWS service set is intentionally small:

- Cognito
- API Gateway
- Lambda
- DynamoDB
- S3
- CloudWatch
- optional limited Bedrock usage

This keeps SIC low-cost, operationally simple, and realistic for a solo builder.

---

## Repo Highlights

This repository demonstrates:

- multi-tenant SaaS design
- fail-closed authorization patterns
- tenant-safe DynamoDB access patterns
- structured logging and observability
- export workflows
- product-first architecture sequencing
- AI-assisted feature design with validation guardrails

---

## Repo Map

Key repo areas:

- `apps/club-vivo/` -> active coach-facing web app
- `services/club-vivo/api/` -> primary backend API
- `services/auth/` -> auth-related lambdas
- `infra/cdk/` -> infrastructure as code
- `docs/` -> tracked architecture, product, API, runbook, and progress docs
- `datasets/schemas/exports/v1/` -> machine-readable export schemas
- `postman/README.md` -> Postman workflow and usage guidance
- `.workspace/` -> local-only helper material, not tracked repo truth

---

## Current Documentation

Start here:

- Vision: [`docs/vision.md`](docs/vision.md)
- Architecture principles: [`docs/architecture/architecture-principles.md`](docs/architecture/architecture-principles.md)
- Platform constitution: [`docs/architecture/platform-constitution.md`](docs/architecture/platform-constitution.md)
- Tenant claim contract: [`docs/architecture/tenant-claim-contract.md`](docs/architecture/tenant-claim-contract.md)
- Repo structure: [`docs/architecture/repo-structure.md`](docs/architecture/repo-structure.md)
- Architecture diagrams: [`docs/architecture/architecture-diagrams.md`](docs/architecture/architecture-diagrams.md)
- Product spec: [`docs/product/sic-coach-lite/sic-session-builder.md`](docs/product/sic-coach-lite/sic-session-builder.md)
- Active roadmap: [`docs/progress/build-progress/roadmap-vnext.md`](docs/progress/build-progress/roadmap-vnext.md)

---

## Public Repo Safety Note

This repository is sanitized for public sharing.

- No secrets or credentials are stored in the repo
- No real customer data is included
- Infrastructure-specific identifiers are redacted
- Documentation examples use placeholders where needed

---

## Strategic Positioning

SIC is not being built as a full-scale startup all at once.

The current strategy is:

- job-first
- product-first
- low-cost
- architecture-strong
- AI/ML ready over time

That means the platform is intentionally evolving through thin, usable vertical slices instead of building full analytics, MLOps, or organization-wide infrastructure too early.

---

## Long-Term Direction

Long term, SIC is intended to evolve from coach tools into a broader platform for:

- teams
- clubs
- academies
- sports organizations

AI and ML remain important to SIC, but they are introduced in stages, grounded in real workflows and real data rather than premature infrastructure.

---

## Portfolio Context

SIC is also part of a long-term AWS and AI engineering journey.

It is being used to deepen practical skills across:

- AWS Developer
- AI Practitioner
- AI / ML Engineering
- platform design
- secure multi-tenant architecture
- observability and cost discipline
