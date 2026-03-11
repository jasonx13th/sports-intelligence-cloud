# Week 3 — Day 3 — Closeout Summary (with Today’s Objectives)

## Today’s session objective
Finish Week 3 Day 3 by promoting the prototype into real, production-style athlete endpoints and hardening the platform with auditability + operational signals, while preserving SIC non-negotiables: fail-closed tenancy and tenant isolation by construction.

---

## Objectives and completion status

### Objective 1 — Promote `/test-tenant` prototype into real endpoints
✅ Completed

Implemented authenticated, real routes:
- `POST /athletes`
- `GET /athletes`
- `GET /athletes/{athleteId}`

Verified via live API calls with Cognito JWT.

---

### Objective 2 — Add tenant-safe data operations (no scans)
✅ Completed

Tenant scoping enforced by DynamoDB keys:
- `PK = TENANT#<tenantId>`
- `SK = ATHLETE#<athleteId>`

Listing uses `Query` + pagination (no `Scan`).

Athletes Lambda entitlements access hardened to **NO `dynamodb:Scan`**.

---

### Objective 3 — Add audit events for mutation, atomic with first-write
✅ Completed

First-write create uses `TransactWriteItems` and writes:
- Idempotency record
- Athlete record
- Audit record

Replay does **not** write a second audit record.

Verified audit existence via DynamoDB `Query`-only for `AUDIT#...`.

---

### Objective 4 — Add operational signals (logs → metrics → alarm)
✅ Completed

Added CloudWatch Logs Metric Filters (JSON field filter on `$.eventCode`):
- `athlete_create_success`
- `athlete_create_idempotent_replay`
- `athlete_create_failure`

Added alarm:
- `sic-<env>-athlete-create-failures`

Verified:
- Log group `metricFilterCount = 3`
- Metrics emitted datapoints for success + replay

---

### Objective 5 — API contract documentation
✅ Completed

Created contract doc at:
- `docs/api/athletes.md`

---

### Objective 6 — Contract correctness: replay must match first-write schema
✅ Completed

Fixed initial PK/SK leakage by normalizing create response on first-write.

Verified responses:
- First write: `replayed:false` with normalized athlete fields only
- Replay: `replayed:true` with same `athleteId` and same schema

---

## What we built
Production-grade athlete API with:
- tenant context derivation first
- deterministic DynamoDB access patterns
- transactional idempotent create
- atomic audit log write
- operational metrics and alarm signals

Verified end-to-end in AWS (deploy + live calls + DynamoDB + CloudWatch).

---

## Files changed (high-level)

### `infra/cdk/lib/sic-api-stack.ts`
- Athletes Lambda + API routes
- IAM tightened (no Scan for Athletes entitlements)
- Metric filters + alarm

### `services/club-vivo/api/athletes/handler.js`
- Correct module wiring (`parseJsonBody`, `requireFields`)
- Repository instantiation + structured logs

### `services/club-vivo/api/_lib/athlete-repository.js`
- `getAthlete`
- audit in transaction
- normalized create response (no PK/SK leakage)

### `docs/api/athletes.md`
- official API contract

---

## Major issues encountered + fixes
- CDK CLI missing → standardized on `npx cdk ...` from `infra/cdk`
- Runtime export mismatches:
  - `parseBody` → `parseJsonBody`
  - `validate` → `requireFields`
- Unauthorized calls traced to missing Authorization header variables / session state; validated JWT claims
- CloudWatch metric filter pattern invalid → switched to `FilterPattern.stringValue("$.eventCode", "=", ...)`
- DynamoDB CLI paramfile JSON/BOM issues → created `eav.json` without BOM and used `file://`

---

## Validation evidence (high confidence)
- `npx cdk synth/diff/deploy SicApiStack-Dev`
- Live API:
  - create + replay behavior confirmed
  - GET by id + list confirmed
- DynamoDB:
  - audit items confirmed for created athleteIds using Query-only
- CloudWatch:
  - metric filters installed and metrics producing datapoints

---

## Security / observability / cost notes
- **Security:** tenant isolation enforced auth → handler → repository → DynamoDB keys; Athletes entitlements access excludes Scan
- **Observability:** structured logs + metric filters + failure alarm
- **Cost:** PAY_PER_REQUEST DynamoDB OK for now; hot tenant partition risk acknowledged (future sharding/GSI)

---

## Next session starting point
- Remove `/test-tenant` endpoint and wiring (cleanup) once you confirm no dependencies
- Add a minimal CloudWatch dashboard panel for the 3 metrics
- Optional: standardize pagination naming (`cursor` vs `nextToken`) across request/response

---

## Certification mapping paragraph (DVA-C02 + MLA-C01 + AIF-C01)
- **DVA-C02:** API Gateway + Lambda + Cognito JWT, DynamoDB Query vs Scan discipline, transactional idempotency, CloudWatch metric filters/alarms, least-privilege IAM, fail-closed config
- **MLA-C01:** Tenant-safe data partitioning and audit boundaries that support governed feature pipelines and dataset isolation
- **AIF-C01:** Reliability and governance patterns (determinism, audit evidence, operational monitoring) aligned with production AI systems