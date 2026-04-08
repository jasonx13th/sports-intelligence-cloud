# Week 13 Day 1 — Template Model Lock

## Decision
Use a new tenant-scoped template item family in the existing domain table.

## Keys
- PK = TENANT#<tenantId>
- template item SK = TEMPLATE#<createdAtIso>#<templateId>
- template lookup SK = TEMPLATELOOKUP#<templateId>

## Why
This matches the existing session pattern:
- newest-first tenant-scoped list by SK prefix
- get-by-id without scan
- no request-derived tenant identity
- no new GSI required for Week 13 v1

## Minimal template item shape
- PK
- SK
- type = TEMPLATE
- templateId
- createdAt
- updatedAt
- createdBy
- schemaVersion = 1
- name
- description optional
- sport
- ageBand
- durationMin
- objectiveTags[]
- tags[]
- equipment[]
- activities[]
- sourceSessionId optional
- usageCount optional
- lastGeneratedAt optional

## Minimal template lookup item shape
- PK
- SK = TEMPLATELOOKUP#<templateId>
- type = TEMPLATE_LOOKUP
- templateId
- createdAt
- targetPK
- targetSK

## Week 13 v1 rules
- tags are metadata only, not a separate entity
- no tag GSI in v1
- no scan-then-filter
- repository methods must require tenantContext
- template generate must load by templateId through lookup
- tenant scope remains derived only from verified auth + entitlements

## Deferred
- tag filtering
- template detail endpoint
- shared club library behavior beyond current tenant boundary
- cross-tenant search
