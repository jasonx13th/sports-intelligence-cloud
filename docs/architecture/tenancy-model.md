# SIC Tenancy Data Model (DynamoDB)

## Purpose
Define the DynamoDB key design and access patterns that enforce **tenant isolation by construction** for SIC.

This document is the source of truth for:
- Key schema (PK/SK)
- Item shapes (what gets stored)
- Allowed access patterns (Query/Get/Put, no Scan)
- Pagination and idempotency contracts

---

## Non-negotiable rules
- Tenant identity is derived from **verified auth context + entitlements**, never client input.
- **Never** accept `tenantId` from request body, query params, or headers.
- No scan-then-filter for tenant isolation.
- All data access must be tenant-scoped by **key construction** (PK includes tenant).
- Prefer **Query** over Scan, always.

---

## Entities (v1)
- ATHLETE
- GROUP (aka team/age group) *(planned)*
- EQUIPMENT *(optional / planned)*

---

## Tables

### Tenant Entitlements Table
- Logical purpose: authoritative mapping from user (`sub`) → `{ tenant_id, role, tier }`
- Key schema:
  - PK: `user_sub`
- Used by: `buildTenantContext(event)`
- Env var:
  - `TENANT_ENTITLEMENTS_TABLE`

### SIC Domain Table (Tenant-Owned Entities)
- Table name: `sic-domain-<env>` (e.g., `sic-domain-dev`)
- Primary key: `(PK, SK)`
- Env var:
  - `SIC_DOMAIN_TABLE`

---

## Environment configuration

### Required environment variables
- `TENANT_ENTITLEMENTS_TABLE`
  - DynamoDB table used by `buildTenantContext(event)` to fetch authoritative `{ tenant_id, role, tier }` keyed by `user_sub`.
- `SIC_DOMAIN_TABLE`
  - DynamoDB table for tenant-owned domain entities (ATHLETE, GROUP, EQUIP, etc.).
  - If not configured, handlers must fail closed with:
    - `misconfig_missing_env` (HTTP 500)

---

## Key schema

### Tenant partition
All tenant-owned entities live under a tenant partition:

- `PK = TENANT#<tenantId>`

### Entity sort keys
- Athlete:
  - `SK = ATHLETE#<athleteId>`
- Group:
  - `SK = GROUP#<groupId>` *(planned)*
- Equipment:
  - `SK = EQUIP#<equipId>` *(planned)*
- Idempotency records:
  - `SK = IDEMPOTENCY#<idempotencyKey>`

---

## Item shapes (v1)

### Athlete item
Stored as a single item per athlete.

- PK: `TENANT#<tenantId>`
- SK: `ATHLETE#<athleteId>`
- Attributes:
  - `type = "ATHLETE"`
  - `athleteId` (UUID)
  - `displayName` (string)
  - `createdAt` (ISO timestamp)
  - `updatedAt` (ISO timestamp)

### Idempotency record (create athlete)
Used to make create operations retry-safe.

- PK: `TENANT#<tenantId>`
- SK: `IDEMPOTENCY#<idempotencyKey>`
- Attributes:
  - `type = "IDEMPOTENCY"`
  - `entity = "ATHLETE"`
  - `athleteId` (points to the created athlete)
  - `createdAt` (ISO timestamp)

---

## Access patterns (v1)

### AP1: Create athlete (idempotent)
- Operation: create athlete
- DynamoDB: **TransactWriteItems** (Option A)
  1) Put idempotency record with conditional create:
     - `PK = TENANT#<tenantId>`
     - `SK = IDEMPOTENCY#<idempotencyKey>`
     - Condition: record must not already exist
  2) Put athlete item:
     - `PK = TENANT#<tenantId>`
     - `SK = ATHLETE#<athleteId>`

### AP2: Get athlete by id *(planned next)*
- GetItem
- Keys:
  - `PK = TENANT#<tenantId>`
  - `SK = ATHLETE#<athleteId>`

### AP3: List athletes for tenant (paginated)
- Query:
  - `PK = TENANT#<tenantId>`
  - `begins_with(SK, "ATHLETE#")`
- Returns clean JSON objects (does not expose PK/SK):
  - `{ athleteId, displayName, createdAt, updatedAt }`

---

## Pagination contract
- API returns:
  - `{ items: [], nextToken?: string }`
- `nextToken` is:
  - `base64(json(LastEvaluatedKey))`
- invalid `nextToken`:
  - HTTP `400`
  - error code: `invalid_next_token`

---

## Idempotency contract (v1)
- Create requires `Idempotency-Key` header.
- First create (new key):
  - HTTP **201**
  - `{ replayed: false, athlete: {...} }`
- Replay (same key):
  - HTTP **200**
  - `{ replayed: true, athlete: {...} }`
  - Must return the **same `athleteId`** as the first create.

Notes:
- Idempotency is **tenant-scoped** by construction (PK includes tenantId).
- If the transaction is canceled for reasons other than the idempotency conditional failure, the system must return a deterministic server error (do not mask real failures as replays).

---

## Future access patterns (not implemented yet)
- List athletes by group/team (likely requires a GSI)
- Search athletes by name (likely requires search service, not DynamoDB)
- Time-bucket or sharded partition strategy for extremely large tenants (hot partition mitigation)

---