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