# Sports Intelligence Cloud — Repo Structure (Current + Near-Term)

Goal: one platform with shared infrastructure + reusable modules, but each capstone can be demoed independently.

This repo is a monorepo with:
- **apps/** = capstone-facing entry points (demoable independently)
- **infra/cdk/** = shared platform infrastructure (auth + API + storage)
- **services/** = serverless backend code (Lambdas + shared libs)
- **docs/** = system of record (architecture, runbooks, progress logs)
- **.github/** = Copilot Chat guardrails + CI hooks/workflows

---

## Current tree (as implemented)

sports-intelligence-cloud/
├─ README.md
├─ SIC_repo_structure_draft.md
├─ .a_PROGRESS/
│  ├─ week 0/
│  ├─ week 1/
│  ├─ week 2/
│  └─ week 3/
├─ .github/
│  ├─ hooks/
│  │  └─ sic-hooks.json                  # Copilot Chat hooks
│  └─ copilot-instructions.md            # Copilot Chat repo guardrails
├─ apps/
│  ├─ athlete-evolution-ai/
│  ├─ club-vivo/
│  └─ ruta-viva/
├─ docs/
│  ├─ vision.md
│  ├─ agents/
│  │  └─ sic-build.agent.md              # optional (VS Code agent template)
│  ├─ architecture/
│  │  ├─ SIC Architecture Diagrams.md
│  │  ├─ SIC architecture principles.md
│  │  └─ tenant-claim-contract.md
│  ├─ runbooks/
│  │  ├─ auth-api-alarms.md
│  │  └─ tenant-entitlements-onboarding.md
│  └─ errors/                            # error notes / troubleshooting
├─ infra/
│  └─ cdk/
│     ├─ bin/
│     │  └─ sic-auth.ts
│     ├─ lib/
│     │  ├─ sic-api-stack.ts
│     │  └─ sic-auth-stack.ts
│     ├─ cdk.json
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ README.md
└─ services/
   ├─ auth/
   │  ├─ post-confirmation/
   │  │  ├─ handler.js
   │  │  ├─ package.json
   │  │  └─ package-lock.json
   │  └─ pre-token-generation/
   │     └─ handler.js
   └─ club-vivo/
      └─ api/
         ├─ _lib/
         │  ├─ parse-body.js
         │  ├─ tenant-context.js
         │  └─ validate.js
         ├─ me/
         │  └─ handler.js
         └─ test-tenant/
            └─ handler.js

---

## Repo rules (structure discipline)

1) **No new top-level folders** without an ADR.
2) New backend features should go in:
   - `services/<capstone>/api/...` (for API/Lambda handlers)
3) Shared platform infrastructure stays in:
   - `infra/cdk/` (CDK only)
4) Documentation stays in:
   - `docs/architecture/` (contracts + principles)
   - `docs/runbooks/` (ops procedures)
   - `.a_PROGRESS/` (weekly build logs)

---

## Near-term planned additions (when needed)

- docs/adr/                           # formal ADRs once we start making bigger decisions
- tests/                              # unit/integration tests as we add more handlers
- services/<capstone>/data/           # ingestion + ETL (Glue/Lambda) when we start pipelines
- services/<capstone>/ml/             # training/inference pipeline code when models go live