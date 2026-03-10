# One tenant becomes huge (100k athletes). What breaks first? What do you do?

**What breaks first:** “List athletes” endpoints may become expensive or slow if you:

- request huge pages
- sort/filter in app code
- need complex queries not supported by keys

**What we do:**

- Enforce strict `limit` (e.g., 25–50)
- Use pagination always
- Consider access-pattern-driven indexes only when needed (GSI for “by team”)
- Watch for hot partitions: if one tenant dominates traffic, a single partition key can get throttled.

**Hot partition mitigation options (only if required):**

- Add a controlled “bucket” shard in the PK: `TENANT#t123#BKT#03` (requires planned write/read strategy)
- Or create a purpose-built GSI for read-heavy patterns
- Or cache read-mostly lists (not today)

Today’s v1 is fine with `PK=TENANT#id` + pagination, but we monitor.

---

# Need “list athletes by team.” Do you add a GSI? What key? Cost?

Yes, likely a GSI if “team” is a frequent query and you can’t encode it into the base SK without breaking other patterns.

**Example:**

- `GSI1PK: TENANT#<tenantId>#TEAM#<teamId>`
- `GSI1SK: ATHLETE#<athleteId>` (or `NAME#...` if you need sorting)

Then query:

- `GSI1PK = TENANT#t123#TEAM#blue`

**Cost/tradeoffs:**

- GSIs increase write cost (each write also writes the index)
- More storage
- More complexity (you must ensure attributes required for GSI are present)

**Rule:** No GSI unless an access pattern demands it. “By team” is a legit demand; we add it when we actually build that feature.

---

# How do you prevent an engineer from accidentally writing a scan later?

You need three layers:

### (a) Code-level guardrail

- Repository module does not export `scan` helpers.
- Provide only `queryTenantEntities()` and `getByKey()`.

### (b) CI/static check

- Simple grep rule in CI: fail build if `ScanCommand` appears in `services/api` (or wherever handlers live), except in approved admin tooling.

### (c) Observability

- Log/metric any DynamoDB scan usage (if it ever happens) and alarm.

This is “process + enforcement,” not “hope.”

---

# Where do you enforce tier-based capability without weakening tenant isolation?

- **Tenant isolation:** enforced in `buildTenantContext(event)` + PK design (data-layer)

- **Tier/role capabilities:** enforced in the service layer as explicit checks:
  - Example: free tier can list athletes but cannot create more than N
  - coach role can create sessions; athlete role cannot

**Key idea:**

- Tier checks must never change how `tenantId` is derived.
- Tier checks decide allow/deny actions after tenant context is built, before calling repository.

Comprehension (short answers)

# Why is “tenant id from request body” catastrophic even with Cognito auth?
Because any logged-in user could pretend to be another club by sending a different `tenantId` in the body. Cognito proves **this is a real user**, but it does not prove **this user belongs to that tenant** unless we derive tenant from verified entitlements. If we accept tenant from the client, we’ve basically handed them the keys to other clubs’ data.

# Why is Query mandatory and Scan unacceptable for multi-tenant DynamoDB?

  **Query** uses the partition key (PK) so we only ever read records for one tenant (one club) by construction.

  **Scan** reads across the whole table (all clubs) and then filters. That’s both:

  - a security risk (easy to accidentally leak data), and

  - a cost/performance disaster as the table grows (you pay to read everything).

## What fails if we skip idempotent create and a mobile client retries after a timeout?
You get duplicate athletes. The user taps “Save” once, the app times out, retries automatically, and now you created two records. Later you’re stuck with messy cleanup, inconsistent stats, and angry users (“Why do I see John twice?”).

## Where must validation live, and what must the repository assume?

  - Validation must live at the handler/API edge (before data access): required fields, sizes, types, headers like Idempotency-Key, etc.

  - The repository must assume inputs are already validated and tenant-safe. It should still enforce tenant scoping by construction (PK includes tenant), but it shouldn’t be figuring out “is this payload valid.”

## If a tenant has 2M athletes, what breaks first in your current Query + pagination approach?
Not “security,” but **performance/UX and hot partitions**:

- Listing **2M** items means the client might try to page “forever”; it becomes **slow and expensive** over time.
- One very active tenant can become a **hot partition** if most traffic hits the same partition key:  
  `PK = TENANT#bigTenant`  
  DynamoDB can **throttle** that partition under heavy load.

**Mitigations (future):**
- Add alternate access patterns (search by prefix, by team, by status).
- Shard keys for very large tenants (e.g., `PK = TENANT#id#SHARD#n`).
- Use **GSI(s)** for different query needs.

---

## How to prevent a malicious user forging `nextToken` to read another tenant’s data?
Two layers:

- **Primary:** tenant isolation is enforced by the **partition key**. Even if they forge a token, our Query always uses:  
  `PK = TENANT#<theirTenantId>`  
  derived from **entitlements**, not from the token. So they can’t cross tenants.
- **Extra hardening:** make `nextToken` **tamper-evident**:
  - Sign it (HMAC) or encrypt it.
  - Include `tenantId` inside it and verify it matches the entitlements-derived `tenantId`.

---

## Plan if `TransactWriteItems` throttles during peak usage?
- Retry with **exponential backoff + jitter** on throttling errors (preferably server-side).
- Keep transactions minimal (we’re only writing **2 items**, good).
- If peak load persists:
  - Consider **partitioning** (reduce hot key pressure),
  - Or a more scalable **idempotency store** design (still tenant-scoped),
  - Or accept-write + async confirmation (only if business allows; usually not for CRUD basics).

---

## Mandatory log fields for triaging a 500 in < 3 minutes
At minimum, every request log line should include:

- `requestId` (API Gateway / Lambda request id)
- `route` / `operation` (e.g., `POST /athletes`, `op=create_athlete`)
- `statusCode`
- `code` (deterministic error code, e.g., `missing_domain_table`, `invalid_request`)
- `tenantId`
- `userId` (`sub`)
- `errorName` / `errorMessage` (sanitized)
- `latencyMs`
- *(nice-to-have)* `idempotencyKey` (hashed or partially redacted), `athleteId`

This set lets on-call answer: **who**, **which tenant**, **what endpoint**, **what failed**, **where to find the trace**, and whether it’s **config vs code vs data**.