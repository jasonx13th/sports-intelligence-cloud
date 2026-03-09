# Week 2 — Day 1: Least Privilege IAM + Tenant Claim Contract + Alarms

## What we built (artifacts)
- Tenant Claim Contract: `docs/architecture/tenant-claim-contract.md`
- Tenant claim enforcement guard: `services/club-vivo/api/me/handler.js`
- Observability: HTTP API access logs + alarms in `infra/cdk/lib/sic-api-stack.ts`
- Least privilege IAM: scoped `cognito-idp:AdminAddUserToGroup` to user pool ARN in `infra/cdk/lib/sic-auth-stack.ts`
- Runbook: `docs/runbooks/auth-api-alarms.md`

## Key decisions (and why)
- Tenant claims are trusted only from verified JWT + enforced at Lambda middleware (defense-in-depth)
- 401 vs 403 policy:
  - 401 = missing/invalid auth context
  - 403 = authenticated but missing/invalid tenant claim contract
- Alarms are IaC-managed (no console drift)

## What I learned / what broke
- IAM evaluation: explicit Deny beats Allow; implicit deny by default
- Biggest “gotcha” today: [fill in — e.g., CDK scope issues / gitignore artifacts / authorizer claim shape]

## Follow-ups
- Runtime lifecycle: plan upgrade from Node.js 20.x before AWS Lambda deprecates it (target: move to Node.js 22.x)
- Replace hardcoded userPoolId/userPoolClientId in `bin/sic-auth.ts` with stack outputs or SSM parameters
- Add metric filter alarms for `TENANT_CLAIM_*` codes (optional improvement)

## Certification mapping (what today covered)
**DVA-C02**
- Security: IAM least privilege; scoped resource ARNs; authN/authZ boundary (authorizer vs execution role)
- Monitoring/Troubleshooting: CloudWatch alarms, API 4XX vs 5XX fault isolation

**MLA-C01**
- Monitoring & security foundation for ML workloads: IAM + alarms discipline carries directly into SageMaker roles/endpoints later

**AIF-C01**
- Governance/security: access control, tenant isolation contract, audit-ready operational posture