# SIC Coach Chatbot — Product & Architecture Specification (High-Level)

**Status:** Living document (Knowledge + design brief)
**Primary goal:** Make the SIC platform immediately useful to coaches by generating training sessions tailored to real-world constraints, while collecting structured signals to power SIC’s long-term intelligence.

---

## 1) Executive Summary

SIC’s intro product is a **Coach Training Session Chatbot** that converts a coach’s **environment + constraints** into a **ready-to-run session pack** (and optionally a PDF).
Even though it feels like “a chatbot per organization,” SIC should implement **one chatbot platform capability** with **tenant-scoped configuration + tenant-scoped knowledge**, so every organization experiences a “unique bot” without separate deployments.

**Wedge message:**
> “Tell us what you have today (players, space, cones, balls, time, goal). We’ll design a session you can run now.”

---

## 2) Target Users & Use Cases

### Target users
- Grassroots youth coaches (primary)
- Club/academy coaches and assistants
- School teams and municipal programs
- Performance staff (later)

### Core use cases
1) **Generate a session** from constraints (players/equipment/space/time).
2) **Iterate**: “Make it easier/harder”, “switch to finishing”, “weather is bad”.
3) **Export**: printable PDF/session pack.
4) **Save**: store sessions per team/coach (tenant-scoped).
5) **Feedback loop** (later): “We ran it; here’s what worked.”

---

## 3) Inputs (Coach Environment Model)

The chatbot collects or infers (short form + chat refinement):

### Required (minimum viable)
- **Sport** (soccer/basketball/futsal/etc.)
- **Age group / level** (U8/U12/HS/adult)
- **Athletes count** (e.g., 20)
- **Time available** (e.g., 75 minutes)
- **Space** (grass/turf/indoor; full/half/small)
- **Equipment essentials** (cones, balls; optional others)
- **Session focus** (passing under pressure, pressing, finishing, speed)

### Optional / high-value
- Staff count (coaches/assistants)
- Space dimensions (meters/yards) or “small/medium/full”
- Equipment details (goals, bibs, ladders, poles, hurdles)
- Constraints (injuries, weather, shared field, limited balls)
- Team style preferences (possession/direct, intensity, etc.)

### Example prompt
> “20 U12 players, 10 cones, 5 balls, grass field, 75 minutes, focus on passing under pressure.”

---

## 4) Outputs (Session Pack Contract)

SIC should return a **deterministic, structured plan** that is easy to run, with consistent formatting.

### SessionPack (high-level schema)
- `title`
- `sport`, `ageGroup`, `level`
- `durationMinutes`
- `equipment[]`
- `space` (type + size)
- `intensity` (low/medium/high)
- `objective` (1–2 sentences)
- `activities[]` (ordered)
  - `name`
  - `minutes`
  - `setup`
  - `instructions`
  - `coachingPoints[]`
  - `progressions[]`
  - `regressions[]`
  - `commonMistakes[]` (optional)
  - `organization` (groups/rotations)
- `cooldown` (optional block)
- `safetyNotes[]`
- `successCriteria[]` (how coach knows it worked)
- `assumptions[]` (what SIC assumed if inputs missing)
- `export`
  - `pdfUrl` (short TTL) (optional)
  - `ttlSeconds`

**Quality invariants**
- Total minutes **must equal** requested duration.
- Equipment list must match the plan.
- Age-appropriate load + safety defaults (warm-up/cool-down).
- Output must be readable even without diagrams.

---

## 5) Conversation Design (Intake Flow)

### Default flow (fast)
1) Coach provides a single sentence constraints prompt.
2) Bot asks **only missing essentials** (max 3 questions).
3) Bot generates the session pack.
4) Bot offers quick edits:
   - “Harder/easier”
   - “More small-sided”
   - “Add finishing”
   - “Indoor version”
5) Coach saves + exports.

### Question set (when info missing)
- Sport?
- Age/level?
- Players count?
- Time available?
- Space type/size?
- Equipment list?
- Focus (skill/tactical/physical)?

### Fallback assumptions (transparent)
If omitted, SIC assumes:
- medium space
- cones + balls present
- standard warm-up & cool-down
- moderate intensity for youth
and lists these under `assumptions[]`.

---

## 6) Tenant Customization (How every org gets a “unique bot”)

SIC runs **one bot platform**, with these tenant-scoped customizations:

### TenantBotConfig (stored per tenant)
- `defaultSportPack` (soccer/basketball/etc.)
- `terminology` (e.g., “pinnies” vs “bibs”)
- `sessionTemplate` (format preferences)
- `safetyPolicyOverrides` (stricter youth rules, max intensity caps)
- `branding` (logo/colors for exports, later)
- `knowledgeSources` (allowed docs; tenant-scoped)

### Tenant Knowledge (RAG)
- club playbook, philosophy, drill library
- field availability and facility constraints
- equipment inventory defaults
All stored/queryable **within tenant boundary**.

---

## 7) Safety & Policy Guardrails

### Hard constraints
- Age-appropriate training load; include warm-up/cool-down defaults.
- No medical diagnosis or treatment advice.
- If injury/condition mentioned: recommend professional guidance + safe modification.
- Don’t propose drills that require equipment not available.

### Content boundaries
- No unsafe/illegal instructions.
- No personal data exposure.
- Avoid claiming guaranteed performance outcomes.

---

## 8) SIC Architecture (High-Level)

### Design principle
**One chatbot capability** in the SIC platform with:
- **Tenant-scoped auth context** → **tenant-scoped data access** → **tenant-scoped knowledge**.
- The chatbot never trusts tenant identifiers from the client.

---

## 9) Reference Architecture (Logical Components)

### A) Client / UI
- **Coach Portal** (web): login → chat/intake form → session output → save/export
- Optional: mobile later

### B) API Layer (SIC platform)
- **API Gateway** + authorizer (Cognito/JWT)
- Request enters SIC with verified identity context

### C) Core Services (domain-aligned)
- **Chat Orchestrator Service**
  - Accepts coach message + structured intake
  - Builds prompt from sport pack + tenant config + safety policy
  - Calls generation engine
  - Stores conversation/session artifacts
- **Session Pack Service**
  - Validates minutes, structure, equipment
  - Deterministic padding/normalization rules
  - Generates PDFs via export subsystem (short TTL URLs)
- **Clubs/Teams/Membership (RBAC)**
  - Determines permissions and personalization scope
  - “Who can save for a team?” etc.
- **Knowledge Service (RAG)**
  - Tenant-scoped retrieval of docs/snippets
  - Enforces per-tenant knowledge boundaries
- **Entitlements / Tenant Context**
  - Builds authoritative `tenantCtx` from verified auth + entitlements store

### D) Data Stores (tenant-scoped by construction)
- DynamoDB (single-table or domain tables) with `PK=TENANT#<tenantId>`
- S3 for exports (tenant prefix + short TTL presigned URLs)
- Optional vector store (OpenSearch/pgvector/etc.) tenant-scoped

### E) Observability
- CloudWatch logs with correlation IDs
- Metrics:
  - generation success/failure
  - latency
  - export success
  - validation failures
- Alarms on 5xx spikes; avoid noisy 4xx alerts

---

## 10) End-to-End Request Flow (Tenant-Safe)

1) Coach logs in → obtains JWT.
2) UI calls `POST /chat` or `POST /session-packs` with message + constraints.
3) Handler calls `buildTenantContext(event)`:
   - verifies identity + loads entitlements
   - derives `tenantCtx.tenantId` and role
4) Orchestrator loads `TenantBotConfig` (tenant-scoped query).
5) Knowledge Service retrieves tenant-approved snippets (tenant-scoped retrieval).
6) Generation Engine produces draft session pack.
7) Session Pack Service validates:
   - minutes sum matches duration
   - equipment feasibility
   - schema validity
8) Result stored under tenant-scoped keys and returned to UI.
9) Optional: PDF export stored at `s3://.../tenant/<tenantId>/...` and returned via short TTL URL.

**Critical rule:** Tenant scoping is never derived from request body/query/headers.

---

## 11) API Surface (Suggested)

### Chat / Orchestration
- `POST /chat` (message + optional structured constraints) → `assistantReply + sessionPack?`

### Session Packs
- `POST /session-packs` → session pack (validated)
- `GET /sessions` / `GET /sessions/{id}` (tenant-scoped)
- `GET /sessions/{id}/pdf` (short TTL presigned URL)

### Governance
- `POST /clubs`, `GET /clubs`
- `POST /teams`, `GET /teams`
- Membership endpoints (next phase)

---

## 12) Data Model (Suggested Items)

All items tenant-scoped by construction:
- `PK = TENANT#<tenantId>`

Examples:
- Club: `SK = CLUB#<tenantId>`
- Team: `SK = TEAM#<teamId>`
- Session: `SK = SESSION#<sessionId>`
- SessionPack: `SK = SESSIONPACK#<id>`
- Conversation: `SK = CONVO#<id>`
- Bot config: `SK = BOTCFG#DEFAULT`

---

## 13) Quality & Testing Strategy

### Unit tests (must-have)
- Tenant context ignores spoofed tenant inputs
- Repositories build PK/SK from tenantCtx only
- SessionPack validation: minutes sum/padding
- PDF key derivation is tenant-scoped

### Integration (later)
- End-to-end generation with mocked model responses
- Export pipeline smoke tests

---

## 14) Success Metrics (Intro Wedge)

- Activation: % of coaches generating first session
- Retention: sessions generated per coach/week
- Conversion: invites / team workspace adoption
- Quality: “ran this session” confirmations + ratings
- Safety: low rate of “unsafe content” flags

---

## 15) Roadmap Fit

The Coach Chatbot sits on SIC’s core:
- Auth + entitlements → clubs/teams/membership/RBAC → session generation → exports → analytics
It is the adoption surface that makes SIC valuable immediately while building the structured data foundation.

---

## Appendix: “Sport Packs” Concept (Template Library)
A Sport Pack is a curated set of:
- drill archetypes
- coaching language
- age constraints
- common session structures
Used as a template, not a separate bot deployment.
