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