# Runbook: Auth & API Alarms (SIC)

## Purpose
Respond quickly to auth failures and API/Lambda errors for the Club Vivo HTTP API.

## Alarms (current)
- `sic-<env>-httpapi-4xx`
- `sic-<env>-httpapi-5xx`
- `sic-<env>-mefn-errors`
- `sic-<env>-mefn-throttles`

## Triage Flow

### 1) `httpapi-4xx` (auth/authorization failures)
Likely causes:
- expired/invalid JWT (401)
- missing/invalid tenant claim contract (403)
- client misconfiguration (wrong audience/client id)

Check:
1. API Gateway HTTP API access logs (`/aws/apigwv2/sic-club-vivo-api-<env>`)
2. Look for `status` 401/403 and correlate with `requestId`
3. Lambda may not be invoked for many auth failures (errors may stay flat)

Action:
- Validate Cognito clientId/audience and issuer URL
- Confirm JWT includes required claims: `custom:tenant_id`, `custom:tier`, `custom:role` (when tier=org)
- If tenant claim errors increase: investigate Pre Token Generation trigger

### 2) `httpapi-5xx` (server-side failures)
Likely causes:
- Lambda runtime exception
- integration misconfig
- downstream dependency failures (later: DynamoDB)

Check:
1. Lambda logs for `sic-club-vivo-me-<env>`
2. Correlate with access log `requestId`
3. Review recent deploy/changes

Action:
- Roll back last change if needed
- Fix handler exceptions / config

### 3) `mefn-errors`
Likely causes:
- code bug / unhandled exception

Check:
- CloudWatch Logs for the function
- Look for stack traces and recent changes

Action:
- Patch and redeploy
- Add defensive validation

### 4) `mefn-throttles`
Likely causes:
- concurrency limit too low
- traffic burst

Check:
- Lambda throttles metric
- API request rate

Action:
- Raise reserved concurrency (if set) or account concurrency
- Consider caching / reducing cold starts (later)