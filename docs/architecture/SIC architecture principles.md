# SIC Architecture Principles (Constitution)

## Non-negotiables
- Multi-tenant isolation end-to-end (auth → API → data/storage). Fail closed.
- Least-privilege IAM. No wildcards without explicit justification.
- Infrastructure as Code (CDK). Review via `cdk diff` before deploy.
- Observability is part of done (logs/metrics/alarms).
- Cost awareness: every major change notes cost drivers + scale risks.
- No secrets in code. Use managed secrets.

## Definition of Done
- Tests/lint pass for touched areas
- If infra touched: `cdk synth` + `cdk diff`
- Docs updated when meaningful
- ADR proposed when tenancy/security/data flows/IAM boundaries change