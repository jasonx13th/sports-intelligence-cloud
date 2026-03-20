# Week 3   Tenancy, DynamoDB Patterns, Idempotency, and Ops Q&A

## One tenant becomes huge (100k athletes). What breaks first? What do you do?

**What breaks first**
- “List athletes” can become expensive/slow if you:
  - request huge pages
  - sort/filter in app code
  - need complex queries not supported by keys

**What we do**
- Enforce strict `limit` (e.g., 25–50)
- Require pagination always
- Add access-pattern-driven indexes only when needed (e.g., GSI for “by team”)
- Monitor hot partitions: if one tenant dominates traffic, a single partition key can throttle

**Hot partition mitigation options (only if required)**
- Add a controlled “bucket shard” in the PK: `TENANT#t123#BKT#03` (requires planned write/read strategy)
- Create a purpose-built GSI for read-heavy patterns
- Cache read-mostly lists (not today)

**Bottom line**
v1 is fine with `PK=TENANT#id` + pagination, but we monitor.

---

## Need “list athletes by team.” Do you add a GSI? What key? Cost?

Yes—likely a GSI if “team” is a frequent query and you can’t encode it into the base SK without breaking other patterns.

**Example**
- `GSI1PK: TENANT#<tenantId>#TEAM#<teamId>`
- `GSI1SK: ATHLETE#<athleteId>` (or `NAME#...` if you need sorting)

Query:
- `GSI1PK = TENANT#t123#TEAM#blue`

**Cost / tradeoffs**
- Higher write cost (each write updates the GSI)
- More storage
- More complexity (must ensure GSI attributes always present)

**Rule**
No GSI unless an access pattern demands it. “By team” is a legit demand; add it when we build that feature.

---

## How do you prevent an engineer from accidentally writing a scan later?

You need three layers:

### (a) Code-level guardrail
- Repository does not export scan helpers
- Provide only tenant-scoped query/get functions

### (b) CI/static check
- Fail CI if `ScanCommand` appears in `services/...` (except approved admin tooling)

### (c) Observability
- Log/metric any scan usage and alarm

This is “process + enforcement,” not “hope.”

---

## Where do you enforce tier-based capability without weakening tenant isolation?

- **Tenant isolation**: enforced in `buildTenantContext(event)` + PK design (data-layer)
- **Tier/role capabilities**: enforced in the service layer as explicit checks
  - Example: free tier can list athletes but cannot create more than N
  - coach role can create sessions; athlete role cannot

**Key idea**
Tier checks must never change how `tenantId` is derived. Tier checks decide allow/deny after tenant context is built, before calling the repository.

---

# Comprehension (short answers)

## Why is “tenant id from request body” catastrophic even with Cognito auth?

Because any logged-in user could pretend to be another club by sending a different `tenantId` in the body. Cognito proves **this is a real user**, but it does not prove **this user belongs to that tenant** unless we derive tenant from verified entitlements. Accepting tenant from the client hands them the keys to other clubs’ data.

---

## Why is Query mandatory and Scan unacceptable for multi-tenant DynamoDB?

**Query** uses the partition key (PK) so we read records for one tenant by construction.

**Scan** reads across the whole table (all clubs) and then filters, which is:
- a security risk (easy to leak data)
- a cost/performance disaster as the table grows

---

## What fails if we skip idempotent create and a mobile client retries after a timeout?

Duplicates. The user taps “Save” once, the app times out, retries automatically, and now you created two records. Cleanup becomes messy, stats become inconsistent, and users see duplicates.

---

## Where must validation live, and what must the repository assume?

- Validation must live at the handler/API edge (before data access): required fields, sizes, types, headers like `Idempotency-Key`, etc.
- The repository should assume inputs are validated and tenant-safe. It still enforces tenant scoping by construction, but it shouldn’t be deciding if payloads are valid.

---

## If a tenant has 2M athletes, what breaks first in your current Query + pagination approach?

Not security—**performance/UX and hot partitions**:
- Paging through 2M items becomes slow/expensive over time
- A very active tenant can become a hot partition:
  - `PK = TENANT#bigTenant`
  - DynamoDB may throttle that partition under heavy load

**Mitigations (future)**
- Alternate access patterns (search by prefix/team/status)
- Shard keys for very large tenants (`PK = TENANT#id#SHARD#n`)
- Add GSI(s) for different query needs

---

## How to prevent a malicious user forging `nextToken` to read another tenant’s data?

Two layers:

- **Primary**: tenant isolation is enforced by the partition key. Even with a forged token, Query uses:
  - `PK = TENANT#<theirTenantId>`
  derived from entitlements, not the token.
- **Extra hardening**: make `nextToken` tamper-evident:
  - sign it (HMAC) or encrypt it
  - include `tenantId` inside it and verify it matches entitlements-derived `tenantId`

---

## Plan if `TransactWriteItems` throttles during peak usage?

- Retry with exponential backoff + jitter on throttling errors (preferably server-side)
- Keep transactions minimal (we write only a small set of items)
- If peak load persists:
  - reduce hot key pressure (partitioning/sharding where appropriate)
  - consider alternative idempotency store design (still tenant-scoped)
  - consider async confirmation only if the business permits (usually not for core CRUD)

---

## Mandatory log fields for triaging a 500 in < 3 minutes

At minimum:
- `requestId`
- `route` / `operation`
- `statusCode`
- deterministic `code` (e.g., `invalid_request`, `misconfig_missing_env`)
- `tenantId`
- `userId` (`sub`)
- `errorName` / `errorMessage` (sanitized)
- `latencyMs`

Nice-to-have:
- `idempotencyKey` (hashed/redacted)
- `athleteId`

---

# Week 3 — Day 3 — Comprehension Check (Reviewed)

## For `GET /athletes/{athleteId}`, what exact DynamoDB keys do we use, and why is it tenant-safe?

**Answer**
- `PK = TENANT#<tenantId>`
- `SK = ATHLETE#<athleteId>`

`tenantId` is derived only from `buildTenantContext(event)` (entitlements/auth context), never from client input.

**Why tenant-safe**
- Read is scoped by construction to the tenant partition (`PK`)
- Even if two tenants share the same `athleteId`, `GetItem` cannot cross partitions because it always includes the tenant-bound `PK`

**Optional precision**
Return `404` (not `403`) when not found to avoid existence leakage across tenants.

---

## What’s the failure mode if we accidentally log the full request payload in an audit event?

**Answer**
- Persisting sensitive/unnecessary data (privacy/security)
- Increasing blast radius during incidents
- Higher cost/noise (larger ingestion and storage)
- Violating minimal operational data handling

Audit logs should capture who did what and when, not become a shadow copy of the full request.

---

## What fields must exist in logs to support metric filters reliably?

**Minimum**
- `eventCode` (primary)
- `tenantId`
- `requestId`
- `route`
- `statusCode` (or consistent `outcome`)

**Strongly recommended**
- `entityType`
- `entityId`
- `actorUserId`
- `replayed`

**Reviewer note**
`eventCode` is most important because CloudWatch metric filters are simplest/most robust with exact-string matching.

---

## What happens if two `POST /athletes` requests arrive simultaneously with the same idempotency key?

**Answer**
- One transaction wins the first-write path
- The other resolves as replay-safe behavior via the idempotency mechanism
- Result:
  - no duplicate athlete
  - no duplicate audit record

---

## What happens if DynamoDB throttles the transaction?

**Answer**
- Client receives a server-side failure (typically `5XX` unless explicitly mapped)
- Logs emit `athlete_create_failure`, incrementing the failure metric and potentially triggering an alarm

**Nuance**
Some throttling/limit errors are retryable; ensure retry strategy is deliberate and does not break idempotency expectations.

---

## How do we query audit events for a tenant over a time range without scanning?

**Answer**
Query with:
- `PK = TENANT#<tenantId>`
- `SK begins_with "AUDIT#"`

Use ISO timestamp ordering in `SK` for deterministic time-ordered retrieval without `Scan`.

**Optional enhancement (future)**
Use `BETWEEN` on `SK`:
- `AUDIT#<startISO>` and `AUDIT#<endISO>~`
to bound the range precisely while staying query-only.

---

## Why did PK/SK leak initially?

Because the repository returned the raw DynamoDB item shape on the first-write path (`athleteItem`), and that internal shape includes `PK`/`SK` by design. We treated a persistence object as an API DTO.

---

## Where is the right normalization boundary?

At the API boundary (handler/controller), with a single source of truth for the output shape:
- Repositories can use internal persistence fields (`PK/SK`, `type`, etc.)
- Handlers (or a dedicated mapper/DTO layer) must return public API objects only

Practically: normalize once, consistently, right before returning the HTTP response (or have the repo return a normalized domain DTO and never leak storage details upward).

---

## Why must replay match first-write response?

Because idempotency means clients can safely retry without changing meaning. If replay returns a different payload shape:
- clients get nondeterministic contracts (hard to integrate)
- retry logic can break
- subtle bugs appear in caching/UI/downstream processing

Rule: **Same request + same idempotency key ⇒ same semantic result + same response schema**, with only allowed difference being metadata like `replayed: true/false`.

---

### Why is JSON structured logging more valuable than free text in CloudWatch? Give 2 reasons.

First, JSON makes logs **queryable by field instead of by guesswork**. This means logs can be filtered directly by fields such as `tenantId`, `userId`, `requestId`, `eventType`, or `error.code` in CloudWatch Logs Insights rather than searching through raw text.

Second, JSON makes logs **consistent across handlers**. When every Lambda writes logs using the same structure, dashboards, metric filters, alarms, and investigations become much easier because the fields are stable and predictable.

---

### What’s the difference between `requestId` and `correlationId`?

`requestId` is the identifier for a **single API Gateway or Lambda invocation**.

`correlationId` is used to **tie together the full request story across multiple components or service calls**. In a simple request, it may equal `requestId`. In more complex flows, multiple internal operations can share the same `correlationId`.

---

### Name 3 fields you will never log in production and why.

The following fields must never appear in logs:

- **Raw JWTs or access tokens**  
  These are sensitive credentials and exposing them would create a serious security risk.

- **Authorization headers**  
  These often contain bearer tokens that could be used to impersonate users.

- **Full request bodies containing user or athlete data**  
  Request payloads may contain PII or business-sensitive information that should never be written to logs.

---

### Where does `tenantId` come from in SIC and why is that non negotiable?

`tenantId` is derived **only from verified authentication context combined with entitlements resolution inside the backend flow**.

It is non negotiable because **tenant identity is a security boundary**. If the client were allowed to supply `tenantId`, one tenant could attempt to read or write data belonging to another tenant, breaking isolation guarantees.

---

### If API Gateway retries or a client retries, how does correlation help debug duplicate writes?

Correlation allows all retry attempts to be traced back to the same logical request.  
By searching the `correlationId`, you can see the full sequence of events such as the original request, any retries, and whether the system treated the second attempt as an idempotency replay or a duplicate write.

This makes it easy to understand whether the duplicate came from:
- a client retry
- an API Gateway retry
- or a platform failure during processing.

---

### Why is “scan logs and filter in your head” not acceptable at platform scale?

At platform scale, the volume of logs is far too large for manual interpretation.  
Without structured fields, engineers would need to read thousands of lines of text to understand a single request.

Structured logs allow automated filtering, aggregation, dashboards, alerts, and metric extraction. This enables fast debugging and reliable operations across large distributed systems.

---

### What’s the failure mode if `correlationId` is client-controlled without validation?

If a client can send arbitrary correlation IDs without validation, they could:
- inject extremely long or malformed values that break logging pipelines,
- intentionally collide correlation IDs across requests to confuse investigations,
- or manipulate logs to hide malicious behavior.

Validation ensures the correlation ID remains safe, predictable, and trustworthy for debugging and observability.

---

### What fields are always present even when tenant resolution fails?

The following fields must always be present because they come from the platform runtime and request context, not from tenant resolution:

- `timestamp`
- `level`
- `service`
- `env`
- `eventType`
- `message`
- `requestId`
- `correlationId`

These allow the request to be traced and investigated even if authentication or tenant resolution fails early in the request lifecycle.

---

### What field(s) explicitly must not appear until after `buildTenantContext`?

- `tenantId`

`tenantId` must never appear before `buildTenantContext` succeeds because tenant identity is derived from verified authentication context and entitlements resolution inside the backend. Allowing it earlier would risk trusting client-supplied tenant information and could break tenant isolation.

---

### Give 3 examples of client errors (4XX) we should never retry.
- 400 Bad Request (invalid JSON, missing required fields)
- 401 Unauthorized (missing or invalid authentication)
- 403 Forbidden (authenticated but not entitled)

---

### Give 2 examples of platform errors (5XX) that might be retryable.
- 503 Service Unavailable (transient downstream or dependency failure)
- 500 Internal Server Error (only if explicitly classified as transient)

---

### For a POST write, why is “retry on timeout” dangerous without idempotency?
- Because the original request may have succeeded before the timeout occurred.
- Retrying can create duplicate records, duplicate side effects, or inconsistent system state.

---

### What should the client do when it receives 429 vs 503?
- 429: Back off with jitter and retry more slowly.
- 503: Retry only if the operation is safe to retry; for writes, idempotency is required.

---

### If DynamoDB starts throttling, what three signals will you see?

**Client signal**
- Increased 429 responses (or sometimes 503 depending on mapping)
- Higher latency due to retries and backoff

**Logs signal (CloudWatch)**
- `handler_error` events with:
  - `error.code = platform.too_many_requests`
  - `retryable = true`
- Normalized throttle-related errors from AWS SDK

**Metrics signal**
- DynamoDB: `ThrottledRequests` > 0
- Lambda: increased duration and possible error count
- API Gateway: spike in 4XX (429) or 5XX

---

### What’s the worst-case cost failure mode of “retry everything”?
- A retry storm where every failure triggers multiple retries
- Results in:
  - Increased Lambda invocations
  - Increased DynamoDB reads/writes
  - Increased logging volume
- Leads to:
  - Cost spikes
  - System instability
  - Harder debugging due to noisy signals

---

### How does idempotency reduce both correctness risk and cost risk?

**Correctness**
- Prevents duplicate writes and side effects
- Ensures one logical operation produces one result
- Avoids inconsistent data (e.g., duplicate athletes)

**Cost**
- Makes retries safe and efficient
- Allows returning cached/replayed results instead of reprocessing
- Reduces unnecessary compute and database operations

### Why is it dangerous to alarm on all 4XX? Give one example where 4XX is “healthy.”
**Answer:**  
Alarming on all 4XX creates alert fatigue because many 4XX are **expected client behavior** (bad input, unauthorized users, expired tokens). It drowns out real incidents (5XX/platform failures).  
**Healthy 4XX example:** `400 Bad Request` for missing `Idempotency-Key` or `404 Not Found` when a resource truly doesn’t exist.

### In your error contract, what’s the difference between `retryable=true` vs “safe to retry”?
**Answer:**  
- **`retryable=true`** means the server believes retrying *might succeed* (often transient: throttling, dependency hiccup).  
- **Safe to retry** depends on **operation semantics**: the client must only retry if the operation is **idempotent** or protected by idempotency keys/conditional writes.  
So: `retryable=true` is a signal; “safe to retry” is a **client decision** based on whether repeating the request can cause harm.

### Why do we treat authorizer-layer 401s differently (what can’t we guarantee)?
**Answer:**  
Because authorizer-level rejections happen **before** your Lambda handler runs, you can’t guarantee:
- your standardized error envelope body,
- your correlation headers (`x-correlation-id`),
- your structured logs for that request path.  
Your contract guarantees behavior **post-authorizer** only.

---

### What is the canonical log field we should use for metric filters now (`eventType`), and why deprecate `eventCode`?
**Answer:**  
`eventType` is the canonical, platform-wide structured logging field emitted by the logger and used consistently across services. `eventCode` is legacy and causes drift/confusion (code emits `eventType` while filters looked for `eventCode`). The migration aligns logs → metrics → alarms with one stable schema.

### Which alarms do we want at platform level vs endpoint level?
**Answer:**  
- **Platform-level:** API Gateway 5XX, Lambda Errors/Throttles, high-level latency, dependency failures. These indicate systemic incidents.  
- **Endpoint-level / domain-level:** business process signals like athlete-create failure/replay rates, validation spikes (careful), or tenant-specific anomalies. These help diagnose behavior without paging on expected client mistakes.

### How will a responder go from alarm → logs query → mitigation in <10 minutes?
**Answer:**  
1) Alarm fires (e.g., `apigw.5xx`, `lambda.errors`).  
2) Open linked runbook (e.g., `platform-5xx.md`).  
3) Run the provided Logs Insights query to isolate route + pull a `correlationId`.  
4) Trace a single request by `correlationId` to classify root cause (code bug vs dependency vs throttling).  
5) Apply safe mitigation (rollback load-increasing deploy, enforce backoff, reduce burst, follow throttling runbook).  
6) Create follow-up prevention item (dashboard/metric filter/ADR).

---

### If replay rate spikes to 80%, what are the top 3 likely causes and what do you do first?
**Answer:**  
**Likely causes:**
1) Client retry loop bug (retries even on success, or retries without backoff).  
2) Network instability/timeouts causing clients to retry aggressively.  
3) Platform transient failures (5XX/throttles) prompting retries (especially if clients ignore retry rules).

**What I do first:**
- Check if replay spike correlates with **failures/5XX** or is replay-only.  
- Identify whether it’s **tenant/client-version concentrated** via logs.  
- Communicate immediate client guidance: **retry only when retryable=true**, exponential backoff + jitter, cap retries, ensure idempotency keys.

### If 403s spike only for one tenant, what does that imply about entitlements vs code?
**Answer:**  
It strongly implies an **entitlements issue** (missing/incorrect tenant entitlements record, role mapping removed, onboarding drift) rather than a global code regression. If code were broken, multiple tenants would spike simultaneously. First action: verify authoritative entitlements for that tenant and confirm tenant context resolution logs.

### How do you detect a hot partition in your tenant-partitioned Dynamo model without scanning data?
**Answer:**  
Use **CloudWatch DynamoDB metrics** (ConsumedRead/WriteCapacityUnits, ThrottledRequests) broken down by table/index, and correlate with application logs showing throttling exceptions. Then use log analysis to identify which **tenantId / access pattern** dominates throttled requests (Query/Get only). Hot partitions show up as throttling under bursty access to the same partition key—no Scan required.