# Day 3 – Security Orientation

## Shared Responsibility Model (Sports Intelligence Cloud)

AWS is responsible for:

- Physical security of the data centers and underlying infrastructure.
- Maintenance and patching of the hardware, host OS, and runtime for AWS managed services (S3, DynamoDB, Lambda, SageMaker, etc.).
- Service availability and data durability for the managed services I use.
- Security of the AWS control plane APIs (e.g. IAM, STS, S3, EC2 APIs).

I am responsible for:

- Setting up IAM identities and policies (users like `j-admin`, roles for Lambda/SageMaker, MFA, and least-privilege access).
- Encryption configurations (choosing and configuring KMS keys, S3 bucket encryption, and key policies).
- Monitoring and logging (CloudWatch logs/metrics, CloudTrail, budget alarms, and how I respond to incidents).
- Application and data security (Cognito auth, enforcing `tenant_id` **from JWT claims** in APIs and data access for both **solo-coach** and **club** tenants, securing secrets, preventing cross-tenant leaks).
- For S3 buckets with athlete data, I will enforce encryption by enabling default SSE-KMS on the bucket (via IaC) and never allowing unencrypted writes.

---

## IAM Model (first draft)

- IAM users are for humans only (for now just `j-admin` with MFA).
- Workloads (Club Vivo backend, Ruta Viva ingestion, ML jobs) will use IAM roles, not IAM users.
- Lambda functions will run with execution roles (no long-lived access keys in code).
- Later, CI/CD (e.g. GitHub Actions) will assume a deployment role instead of using an IAM user.
- The future Club Vivo API Lambda will use a Lambda execution role. That role should be allowed to read/write only the DynamoDB table (and S3 bucket, later) needed for Club Vivo data **for the current `tenant_id`**, not all resources or all tenants in the account.

---

## KMS Model (first draft)

- KMS stores encryption keys and lets services encrypt/decrypt data without exposing the keys.
- Club Vivo athlete data in S3, Ruta Viva ride logs in S3, and Athlete Evolution AI model artifacts will all use SSE-KMS (customer-managed keys where appropriate).
- Only specific Lambda roles, SageMaker roles, and my admin user should be able to use the main SIC KMS key.
- Key policies will be strict: no wildcard access for `*` principals, and separation between dev/sandbox keys and future production keys.

---

## VPC Model (first draft)

- For early SIC, public-facing components like CloudFront, the web UI (S3 static hosting), and API Gateway will stay outside my VPC.
- Most Lambda functions can call AWS services (DynamoDB, S3) without being in a VPC, but later some Lambdas may run inside a VPC to reach private resources.
- In the future, private subnets in a VPC will host sensitive services like SageMaker endpoints or any databases that must not be directly internet-accessible.
- NAT gateways and VPC endpoints will be used carefully to manage cost and control outbound traffic from private workloads.

---

## Secrets Management (preview)

- Application secrets (DB passwords, API keys, future ML feature flags) must **not** be hard-coded or stored in plain text in the repo.
- I will use AWS Systems Manager Parameter Store and/or AWS Secrets Manager for:
  - API keys.
  - Database connection strings.
  - Third-party integration secrets.
- Lambda and future containers will read secrets at runtime via IAM roles with least-privilege access to only the parameters they need.

---

## Reflection

1. **What changed in how I see AWS security today?**  
   Before today, security felt like one big thing. Now I see IAM as *who can call what*, KMS as *who can decrypt data*, VPC as *what is exposed vs private*, and Cognito/JWT + `tenant_id` as *who can see which tenant’s data* for both solo-coach workspaces and club tenants.

2. **What still feels confusing or fuzzy?**  
   I still don’t feel fully confident about when exactly to put Lambda in a VPC versus leaving it outside, and how to design least-privilege IAM policies for more complex multi-tenant data access patterns.

3. **Which architecture principle did I actually apply today?**  
   **Security & Observability by Default** – I planned for IAM roles instead of users for workloads, SSE-KMS for S3 buckets with athlete data, and strict enforcement of `tenant_id` from JWT claims in future APIs.

4. **One concrete thing I will do differently from now on when using AWS:**  
   I will never give an app long-lived IAM user keys; I’ll always use roles. Any S3 buckets with athlete data will always get SSE-KMS from day one, and any API that handles Club Vivo data will **never** trust `tenant_id` from the request body – only from validated JWT claims.