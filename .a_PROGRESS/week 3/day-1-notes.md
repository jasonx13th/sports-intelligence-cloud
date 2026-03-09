# SIC Progress Note — Tenant Entitlements Onboarding + VS Code Guardrails

## What we did (tight summary)

### 1) VS Code guardrails
- Set up `.github/copilot-instructions.md`
- Set up `.github/hooks/sic-hooks.json`
- Verified hooks fire in Copilot output

### 2) Closed the missing onboarding link
- The API required an entitlements row (keyed by `claims.sub`) but nothing created it.
- Updated `SicAuthStack` to:
  - import `TenantEntitlementsTableName-<env>`
  - set `TENANT_ENTITLEMENTS_TABLE` env var on the PostConfirmation Lambda
  - grant DynamoDB write permissions

### 3) Implemented entitlements provisioning
- PostConfirmation Lambda now:
  - adds user to `cv-athlete`
  - writes entitlements row `{ user_sub, tenant_id, role, tier }`
  - fail-soft for `UserNotFoundException` in console tests

### 4) Validated
- `cdk synth` ✅
- `cdk diff` ✅ (only Auth stack changed)
- `cdk deploy SicAuthStack-Dev` ✅
- DynamoDB row created ✅
- `/me` returns tenant context ✅

---

## What we still need to do (next hardening)

### 1) Make entitlements creation automatic for real signups
- Today we had to backfill via Lambda test because the user was already confirmed and didn’t have `custom:tenant_id` at creation.
- Next: decide the true source of `tenant_id` at signup:
  - admin-created users?
  - invitation flow?
  - tenant registry?

### 2) Security tightening
- Replace `resources: ["*"]` for `cognito-idp:AdminAddUserToGroup` with the specific UserPool ARN.
- Add conditional IAM where possible.

### 3) Operational discipline
- Add a CloudWatch alarm for PostConfirmation errors (like we did for API lambdas).
- Add a runbook entry:
  - “If `/me` returns `missing_entitlements`, check DynamoDB row keyed by `sub`.”