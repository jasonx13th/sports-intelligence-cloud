# SIC Tenancy Data Model (DynamoDB)

## Purpose
Define the DynamoDB key design and access patterns that enforce tenant isolation by construction.

## Non-negotiable rules
- Tenant identity is derived from verified auth context + entitlements, never client input.
- No scan-then-filter for tenant isolation.
- All data access must be tenant-scoped by key construction.

## Entities (v1)
- ATHLETE
- GROUP (aka team/age group)
- EQUIPMENT (optional v1)

## Table
- Table name: [TBD / from stack outputs]
- Primary key: (PK, SK)

## Key schema
### Tenant partition
- PK = `TENANT#<tenantId>`

### Entity sort keys
- Athlete: SK = `ATHLETE#<athleteId>`
- Group:   SK = `GROUP#<groupId>`
- Equipment: SK = `EQUIP#<equipId>`

## Access patterns (v1)
### AP1: Create/Update athlete
- PutItem / UpdateItem
- Keys: PK = TENANT#<tenantId>, SK = ATHLETE#<athleteId>

### AP2: Get athlete by id
- GetItem
- Keys: PK = TENANT#<tenantId>, SK = ATHLETE#<athleteId>

### AP3: List athletes for tenant (paginated)
- Query: PK = TENANT#<tenantId> AND begins_with(SK, "ATHLETE#")
- Pagination: return `nextToken` derived from DynamoDB `LastEvaluatedKey`

## Pagination contract
- API returns: { items: [], nextToken?: string }
- nextToken is base64(json(LastEvaluatedKey))
- invalid nextToken => 400 invalid_next_token

## Future access patterns (not implemented yet)
- List athletes by group/team (likely requires a GSI)
- Search athletes by name (likely requires search service, not DynamoDB)