# Day 3 – Security Orientation

## Shared Responsibility Model (Sports Intelligence Cloud)

**AWS is responsible for:**
- Physical security of the data centers and underlying infrastructure.
- Maintenance and patching of the hardware, host OS, and runtime for AWS managed services (S3, DynamoDB, Lambda, SageMaker, etc.).
- Service availability and data durability for the managed services I use.
- Security of the AWS control plane APIs (e.g. IAM, STS, S3, EC2 APIs).

**I am responsible for:**
- Setting up IAM identities and policies (users like `j-admin`, roles for Lambda/SageMaker, MFA, and least-privilege access).
- Encryption configurations (choosing and configuring KMS keys, S3 bucket encryption, and key policies).
- Monitoring and logging (CloudWatch logs/metrics, CloudTrail, budget alarms, and how I respond to incidents).
- Application and data security (Cognito auth, enforcing `tenant_id` in APIs and data access, securing secrets, preventing cross-tenant leaks).
- For S3 buckets with athlete data, I will enforce encryption by enabling default SSE-KMS on the bucket (via IaC) and never allowing unencrypted writes.

## IAM Model (first draft)

- IAM users are for humans only (for now just `j-admin` with MFA).
- Workloads (Club Vivo backend, Ruta Viva ingestion, ML jobs) will use IAM roles, not IAM users.
- Lambda functions will run with execution roles (no long-lived access keys in code).
- Later, CI/CD (e.g. GitHub Actions) will assume a deployment role instead of using an IAM user.
- The future Club Vivo API Lambda will use a Lambda execution role. That role should be allowed to read/write only the DynamoDB table (and S3 bucket, later) needed for Club Vivo data, not all resources in the account.

## KMS Model (first draft)
- KMS stores encryption keys and lets services encrypt/decrypt data without exposing the keys.
- Club Vivo athlete data in S3, Ruta Viva ride logs in S3, Athlete Evolution AI model artifacts.
- Only specific Lambda roles, SageMaker roles, and my admin user should be able to use the main SIC KMS key.

## VPC Model (first draft)

- For early SIC, public-facing components like CloudFront, the web UI (S3 static hosting), and API Gateway will stay outside my VPC.
- Most Lambda functions can call AWS services (DynamoDB, S3) without being in a VPC, but later some Lambdas may run inside a VPC to reach private resources.
- In the future, private subnets in a VPC will host sensitive services like SageMaker endpoints or any databases that must not be directly internet-accessible.

## Reflection

1. **What changed in how I see AWS security today?**

   Before today, security felt like one big thing. Now I see IAM as who can call what, KMS as who can decrypt data, and VPC as what is exposed vs private.


2. **What still feels confusing or fuzzy?**

   I still don’t feel confident about when exactly to put Lambda in a VPC

3. **Which architecture principle did I actually apply today?**

  Security by default: I’m planning KMS for all S3 data instead of later.

4. **One concrete thing I will do differently from now on when using AWS:**

 I will never give an app long-lived IAM user keys; I’ll always use roles.And any S3 buckets with athlete data will always get SSE-KMS from day one.