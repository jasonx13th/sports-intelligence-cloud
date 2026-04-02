# SIC Architecture Diagrams

This page provides high-level architecture diagrams for Sports Intelligence Cloud (SIC).

These diagrams reflect the current SIC direction:

- coach-first product entry
- multi-tenant serverless platform on AWS
- product-first, low-cost architecture
- future expansion toward team, club, and organization workflows

Diagrams are conceptual and intentionally avoid environment-specific identifiers.

---

## 1) Current system architecture

```text
Coach / User
  |
  v
Web App
  |
  v
Cognito (authentication)
  |
  v
API Gateway
  |
  v
Lambda Services
  |
  +--> DynamoDB (tenant-scoped domain data + entitlements)
  |
  +--> S3 (tenant-scoped exports)
  |
  +--> CloudWatch (logs, metrics, alarms)
  |
  +--> Bedrock (optional, limited AI-assisted generation)
```

**Key idea:** SIC currently centers on a low-cost, multi-tenant, serverless architecture that supports the Session Builder and future coach workflows.

---

## 2) Session Builder request flow

```text
Coach / Client
  |
  v
Send authenticated request
  |
  v
API Gateway + verified auth context
  |
  v
Lambda handler builds tenantContext from verified claims + entitlements
  |
  +--> POST /session-packs
  |      |
  |      v
  |    session-packs handler
  |      |
  |      v
  |    session-builder-pipeline
  |      |
  |      +--> normalize input
  |      +--> generate pack from templates
  |      +--> validate generated pack
  |      |
  |      v
  |    Return validated pack
  |
  +--> POST /sessions
  |      |
  |      v
  |    sessions handler
  |      |
  |      +--> validate request
  |      +--> persist stage
  |      |
  |      v
  |    Session repository
  |      |
  |      v
  |    DynamoDB (tenant-scoped session data)
  |      |
  |      v
  |    Return persisted session
  |
  +--> GET /sessions/{sessionId}/pdf
         |
         v
       sessions handler
         |
         +--> tenant-scoped session read
         +--> export stage
         |
         v
       Session repository --> DynamoDB
         |
         v
       PDF helpers --> S3 tenant-scoped PDF object
         |
         v
       Return presigned PDF URL
```

**Key idea:** Week 11 uses explicit internal stages for generate, persist, and export while keeping tenant scope server-derived and all data access tenant-scoped by construction.

---

## 3) Tenant context construction

```text
Cognito verifies user authentication
  |
  v
JWT claims received by API Gateway / Lambda
  |
  v
Extract user identity from verified claims
  |
  v
Load entitlements by authenticated user identity
  |
  v
Build tenantContext = { tenantId, role, tier, userId, requestId }
  |
  v
Handlers and repositories require tenantContext
```

**Key idea:** authoritative tenant scope comes from verified auth plus entitlements, never from client input.

---

## 4) Enforcement points

- **Authentication:** Cognito verifies the user identity
- **Authorization:** Lambda builds tenant context from verified claims and entitlements
- **Application logic:** handlers require tenant context before business logic runs
- **Data access:** repositories query tenant-scoped records by construction
- **Storage:** S3 object paths are tenant-scoped
- **Tiering:** capabilities may vary by tier, but tenant boundaries never change

---

## 5) Current product data flow

```text
Session Builder
  |
  +--> Session input
  +--> Session generation
  +--> Session validation
  +--> Session persistence
  +--> Session export
  +--> Coach feedback signals
```

Stored outputs may include:

- session records
- session templates
- export artifacts
- team assignment records later
- attendance later
- feedback events for future intelligence features

**Key idea:** SIC is building structured product workflows first, then layering intelligence on top of real usage.

---

## 6) Future expansion path

```text
Session Builder
  |
  v
Coach Workspace
  |
  v
Team Layer
  |
  v
Club Layer
  |
  v
Sports Organization OS foundations
  |
  v
Intelligence features based on real workflows and real data
```

**Key idea:** SIC is intentionally evolving through thin vertical slices, not building full analytics or ML platform depth upfront.

---

## Related docs

- Vision: `docs/vision.md`
- Platform constitution: `docs/architecture/platform-constitution.md`
- Architecture principles: `docs/architecture/Architecture-Principles.md`
- Tenant identity and claims: `docs/architecture/tenant-claim-contract.md`
- Product spec: `docs/product/SIC-session-builder.md`
- Active roadmap: `docs/progress/Build-Progress/roadmap-vnext.md`
