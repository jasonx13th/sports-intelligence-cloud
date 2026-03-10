# 1) One tenant becomes huge (100k athletes). What breaks first? What do you do?

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

# 2) Need “list athletes by team.” Do you add a GSI? What key? Cost?

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

# 3) How do you prevent an engineer from accidentally writing a scan later?

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

# 4) Where do you enforce tier-based capability without weakening tenant isolation?

- **Tenant isolation:** enforced in `buildTenantContext(event)` + PK design (data-layer)

- **Tier/role capabilities:** enforced in the service layer as explicit checks:
  - Example: free tier can list athletes but cannot create more than N
  - coach role can create sessions; athlete role cannot

**Key idea:**

- Tier checks must never change how `tenantId` is derived.
- Tier checks decide allow/deny actions after tenant context is built, before calling repository.