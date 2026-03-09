# SIC Copilot Workspace Instructions

## Must-read docs (before editing)
- docs/vision.md
- docs/architecture (start with the main README/entry doc inside)
- docs/agents/sic-build.agent.md (guardrails)

## Non-negotiables
- Tenant isolation must be enforced end-to-end (auth → API → data/storage).
- Never change IAM/CDK/infra without explicit confirmation from the user.
- Never add new top-level folders; follow repo structure.
- No IAM wildcards; least privilege only.
- No secrets in code.

## After changes (definition of done)
- Run unit tests + lint relevant to what changed.
- If infra touched: `cdk synth` and `cdk diff`.
- Update docs/learning log after meaningful changes.
- Propose an ADR when changing security boundaries, tenancy model, or data flows.