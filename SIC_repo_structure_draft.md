# Sports Intelligence Cloud — Repo Structure (Recommended Final)

Goal: one platform with shared infrastructure + reusable modules, while each capstone can be demoed independently.

This repo is a monorepo with:
- **apps/** = capstone-facing entry points (demoable independently)
- **infra/cdk/** = shared platform infrastructure (auth + API + shared stores)
- **services/** = serverless backend code (Lambdas + shared libs)
- **docs/** = system of record (architecture, runbooks, progress logs)
- **.github/** = Copilot Chat guardrails + CI hooks/workflows

---

## Current canonical tree (keep this stable)

```text
sports-intelligence-cloud/
├─ README.md
├─ SIC_repo_structure_draft.md
├─ .a_PROGRESS/
│  ├─ week 0/
│  ├─ week 1/
│  ├─ week 2/
│  └─ week 3/
├─ .github/
│  ├─ copilot-instructions.md          # VS Code Copilot Chat repo guardrails (must keep)
│  ├─ hooks/
│  │  └─ sic-hooks.json                # VS Code Copilot Chat hooks (must keep)
│  └─ workflows/                       # CI (add as you wire pipelines)
├─ apps/
│  ├─ club-vivo/
│  ├─ athlete-evolution-ai/
│  └─ ruta-viva/
├─ docs/
│  ├─ vision.md
│  ├─ architecture/
│  │  ├─ SIC architecture principles.md
│  │  ├─ SIC Architecture Diagrams.md
│  │  └─ tenant-claim-contract.md
│  ├─ runbooks/
│  │  ├─ tenant-entitlements-onboarding.md
│  │  └─ auth-api-alarms.md
│  └─ adr/                             # create when first ADR is needed
├─ infra/
│  └─ cdk/
│     ├─ bin/
│     ├─ lib/
│     ├─ cdk.json
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ README.md
└─ services/
   ├─ auth/
   │  ├─ post-confirmation/
   │  └─ pre-token-generation/
   └─ club-vivo/
      └─ api/
         ├─ _lib/
         ├─ me/
         └─ test-tenant/
```
---

## Structure discipline (non-negotiables)

1) **No new top-level folders** without an ADR.
2) **Capstone code** goes under:
   - `apps/<capstone>/` (UI/demo entry point)
   - `services/<capstone>/` (backend + shared libs for that capstone)
3) **Platform infra** stays under:
   - `infra/cdk/` (CDK only)
4) **System-of-record docs** stay under:
   - `docs/architecture/` (principles/contracts)
   - `docs/runbooks/` (operations/how-to)
   - `docs/adr/` (decision records)
   - `.a_PROGRESS/` (weekly build logs)

---

## Notes

- `.github/copilot-instructions.md` and `.github/hooks/*.json` are **for VS Code GitHub Copilot Chat** (repo-scoped guardrails + reminders).
- `docs/agents/` Treat it as documentation/templates only (not required for runtime).
