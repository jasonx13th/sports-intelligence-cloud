# Sports Intelligence Cloud — Repo Structure Draft

Goal: keep SIC organized as one platform with a clear near-term product focus, while preserving room for future expansion.

SIC is currently organized around a **product-first, low-cost, multi-tenant platform strategy**.

The active product path is:

1. Session Builder
2. Coach Workspace
3. Team Layer
4. Club Layer
5. Sports Organization OS foundations
6. Intelligence features later, based on real workflows and real data

---

## Recommended Repo Structure

```text
sports-intelligence-cloud/
├─ README.md
├─ apps/
│  └─ web/                          # Frontend app (coach-facing web experience)
├─ infra/
│  └─ cdk/                          # Infrastructure as code
├─ services/
│  └─ club-vivo/
│     └─ api/                       # Core backend APIs
├─ scripts/                         # Local scripts, seeding, helpers
├─ datasets/                        # Synthetic or schema-driven example data
├─ docs/
│  ├─ vision.md
│  ├─ architecture/
│  │  ├─ SIC architecture principles.md
│  │  ├─ SIC Architecture Diagrams.md
│  │  ├─ tenant-claim-contract.md
│  │  ├─ platform-constitution.md
│  │  ├─ platform-observability.md
│  │  ├─ session-builder-v1.md
│  │  ├─ team-layer-v1.md
│  │  └─ ai-generation-v1.md
│  ├─ product/
│  │  └─ SIC-session-builder.md
│  ├─ progress/
│  │  └─ Build-Progress/
│  │     ├─ roadmap-vnext.md
│  │     └─ architect_process_log.md
│  ├─ adr/
│  │  ├─ ADR-0001-multi-tenant-dynamodb-single-table-model.md
│  │  ├─ ADR-0002-jwt-tenant-identity-propagation.md
│  │  ├─ ADR-0003-fail-closed-authorization-model.md
│  │  ├─ ADR-0004-idempotent-athlete-creation.md
│  │  ├─ ADR-0005-entitlements-provisioning-postconfirmation-lambda.md
│  │  ├─ ADR-0006-repository-boundary-tenant-safe-data-access.md
│  │  ├─ ADR-0007-authoritative-tenant-context-via-entitlements.md
│  │  └─ ADR-0008-coach-basic-to-org-premium-upgrade-and-activation.md
│  ├─ runbooks/
│  ├─ study/
│  │  ├─ DVA-C02_objectives_cheatsheet.md
│  │  ├─ AIF-C01_objectives_cheatsheet.md
│  │  └─ MLA-C01_objectives_cheatsheet.md
│  ├─ future/
│  │  └─ SIC-long-term-platform-expansions.md
│  └─ archive/
│     └─ historical-notes.md
├─ .github/
│  ├─ workflows/
│  ├─ hooks/
│  └─ copilot-instructions.md
└─ CHAT/
   └─ CODEX.private.md              # Local only, if present
