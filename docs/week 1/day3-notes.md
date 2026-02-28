# Week 1 – Day 3: Onboarding Strategy + Security Close-Out

## Session Objective
Finalize a secure onboarding model for SIC that still supports product-led growth:
- **Two onboarding modes**
  - **Solo-coach “intro”** (self-sign-up, low friction)
  - **Org “full service”** (invite/admin onboarding)
- Clarify how roles and tenancy stay secure in both modes
- Document the plan to remove temporary security shortcuts (IAM `*`, Node 18 runtime)

---

## 1) Product Context: why two onboarding modes

To grow adoption, SIC needs an “appetizer”:
- Individual coaches should be able to try core value quickly (planning sessions, light tracking)
- Coaches become word-of-mouth distribution into clubs/academies/municipalities
- The platform must still enforce security and tenant isolation from day one

This leads to a deliberate design decision:

✅ **Two onboarding modes, one tenancy model**

---

## 2) Decision: Option 1 (chosen)

### Mode A — Intro / Trial (Solo-coach tenant)
**Entry:** self-sign-up  
**Tenant type:** `solo-coach`  
**Default role:** `cv-admin` (owner of their own workspace)  
**Purpose:** allow coaches to try SIC features quickly and safely.

**Security constraints**
- Self-sign-up creates **only** a solo-coach tenant
- No ability to create org tenants (clubs/municipalities) via self-sign-up
- No privilege escalation to org-level administration
- Feature limits / quotas can be applied later (athletes, storage, advanced analytics)

### Mode B — Full service org (Club/Academy/School/Municipality)
**Entry:** invite/admin onboarding  
**Tenant type:** `org`  
**Roles assigned by:** tenant admin or platform admin  
**Purpose:** multi-user workspace with operational controls.

**Security constraints**
- No user can self-assign privileged roles
- Staff roles are assigned through controlled flows
- Better audit story: “who invited whom and why”

---

## 3) Core security model (applies to both modes)

### Tenant identity is mandatory
Every tenant (solo coach, club, school, municipality) has a unique `tenant_id`.

### `tenant_id` enforcement layers
Tenant isolation must be enforced in four layers:

1) **Identity layer (Cognito / JWT)**
   - `custom:tenant_id` exists and is included in tokens.
   - Backend trusts tenant only from validated JWT claims.

2) **API layer (API Gateway authorizer)**
   - Requests without valid tokens are rejected before Lambda runs.

3) **Application layer (Lambda code)**
   - Lambda extracts `tenant_id` from JWT claims.
   - Lambda never trusts tenant ids passed in body/query.
   - Missing/invalid claims are rejected.

4) **Data layer (DynamoDB/S3 partitioning)**
   - DynamoDB partition key uses tenant prefix (e.g., `PK = TENANT#<tenant_id>`).
   - S3 uses tenant prefixes (e.g., `<tenant_id>/...`).

**Most dangerous layer to forget:** Application layer  
Because a single bug (wrong query, scan, wrong key) can cause cross-tenant leakage.

---

## 4) Role assignment strategy (v1)

We choose **invite/admin workflow** as the secure default.

Why:
- Prevents privilege escalation
- Keeps audit and compliance clean
- Matches org onboarding reality

Solo-coach still supports self-sign-up, but role assignment is constrained:
- Solo-coach user becomes the tenant owner (`cv-admin` for their own tenant only)

---

## 5) Real issues encountered (and what we learned)

### A) CDK bootstrap required
Initial deploy failed because environment was not bootstrapped:

- `/cdk-bootstrap/hnb659fds/version not found`

Fix:
```bash
npx cdk bootstrap aws://333053098932/us-east-1

## B) CloudFormation Circular Dependency

We hit a circular dependency when:

- Cognito User Pool needed Lambda as a trigger  
- Lambda IAM policy referenced the User Pool ARN  

### Fix (Temporary MVP)

- IAM policy used:

```ts
resources: ['*']
```

to break the dependency.

**Follow-up action:**  
Tighten permissions later without creating circular references.

---

## C) Node 18 Lambda Runtime Missing aws-sdk

Lambda failed with:

```
Cannot find module 'aws-sdk'
```

### Fix

- Migrated Lambda to **AWS SDK v3**
- Packaged `@aws-sdk/client-cognito-identity-provider` with the Lambda asset
- Redeployed successfully

---

## 6) Current Deployed State (Week 1 Status)

- ✅ SicAuthStack-Dev deployed  
- ✅ Cognito User Pool + client + domain  
- ✅ Groups exist: `cv-admin`, `cv-coach`, `cv-medical`, `cv-athlete`  
- ✅ `custom:tenant_id` exists  
- ✅ PostConfirmation Lambda runs and logs to CloudWatch  
- ✅ Verified dummy user was added to group `cv-athlete` and logs confirmed  

---

## 7) Next Actions (Week 2 Kickoff)

1. Tighten IAM from `'*'` back to least privilege (remove temporary policy).  
2. Upgrade Lambda runtime to **Node 20**.  
3. Build **SicApiStack**:
   - API Gateway + Cognito authorizer  
   - First tenant-enforced Lambda endpoint (reads `tenant_id` from JWT)  
4. Implement a real onboarding flow:
   - Solo-coach self-sign-up creates tenant + owner role  
   - Org invite workflow assigns roles securely  