# Week 1 – Day 3: Onboarding Strategy + Tenant-Enforced API (Security Close-Out)

## Session Objective

Close Week 1 by aligning:

- Product onboarding strategy
- Multi-tenant security model
- Cognito + JWT architecture
- API Gateway + Lambda enforcement
- Infrastructure issues and fixes
- Clear Week 2 roadmap

This document serves as a structured technical review.

---

# 1) Product Strategy: Two Onboarding Modes, One Tenancy Model (Planned)

SIC must support product-led growth without compromising security.

To drive adoption:
- Coaches must try the platform easily.
- Coaches become word-of-mouth distribution into clubs and municipalities.
- Tenant isolation must exist from day one.

**Decision:**
Two onboarding modes (**planned**).  
One strict multi-tenant architecture (**implemented foundation in Week 1**).

> Note: Week 1 implemented the security foundation (Cognito + JWT + tenant claim + protected API).  
> The onboarding flows (self sign-up, org onboarding, tenant types) are designed but not fully built yet.

---

## Mode A — Intro / Solo Coach (Planned Self-Sign-Up)

- Entry: self-sign-up (**not enabled in Week 1**; `selfSignUpEnabled: false`)
- Tenant type: `solo-coach` (**planned**)
- Planned default role: `cv-admin` (owner of their workspace) (**planned**)

### Planned Security Constraints
- Can only create a solo tenant
- Cannot create org tenants
- Cannot self-escalate privileges
- Feature limits can apply (quotas, tiers, etc.)

---

## Mode B — Org / Full Service (Planned)

- Entry: invite/admin onboarding (**planned**)
- Tenant type: `org` (**planned**)
- Roles assigned by: tenant admin or platform admin (**planned, auditable**)

### Planned Security Constraints
- No self-assigned privileged roles
- Role assignment controlled and auditable
- Governance for clubs/municipalities

---

# 2) Core Multi-Tenant Security Model

Every entity has a unique:

```
tenant_id
```

Tenant enforcement happens in four layers:

---

## 1️⃣ Identity Layer (Cognito / JWT)

- `custom:tenant_id` stored on user
- Injected into JWT as `tenant_id` (via **Pre Token Generation trigger**)
- Backend trusts only validated JWT claims

---

## 2️⃣ API Layer (API Gateway Authorizer)

- JWT authorizer validates:
  - Issuer
  - Audience (client id)
  - Signature
- Requests without valid tokens → 401 before Lambda runs

---

## 3️⃣ Application Layer (Lambda)

Lambda must:

- Extract `tenant_id` from JWT claims
- Never trust tenant passed in body/query
- Reject missing or invalid claims (future hardening; `/me` returns `tenantId` and would be the place to enforce required claims)

⚠️ Most dangerous layer to forget:
Application logic errors can cause cross-tenant leakage.

---

## 4️⃣ Data Layer (Partitioning) (Planned pattern)

DynamoDB:
```
PK = TENANT#<tenant_id>
```

S3:
```
<tenant_id>/...
```

---

# 3) Infrastructure Built This Week

## SicAuthStack-Dev

Owns:
- Cognito User Pool
- App client
- Hosted UI domain
- Groups:
  - `cv-admin`
  - `cv-coach`
  - `cv-medical`
  - `cv-athlete`
- PostConfirmation trigger (group assignment logic still being tuned)
- Pre Token Generation trigger (injects `tenant_id` into JWT)

---

## SicApiStack-Dev

Owns:
- API Gateway V2 (HTTP API)
- JWT Authorizer (Cognito)
- `GET /me` Lambda endpoint
- Output:
  - `ClubVivoApiUrl = https://<api-id>.execute-api.<region>.amazonaws.com/`

Authorizer config:
- Issuer:
  ```
  https://cognito-idp.<region>.amazonaws.com/<userPoolId>
  ```
- Audience:
  ```
  user pool app client id
  ```

---

# 4) Implemented Tenant-Enforced `/me` Endpoint

Lambda behavior:

- Reads JWT claims from request context:
  - `tenant_id`
  - `cognito:groups`
  - `sub`

Returns proof of identity:

```json
{
  "ok": true,
  "tenantId": "...",
  "groups": ["..."],
  "sub": "..."
}
```

---

# 5) Security Validations Performed

## ✅ Verified API is Protected

Request without token:

```bash
curl -i https://<api-id>.execute-api.us-east-1.amazonaws.com/me
```

Observed:

```
HTTP/1.1 401 Unauthorized
```

Confirms:
- Authorizer is active
- Lambda is not public

---

## ✅ OAuth Flow Fixes

Issues encountered:

- Wrong client id → `client does not exist`
- Used `response_type=token` but client configured for Authorization Code Grant

Correct flow:

```
response_type=code
```

---

## ✅ Fixed Authorizer Audience Mismatch

Error:
```
invalid_token / token does not have a valid audience
```

Cause:
- API authorizer audience did not match Cognito app client id

Fix:
- Updated `SicApiStack` to use the correct client id
- Redeployed

---

## ✅ Injected `tenant_id` into JWT (Production-Grade Fix)

Problem:
- `custom:tenant_id` existed in user attributes
- Not present in:
  - `id_token`
  - `access_token`
  - `https://.../oauth2/userInfo`

Lesson:
User attributes ≠ token claims.

---

### Correct Solution: Pre Token Generation Trigger

Attached:
```
UserPoolOperation.PRE_TOKEN_GENERATION
```

Behavior:
- Reads `custom:tenant_id`
- Injects claim:
  ```
  tenant_id: "<value>"
  ```

After redeploy:
Decoded JWT includes:

```
"tenant_id": "club-vivo-1234"
```

---

## ✅ End-to-End Proof

Calling `/me` with valid `id_token`:

Observed:

```
HTTP/1.1 200 OK
```

Response contains:

- `tenantId`
- `groups`

Full chain verified:

Cognito Login  
→ JWT  
→ API Gateway Authorizer  
→ Lambda  
→ Tenant-aware response  

---

# 6) Infrastructure Issues Encountered (And Fixes)

## A) CDK Bootstrap Missing

Error:
```
/cdk-bootstrap/hnb659fds/version not found
```

Fix:

```bash
npx cdk bootstrap aws://333053098932/us-east-1
```

---

## B) CloudFormation Circular Dependency

Problem:
- Cognito User Pool needed Lambda trigger
- Lambda IAM policy referenced User Pool ARN (caused circular dependency)

Temporary MVP fix:

```ts
resources: ['*']
```

Plan:
Refactor to least privilege without circular dependency.

---

## C) Node 18 Lambda Missing aws-sdk

Error:
```
Cannot find module 'aws-sdk'
```

Fix:
- Migrated to AWS SDK v3
- Packaged:
  ```
  @aws-sdk/client-cognito-identity-provider
  ```
- Redeployed successfully

---

# 7) Current Week 1 Status

- ✅ SicAuthStack-Dev deployed
- ✅ SicApiStack-Dev deployed
- ✅ Cognito + domain + client configured
- ✅ Groups created
- ✅ PostConfirmation trigger working (default group behavior still being tuned)
- ✅ Pre Token Generation trigger injecting tenant_id
- ✅ JWT authorizer active
- ✅ `/me` endpoint tenant-aware
- ✅ Verified 401 without token
- ✅ Verified 200 with valid token
- ✅ CloudWatch logs validated

---

# 8) Week 2 Roadmap

1. Remove temporary IAM `'*'` and implement least privilege.
2. Expand tenant-enforced endpoints beyond `/me` (start real CRUD patterns).
3. Implement real onboarding flows:
   - Solo-coach self-sign-up creates tenant + owner role (Mode A)
   - Org invite workflow assigns roles securely (Mode B)
4. Strengthen audit logging and monitoring.
5. Add data-layer enforcement (DynamoDB/S3 patterns) as we introduce persistence.

---

# Key Technical Lessons

- Tenant identity must be first-class in JWT.
- User attributes are not automatically token claims.
- Multi-tenant enforcement requires defense in depth.
- Authorization bugs are often configuration mismatches.
- Temporary security shortcuts must be documented and removed.

---

End of Week 1 Review.
