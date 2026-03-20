# Observability Signals Catalog

Purpose: single source of truth for SIC operational signals. Every alarm must map to a signal and a runbook.

## Signal fields
- **signalId**: stable identifier (usually matches `eventType` or an AWS metric alarm intent)
- **source**: `logs.eventType` | `aws.lambda` | `aws.apigw` | `custom.metric`
- **severity**: `info` | `warn` | `error` | `page`
- **what it means**: plain language
- **how to detect**: Logs Insights query or metric/alarm name
- **runbook**: link to runbook doc (or `TBD`)

---

## Signals

### Request lifecycle (logs.eventType)
| signalId | severity | what it means | how to detect | runbook |
|---|---:|---|---|---|
| request_start | info | request entered handler | filter `eventType="request_start"` | TBD |
| tenant_context_resolved | info | tenant context resolved (post-auth) | filter `eventType="tenant_context_resolved"` | TBD |
| request_end | info | request completed | filter `eventType="request_end"` | TBD |

### Auth & entitlements (logs.eventType)
| signalId | severity | what it means | how to detect | runbook |
|---|---:|---|---|---|
| auth_unauthenticated | warn | unauthenticated request (post-authorizer scope) | filter `eventType="auth_unauthenticated"` | docs/runbooks/auth-failures.md |
| auth_forbidden | warn | authenticated but forbidden (missing entitlements / role) | filter `eventType="auth_forbidden"` | docs/runbooks/entitlement-failures.md |

### Input validation (logs.eventType)
| signalId | severity | what it means | how to detect | runbook |
|---|---:|---|---|---|
| validation_failed | warn | caller input invalid | filter `eventType="validation_failed"` | TBD |

### Platform errors (logs.eventType)
| signalId | severity | what it means | how to detect | runbook |
|---|---:|---|---|---|
| handler_error | error | unhandled/5XX-class failure in handler path | filter `eventType="handler_error"` | TBD |
| dependency_error | error | downstream dependency failure (classified) | filter `eventType="dependency_error"` | TBD |
| ddb_error | error | DynamoDB failure surfaced to handler | filter `eventType="ddb_error"` | docs/runbooks/dynamo-throttling.md |

### Domain events (logs.eventType)
| signalId | severity | what it means | how to detect | runbook |
|---|---:|---|---|---|
| athlete_created | info | athlete created (first write) | filter `eventType="athlete_created"` | TBD |
| athlete_not_found | warn | requested athlete missing | filter `eventType="athlete_not_found"` | TBD |

---

## AWS-managed signals (alarms/metrics)

### Lambda
| signalId | severity | what it means | how to detect | runbook |
|---|---:|---|---|---|
| lambda.errors | page | Lambda function error count > 0 | alarm: `sic-dev-athletesfn-errors`, `sic-dev-mefn-errors` | TBD |
| lambda.throttles | page | Lambda throttled (concurrency) | alarm: `sic-dev-athletesfn-throttles`, `sic-dev-mefn-throttles` | docs/runbooks/dynamo-throttling.md |

### API Gateway (HTTP API)
| signalId | severity | what it means | how to detect | runbook |
|---|---:|---|---|---|
| apigw.4xx | warn | client error volume elevated | alarm: `sic-dev-httpapi-4xx` | docs/runbooks/auth-failures.md |
| apigw.5xx | page | server error volume elevated | alarm: `sic-dev-httpapi-5xx` | TBD |

---

## Custom metrics (current deployed state)

These custom metrics currently come from **CloudWatch Log Metric Filters** matching a legacy field name (`$.eventCode`).
This is expected to migrate to `$.eventType` once infra changes are approved and deployed.

| signalId | severity | what it means | how to detect | runbook |
|---|---:|---|---|---|
| athlete_create_success | info | athlete create succeeded | metric: `SIC/ClubVivo athlete_create_success` (dashboard: `sic-dev-ops`) | TBD |
| athlete_create_idempotent_replay | info | idempotency replay occurred | metric: `SIC/ClubVivo athlete_create_idempotent_replay` | docs/runbooks/idempotency-replays.md |
| athlete_create_failure | warn | athlete create failed (domain failure metric) | alarm: `sic-dev-athlete-create-failures` | TBD |