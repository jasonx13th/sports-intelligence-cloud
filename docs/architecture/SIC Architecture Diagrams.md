# SIC Architecture Diagrams

## High-level
- Cognito (auth) → API Gateway (JWT authorizer) → Lambda → DynamoDB/S3
- Tenant isolation enforced by tenant context + entitlements

## Tenant context (current)
- JWT claims provide `sub`
- Entitlements table keyed by `user_sub = claims.sub`
- Entitlements attributes: `tenant_id`, `role`, `tier`

(Add actual diagrams/links here as you generate them.)