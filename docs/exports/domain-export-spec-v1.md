# SIC Domain Export Spec (v1)

**Status:** v1.0 (draft, intended stable)
**Purpose:** Define a stable, versioned, lake-ready export contract for SIC domain entities.

This spec is an explicit data contract. It must remain backward compatible within major version `v1`.
Tenant isolation is non-negotiable: tenant scope is derived only from verified auth context + entitlements,
and storage layout must preserve tenant boundaries at the prefix/partition level.

---

## 1. Design goals

- **Stable contracts:** predictable schemas for downstream analytics/ML.
- **Lake-ready layout:** tenant-partitioned prefixes suitable for Glue/Athena/ETL.
- **Safe evolution:** explicit compatibility rules; avoid breaking consumers silently.
- **Tenant safety by construction:** exports must never be scoped by client-provided tenant identifiers.

---

## 2. Export record model

Exports are produced as a stream of **records**. Each record has:
- a required **envelope** (common metadata)
- an entity-specific **payload**

### 2.1 Envelope (required for every record)

| Field                 | Type               | Required  | Notes                         |
|---                    |---:                |---:       |---                            |
| `schema_name`         | string             | ✅       | `session`, `club`, `team`, `membership` |
| `schema_version`      | string             | ✅       | Semantic-ish: `1.0`, `1.1` (minor must be backward compatible) |
| `exported_at`         | string (date-time) | ✅       | UTC ISO8601 |
| `export_run_id`       | string             | ✅       | UUID for a single export run |
| `tenant_id`           | string             | ✅       | Included for analytics joins; **must be derived server-side** (never accepted from request body/query/headers) |
| `entity_id`           | string             | ✅       | Stable identifier for the entity record |
| `operation`           | string             | ✅       | `upsert` or `delete` |
| `source_system`       | string             | ✅       | `sic` (reserved for future multi-source) |

### 2.2 Payload (entity-specific)

Each schema defines a `payload` object with entity fields.

If `operation = "delete"`, payload may be empty `{}` but the envelope must still be present.

---

## 3. Entities in v1

v1.0 covers these core entities:
- `session`
- `club`
- `team`
- `membership`

---

## 4. Storage layout (lake-ready)

The export writer must emit data to S3 under a tenant-safe prefix:

```
s3://<EXPORT_BUCKET>/exports/domain/<schema_name>/v=1/tenant_id=<TENANT_ID>/export_date=YYYY-MM-DD/<files>
```

Notes:
- `tenant_id` is a partition boundary (critical for isolation + query pruning).
- `export_date` is a partition boundary for incremental processing.

---

## 5. Compatibility / evolution policy

### 5.1 Minor versions (1.x) — backward compatible only

Allowed:
- Add **optional** fields
- Add new schemas (new entity types)
- Add new enum values **only if** consumers treat unknown values as "other/unknown"

Not allowed:
- Rename fields
- Remove fields
- Change field types
- Change field meaning/units
- Change required/optional status from optional → required

### 5.2 Major versions (2.0+) — breaking changes

Allowed:
- Any changes, including renames/type changes/removals

Required process:
- Introduce a new major path `v=2`
- Run **dual publish** for a defined migration window
- Document migration notes and consumer guidance

---

## 6. Examples (envelope + payload)

### 6.1 Session (upsert)

```json
{
  "schema_name": "session",
  "schema_version": "1.0",
  "exported_at": "2026-03-29T19:05:00Z",
  "export_run_id": "2c4f3a55-1b7c-4b5c-9c2d-3c1f6b58d6aa",
  "tenant_id": "ORG#999",
  "entity_id": "sess_01HXYZ123",
  "operation": "upsert",
  "source_system": "sic",
  "payload": {
    "session_id": "sess_01HXYZ123",
    "title": "Passing under pressure",
    "start_time": "2026-03-28T22:00:00Z",
    "duration_minutes": 75,
    "team_id": "team_01HAAA",
    "created_by": "userSub_abc123",
    "updated_at": "2026-03-28T23:00:00Z"
  }
}
```

### 6.2 Membership (upsert)

```json
{
  "schema_name": "membership",
  "schema_version": "1.0",
  "exported_at": "2026-03-29T19:05:00Z",
  "export_run_id": "2c4f3a55-1b7c-4b5c-9c2d-3c1f6b58d6aa",
  "tenant_id": "ORG#999",
  "entity_id": "userSub_abc123",
  "operation": "upsert",
  "source_system": "sic",
  "payload": {
    "user_sub": "userSub_abc123",
    "role": "admin",
    "status": "active",
    "created_at": "2026-03-28T22:10:00Z",
    "updated_at": "2026-03-28T22:10:00Z"
  }
}
```

---

## 7. Tenancy & security notes

- Export writers must build `tenantCtx` from verified auth context + entitlements.
- Export writers must not accept `tenant_id`, `tenantId`, or `x-tenant-id` in request body/query/headers.
- All data access must be tenant-scoped by construction (no scan-then-filter).

---

## 8. Consumer rules (normative)

Consumers of v1 exports MUST:
- Treat unknown fields as ignorable (forward-compatible parsing).
- Treat missing optional fields as acceptable (backward-compatible parsing).
- Use `schema_name` + `schema_version` to select parsing logic.
- Treat `tenant_id` as a partition/join key only; **tenant authority remains server-controlled** and is not derived from export contents.

## 9. Compatibility checklist (for contributors)

Before shipping any change to a v1 schema:
- [ ] Additive change only (new field is optional)
- [ ] No renames, removals, or type changes
- [ ] No semantics/unit changes
- [ ] Examples updated (if needed)
- [ ] If breaking: bump major version and dual-publish under new `v=2` path
- [ ] Tenant safety preserved: export scope comes from `tenantCtx` only (no client-supplied tenant identifiers)
---
