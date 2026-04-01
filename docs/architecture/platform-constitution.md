# Sports Intelligence Cloud — Platform Constitution

This document is the highest-level architecture and product alignment summary for Sports Intelligence Cloud (SIC).

It defines what SIC is today, what it is becoming, and which platform rules govern its growth.

For detailed engineering rules, see:
- `docs/architecture/SIC architecture principles.md`
- `docs/architecture/tenant-claim-contract.md`

---

## 1. What SIC Is

Sports Intelligence Cloud (SIC) is a multi-tenant, serverless sports platform on AWS.

SIC begins with practical tools for coaches and is designed to evolve into a broader platform for teams, clubs, academies, and sports organizations.

SIC is intentionally being built as:

- product-first
- architecture-strong
- low-cost
- security-conscious
- AI/ML ready over time

---

## 2. Current Product Wedge

The current entry point into SIC is the **Session Builder**.

This first product helps coaches:

- turn real-world constraints into usable training sessions
- save and reuse sessions
- export session packs
- build lightweight team workflows over time

This wedge is intentionally narrow so SIC can deliver real value early while building the structured foundation for broader platform growth.

---

## 3. Product Evolution Path

SIC is currently expected to evolve in this order:

1. Session Builder
2. Coach Workspace
3. Team Layer
4. Club Layer
5. Sports Organization OS foundations
6. Intelligence features based on real workflows and real data

SIC should not try to build every future capability at once.

---

## 4. Current Strategic Position

SIC is being developed under a **job-first, product-first** strategy.

That means:

- the platform must stay low-cost and realistic for a solo builder
- architecture quality still matters
- product capabilities should ship in thin vertical slices
- AI/ML features should be introduced in stages
- large analytics or ML infrastructure should wait until it supports real product usage

---

## 5. Active Users Today

SIC currently prioritizes:

- individual coaches
- assistant coaches
- small academies
- clubs with multiple coaches

Future expansion may support:

- larger organizations
- schools
- NGOs
- structured development programs

Municipality and mobility use cases are not part of the active near-term product path.

---

## 6. Non-Negotiable Platform Rules

SIC is governed by these core principles:

- multi-tenant by design
- fail-closed tenant isolation
- tenant context derived only from verified auth
- product value before platform expansion
- serverless-first architecture
- infrastructure as code
- minimal but real observability
- security by default
- cost awareness before production
- AI and ML lifecycle discipline

The full detail lives in:
- `docs/architecture/SIC architecture principles.md`

---

## 7. Current AWS Service Set

The current active SIC architecture should stay centered on:

- Cognito
- API Gateway
- Lambda
- DynamoDB
- S3
- CloudWatch
- limited Bedrock usage when needed

This service set matches the current product and cost strategy.

SIC should avoid making the following core dependencies too early:

- Glue-heavy analytics flows
- Athena as a default product dependency
- QuickSight dashboards as a near-term requirement
- SageMaker pipelines before product usage justifies them
- broad RAG infrastructure before there is a real knowledge need

---

## 8. Current Multi-Tenant Contract

SIC must enforce tenant boundaries through verified server-side context.

Core rules:

- tenant identity is never accepted from client input
- tenant context must be derived from verified auth and authoritative entitlements
- all data access must be tenant-scoped by construction
- tiering changes capability, not isolation

For the detailed contract, see:
- `docs/architecture/tenant-claim-contract.md`

---

## 9. Current Cost Discipline

SIC should remain cost-aware at all times.

The current build stage should favor:

- low operational overhead
- low monthly spend
- services with predictable cost profiles
- product capabilities that justify infrastructure growth

The goal is to stay realistic for an independent builder while keeping the platform credible and extensible.

---

## 10. Current Repo Priorities

The repo should currently reflect these active priorities:

- Session Builder implementation
- coach and team product workflows
- multi-tenant platform safety
- observability and reliability
- roadmap execution through `roadmap-vnext.md`
- documentation that clearly explains the platform

Long-term ideas should be preserved, but separated from the active execution path.

---

## 11. Source of Truth Order

When there is ambiguity, use this order:

1. `docs/architecture/SIC architecture principles.md`
2. `docs/architecture/platform-constitution.md`
3. `docs/vision.md`
4. `docs/architecture/tenant-claim-contract.md`
5. `docs/product/SIC-session-builder.md`
6. `docs/progress/Build-Progress/roadmap-vnext.md`

---

## 12. What SIC Must Avoid Right Now

At the current stage, SIC should avoid:

- building full platform depth before real product usage
- over-investing in analytics before usage data exists
- introducing heavy ML infrastructure too early
- mixing future expansion ideas with the active product path
- sacrificing tenancy, security, or clarity for speed

---

## 13. Summary

SIC is a multi-tenant, serverless sports platform that begins with coach workflow tools and grows toward a broader sports organization platform.

Its growth must remain:

- secure
- deliberate
- cost-aware
- product-led
- architecture-disciplined

The purpose of this constitution is to keep the platform aligned as SIC evolves.
