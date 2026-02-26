## Why IAM matters for multi-tenant Club Vivo

- IAM is the gatekeeper that enforces **tenant isolation**: it makes sure that when Club A hits our APIs, they can only ever touch data that belongs to Club A, even though all clubs share the same AWS account and many of the same services.
- IAM lets us apply **least privilege** to every actor (admins, coaches, Lambdas, future CI/CD pipelines) so each identity can only do exactly what it needs (e.g., Club Vivo API Lambda can only read/write items for its tenant’s records in DynamoDB and S3, not the whole table or bucket).
- IAM separates **human identities from workload identities**: humans use IAM users or SSO with MFA (e.g., j-admin), while workloads use IAM roles with temporary credentials, so we never hard-code long-lived keys into code or config.

## Why Cognito is our auth backbone for SIC

- Cognito gives us a **managed user directory** for all clubs, schools, and municipalities, so we don’t have to build password storage, MFA, or account recovery ourselves (which are easy to get wrong and critical for youth data).
- Cognito issues **standards-based JWT tokens** that integrate directly with API Gateway, so our Club Vivo APIs can trust the identity and role (group) information without custom auth code scattered across Lambdas.
- Cognito is designed to **scale to thousands of users and multiple apps**, letting us onboard more clubs and add new SIC pillars (Athlete Evolution AI, Ruta Viva) while still using a unified identity system per tenant.

### IAM users vs IAM roles in SIC

- IAM users in SIC are **human operator identities** inside the AWS account (for example, `j-admin` or a future DevOps engineer). They have long-term identity, console access, and MFA, and are used to manage and operate the platform, not to act as clubs or coaches.
- IAM roles in SIC are **workload identities** that AWS services (like Lambda or future SageMaker jobs) assume. They have no long-term credentials; instead, AWS issues temporary credentials for them when the workload runs.
- Club admins, coaches, athletes, and other end-users of Club Vivo are **Cognito users**, not IAM users. They authenticate via Cognito, and our Lambdas run under IAM roles to act on their behalf within strict permissions.

### Example of a human identity in SIC

- `j-admin` is an IAM user in the `SIC-Admins` group. They can configure, secure, and update the SIC platform (including Club Vivo resources) via the console and CLI, but they cannot use the root user and should not have permissions to bypass our security guardrails (for example, they shouldn’t be able to disable CloudTrail or delete audit logs).
- A future “Athlete AI Developer” IAM user would have permissions scoped only to the Athlete Evolution AI stacks and data. They would not be able to modify Club Vivo’s production tables, S3 buckets, or IAM roles, even though everything is in the same AWS account for now.

### Example of a workload identity in SIC

- When a coach (Cognito user) in Club Vivo creates a new training session, the frontend sends a request with the coach’s JWT to our API Gateway.
- API Gateway invokes a Lambda function that runs under the `club-vivo-api-lambda-role`. This IAM role is allowed to read the coach’s club configuration (equipment, field size, player list, etc.) from DynamoDB and S3, and then call an AI service to help build a training plan.
- The coach never gets AWS credentials. Only the Lambda assumes the IAM role with temporary credentials, which is safer than putting any access keys into code or config.

## Cognito User Types & Groups (Club Vivo)

In Club Vivo, end-users live in Cognito (not IAM). They are organized into groups to represent their role within a club:

- **Club owner / director** → `director-group-cv`  
  Responsible for managing the club account, onboarding coaches/athletes, and seeing club-wide analytics.

- **Coach** → `coach-group-cv`  
  Creates training sessions, manages teams and attendance, and interacts with AI planning tools for their club.

- **Athlete** → `athlete-group-cv`  
  Views personal schedule, session feedback, and optionally interacts with AI for individual development, but cannot change club-level settings.

These groups are stored in the Cognito User Pool and appear as claims in the user’s JWT (e.g. `cognito:groups`), so the backend knows what each user is allowed to do.

---

## Tenant Identity – `tenant_id` Flow

To support multi-tenancy, every club in SIC has a `tenant_id` that identifies it uniquely (for example: `club-vivo-1234`).

- When a **new club is onboarded**, the platform creates a Tenant record (e.g. in a DynamoDB `Tenants` table) with a unique `tenant_id` plus metadata like name, city, and sport.
- The Cognito User Pool defines a **custom attribute** such as `custom:tenant_id`. Every user account in Cognito is created with this attribute set to the `tenant_id` of their club.
- All members of the same club (directors, coaches, athletes) share the same `tenant_id` value in their Cognito profile. They don’t choose this manually; the platform logic assigns it based on which club they belong to.
- When a user logs in, Cognito authenticates them and issues JWT tokens. The **JWT payload** includes the `custom:tenant_id` claim, along with their role (`cognito:groups`).
- That means every API request carries the tenant identity inside the token, so backend Lambdas can enforce data access using `tenant_id` against DynamoDB keys and S3 prefixes.

This makes `tenant_id` a single thread that runs from tenant onboarding → Cognito user profile → JWT → backend authorization logic.

---

## API Gateway & Cognito Token Validation

API Gateway uses a Cognito authorizer to make sure only valid, trusted tokens ever reach our Lambdas.

**Request flow:**

1. The user logs into Cognito (via Hosted UI or custom login), and on success, the frontend receives JWT tokens.
2. When the frontend calls a Club Vivo API endpoint, it sends the token in the `Authorization: Bearer <JWT>` header.
3. API Gateway’s **Cognito authorizer** checks the token on every request:
   - Verifies the **signature** using Cognito’s public keys (to ensure it wasn’t tampered with).
   - Confirms the **issuer** (`iss`) matches our User Pool.
   - Confirms the **audience** (`aud`) matches the correct app/client id.
   - Checks the **expiration** (`exp`) to ensure the token is still valid.

**Outcomes:**

- If the token is **expired, malformed, has the wrong audience/issuer, or a bad signature**, API Gateway returns `401/403` and **does not call Lambda at all**.
- If the token is **valid**, API Gateway forwards the request to Lambda along with the token context, so Lambda can read claims like `custom:tenant_id` and `cognito:groups` and enforce tenant isolation and permissions in code.

API Gateway + Cognito together act as the “front door bouncer” for SIC, ensuring that only authenticated, correctly scoped requests ever touch our multi-tenant data.

## End-to-End Flow: Coach from Club A Fetching Athlete List

This flow shows how a coach from **Club A** fetches their athletes in Club Vivo, and how multi-tenant isolation is enforced so they never see Club B’s data.

### 1. Login and Token Issuance

1. The coach opens the Club Vivo web app and logs in.
2. The frontend redirects the coach to the Cognito User Pool sign-in page (or uses a custom UI that calls Cognito behind the scenes).
3. Cognito verifies the coach’s credentials (and MFA if enabled).
4. On successful login, Cognito returns JWT tokens to the frontend.  
   The ID/access token contains:
   - `sub` → unique user id
   - `cognito:groups` → includes `coach-group-cv`
   - `custom:tenant_id` → the coach’s club tenant id, e.g. `club-vivo-1234`

### 2. Frontend Calls the Athletes API

1. The frontend calls the Club Vivo API endpoint to list athletes, for example:
   `GET /club-vivo/athletes`
2. It attaches the token in the header:
   `Authorization: Bearer <JWT_HERE>`

### 3. API Gateway and Cognito Authorizer

1. API Gateway receives the request and passes the token to the **Cognito authorizer**.
2. The authorizer validates:
   - Token signature (using Cognito’s public keys)
   - `iss` (issuer) matches our User Pool
   - `aud` (audience) matches our app’s client id
   - `exp` (expiration) is still in the future
3. If any check fails, API Gateway returns `401/403` and **does not invoke Lambda**.
4. If all checks pass, API Gateway marks the request as authenticated and forwards it to the Lambda function.

### 4. Lambda Reads Claims and Enforces Tenant

1. The Lambda function runs under the IAM role `club-vivo-api-lambda-role`.
2. The Lambda code reads the token claims from the request context:
   - `tenant_id = "club-vivo-1234"`
   - `role = "coach-group-cv"`
3. The Lambda **never trusts any tenant id from the request body or query string**.  
   It only trusts the `tenant_id` from the validated JWT.

### 5. DynamoDB Data Access Pattern

1. The Club Vivo DynamoDB table is designed with tenant-based keys, for example:

   - Partition key (`PK`): `TENANT#<tenant_id>`
   - Sort key (`SK`): `ATHLETE#<athlete_id>`

2. To fetch athletes for Club A, the Lambda runs a query like:

   - `PK = "TENANT#club-vivo-1234"`
   - `SK begins_with "ATHLETE#"`

3. This means:
   - The Lambda **only ever queries using the tenant id from the token**.
   - Even if a bug tried to request `club-vivo-9999`, the code would still use the tenant id from the JWT, not from the client input.

### 6. S3 Access Pattern (If Athletes Have Media)

If athlete photos or documents are stored in S3:

1. S3 uses a tenant-based prefix structure, for example:
   - `s3://sic-dev-.../club-vivo-1234/athletes/<athlete-id>/photo.jpg`
2. The Lambda constructs S3 keys using the `tenant_id` from the JWT:
   - Never from client-provided tenant ids.
3. The IAM policy for `club-vivo-api-lambda-role` can include conditions to restrict access to S3 keys under the matching tenant prefix only.

### 7. Response Back to the Coach

1. Lambda returns the list of athletes that match `tenant_id = club-vivo-1234`.
2. API Gateway sends the JSON response back to the frontend.
3. The coach from Club A only sees **Club A athletes** because:
   - The JWT carried `tenant_id = club-vivo-1234`
   - The Lambda enforced tenant id at query time
   - The data model (DynamoDB + S3 prefixes) is structured by tenant
   - IAM and app logic never allow cross-tenant queries

### Isolation Guarantees

This flow enforces tenant isolation at multiple layers:

- **Identity layer**: `custom:tenant_id` in the Cognito token
- **API layer**: API Gateway authorizer validates tokens before anything runs
- **Application layer**: Lambda uses `tenant_id` from the JWT and never from client input
- **Data layer**: DynamoDB keys and S3 prefixes are partitioned by `tenant_id`
- **IAM layer**: Lambda’s IAM role is restricted to tenant-scoped data access patterns

## How `SicAuthStack` Will Connect to `SicApiStack`

The `SicAuthStack` is responsible for **identity and authentication** across the Sports Intelligence Cloud, starting with Club Vivo:

- Creates the **Cognito User Pool** for SIC end-users (club directors, coaches, athletes).
- Creates **User Pool Clients** for the Club Vivo web app (and later other frontends).
- Defines **Cognito Groups** for roles:
  - `director-group-cv`
  - `coach-group-cv`
  - `athlete-group-cv`
- Adds a custom attribute for `tenant_id` so every user is bound to a specific club/tenant.
- (Later) May create a Cognito **Identity Pool** + IAM roles for direct S3 access.
- Exposes key identifiers as **CloudFormation outputs**, e.g.:
  - `UserPoolId`
  - `UserPoolArn`
  - `ClubVivoWebClientId`

The future `SicApiStack` will be responsible for **API Gateway + Lambda** for Club Vivo and other pillars:

- Defines **REST APIs** or HTTP APIs (e.g. `/club-vivo/athletes`, `/club-vivo/sessions`).
- Creates **Lambda functions** for the Club Vivo backend, running under IAM roles that enforce least privilege.
- Configures **Cognito authorizers** on API Gateway using values exported by `SicAuthStack`:
  - The authorizer trusts tokens from the SIC User Pool (`UserPoolId` / `UserPoolArn`).
  - The API client configuration uses the `ClubVivoWebClientId`.
- Passes the validated **JWT claims** (including `tenant_id` and `cognito:groups`) through to the Lambdas so they can enforce tenant isolation in DynamoDB and S3.

In other words:

- `SicAuthStack` = “Who are you?” and “Can I trust this token?”  
- `SicApiStack` = “What are you allowed to do in the Club Vivo API, given your tenant and role?”

Infrastructure-wise, `SicApiStack` will **import** the outputs from `SicAuthStack` (e.g. via CloudFormation export/import or CDK stack references) so that API Gateway is always configured against the correct Cognito User Pool for the current environment (dev/stage/prod).

## Production & Observability for Auth

### Security-by-Default for Authentication

For the Sports Intelligence Cloud, especially working with youth data, auth must be secure by default:

- **MFA for operators:**  
  - IAM users like `j-admin` must always use MFA.  
  - Any future SicOps/SRE accounts will be required to enable MFA before they get permissions.

- **Cognito password policy (Club Vivo users):**  
  - Minimum length: **at least 10 characters**.  
  - Require at least **3 of 4**: uppercase, lowercase, number, special character.  
  - Password expiration and reuse rules kept reasonable to avoid users choosing weak patterns.

- **MFA for high-privilege app users (optional later):**  
  - For Cognito users in `director-group-cv`, the platform should encourage or require MFA because they manage club-wide data and billing.

- **Secrets management:**  
  - Any future integration secrets (e.g., Bedrock API config, third-party APIs) will be stored in **AWS Secrets Manager** or **SSM Parameter Store**, never hard-coded in Lambda or CDK code.
  - Only the specific Lambda roles that need a secret will be granted `GetSecretValue` / `GetParameter` with least-privilege scopes.

### Observability for Authentication & Authorization

To understand and debug auth in production, we need visibility at several layers:

- **Cognito metrics & logs:**  
  - Monitor sign-in success vs failure counts (especially spikes in failures by IP / user).  
  - Track account lockouts or unusual sign-in patterns.

- **API Gateway authorizer logs:**  
  - Enable access logging on API Gateway to see:
    - Rejected requests (401/403) vs successful ones.  
    - Which endpoints are frequently hit with invalid/expired tokens.

- **Lambda logs for auth context:**  
  - Each Lambda that uses JWT claims should log (at debug/info level, without PII):
    - `tenant_id` and `role` being processed.  
    - Why a request was denied at the application layer (e.g., cross-tenant access attempt, missing required claim).

- **CloudWatch Alarms:**  
  - Alarms on:
    - A sharp increase in API Gateway 401/403 for specific routes (could indicate auth misconfiguration or attack).  
    - Unusual volume of sign-in failures in Cognito for a single user or IP range.  
    - Lambda errors when parsing/validating tokens (could indicate deployment of wrong config or expired keys).

### Logging Principles

- Do **not** log raw tokens, passwords, or sensitive personal data.  
- Log **enough context** to reconstruct what happened:
  - `requestId`, `tenant_id`, role/group, endpoint, high-level reason for denial.  
- Use structured logging (JSON) where possible to make searching and alerting easier.

## Stress-Test Questions for Auth & Tenancy (Week 1 Day 1)

### 1. Scale: 10 Clubs → 10,000 Clubs

- How does Cognito handle going from a few hundred users to tens of thousands across many clubs?
- Do I need **one** User Pool for all clubs, or separate pools per region or environment?
- How does my `tenant_id` design in JWT + DynamoDB scale when:
  - Each tenant has hundreds of athletes and sessions?
  - There are thousands of tenants?

**My thoughts:**
- [Write 3–5 bullet points about how your current design scales, and any future changes you might make.]

---

### 2. Failure Modes

**Cognito region outage:**

- What happens to Club Vivo if Cognito in that region is unavailable?
- What is the user experience (login, already-signed-in sessions)?
- What is my mitigation or fallback plan?

**API authorizer misconfiguration:**

- Worst case: what if I accidentally deploy an API stage without the Cognito authorizer configured correctly?
- How would I detect this quickly from:
  - Logs?
  - Metrics?
  - Synthetic tests or smoke tests?

**My thoughts:**
- [Write 3–6 bullets covering both failure scenarios and how you would react.]

---

### 3. Cost Awareness for Auth

Think roughly about cost components (no need for exact numbers):

- Cognito charges per **MAU** (monthly active user).  
- API Gateway charges per **request**.  
- Lambda charges per **invocation + duration**.

**My thoughts:**
- At ~10 clubs (early dev), what’s my auth cost profile like?
- At ~1,000 clubs, what changes (or what should I monitor)?
- At ~10,000 clubs, what optimizations might I need (e.g., caching, fewer roundtrips, more efficient token usage)?

Write a few bullets estimating how auth cost grows and what metrics you’d keep an eye on.

---

### 4. Security Incident: Cross-Tenant Data Leak

Imagine a bug allows a coach from Club A to see **one athlete** from Club B.

**Questions:**

- How would I **detect** such a bug or incident?
- Once detected, what immediate steps would I take to:
  - Stop the leak.
  - Audit how many records were impacted.
  - Fix the code and/or IAM/data model.
- How would I communicate this to:
  - The affected clubs.
  - (If required) regulators or data protection officers.

**My thoughts:**
- [Write 5–8 bullets describing your incident response approach.]

## Reflection – Week 1 Day 1

- **What clicked today about multi-tenant auth and IAM?**  
  - [1–3 sentences in my own words.]

- **What is still fuzzy or uncomfortable?**  
  - [List any areas: Cognito config, JWT details, CDK patterns, etc.]

- **One way I applied the “Multi-Tenant First” principle today:**  
  - [Describe a concrete design choice: `tenant_id` in JWT, DynamoDB key design, S3 prefixes, IAM conditions, etc.]

- **How this ties back to the Sports Intelligence Cloud mission:**  
  - [1–2 sentences connecting secure tenant isolation to trust with clubs, schools, municipalities, and families.]