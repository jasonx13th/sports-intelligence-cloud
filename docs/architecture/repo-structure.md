# SIC Repo Structure

This document is the current source of truth for how code should be organized in the Sports Intelligence Cloud repository.

It exists to keep implementation clean, help AI coding tools place files correctly, and prevent the repo from drifting back into a generic utility dump.

## Purpose

SIC is a multi-tenant, serverless sports platform on AWS.

The repo should reflect the current product and architecture priorities:

- Session Builder implementation
- coach and team workflows
- multi-tenant platform safety
- observability and reliability
- low-cost, product-first delivery
- clear documentation for ongoing development

## Core Structure Rule

Use this separation consistently:

- `src/platform` for shared cross-cutting platform code
- `src/domains/<domain>` for domain-owned business logic
- top-level route folders for Lambda handlers only

Do not create new `_lib` folders for shared logic.

## Current API Structure

`services/club-vivo/api/`

### Handler folders
These folders contain Lambda handlers and route-level entrypoints:

- `athletes/`
- `clubs/`
- `exports-domain/`
- `lake-etl/`
- `lake-ingest/`
- `me/`
- `memberships/`
- `session-packs/`
- `sessions/`
- `teams/`

Handlers should stay thin. They should orchestrate request flow, call platform utilities, call domain logic, and return HTTP responses.

### Platform code
Shared cross-cutting code lives in:

- `src/platform/errors/`
- `src/platform/http/`
- `src/platform/logging/`
- `src/platform/tenancy/`
- `src/platform/validation/`

Put code here only if it is truly shared across multiple domains or routes.

Examples:
- tenant context building
- request parsing
- shared validation helpers
- platform error types
- structured logging
- HTTP middleware/wrappers

### Domain code
Business logic belongs under:

- `src/domains/athletes/`
- `src/domains/clubs/`
- `src/domains/memberships/`
- `src/domains/session-builder/`
- `src/domains/sessions/`
- `src/domains/teams/`

Use domain folders for logic that belongs to a specific product capability or business entity.

Examples:
- repositories
- domain validation
- generation pipelines
- templates
- domain-specific export helpers
- PDF/session helpers tied to one domain

## Domain Placement Rules

### `src/domains/session-builder`
Put logic here when it belongs to session generation or session-pack creation.

Examples:
- session builder pipeline
- session validation
- session-pack validation
- session-pack templates
- diagram spec validation

### `src/domains/sessions`
Put logic here when it belongs to persisted sessions and session output workflows.

Examples:
- session repository
- session PDF generation
- session PDF storage helpers
- future session export helpers
- future session feedback logic

### `src/domains/athletes`
Put athlete-specific data access and business logic here.

### `src/domains/clubs`
Put club-specific data access and business logic here.

### `src/domains/memberships`
Put membership-specific data access and business logic here.

### `src/domains/teams`
Put team-specific data access and business logic here.

## Specialized Workflow Folders

Some top-level folders are workflow-specific and should remain separate from generic domain folders:

- `exports-domain/` for export endpoint handlers and export workflows
- `lake-ingest/` for ingest pipeline handlers
- `lake-etl/` for ETL handlers/jobs

Keep these focused on their operational workflow.

## Test Placement

Prefer tests close to the module they cover.

Examples:
- `src/platform/http/with-platform.test.js`
- `src/domains/session-builder/session-validate.test.js`
- `src/domains/sessions/session-repository.test.js`

Handler tests may remain next to handlers where that is already the repo pattern.

## Import Direction Rules

Keep imports flowing in a clean direction:

- handlers may import from `src/platform` and `src/domains`
- domain modules may import from `src/platform`
- platform modules must not import from domain modules
- avoid domain-to-domain imports unless clearly necessary and stable

This keeps the architecture understandable and reduces circular drift.

## Tenancy and Safety Rules

Repo structure must support SIC’s multi-tenant model.

That means:

- tenant context comes from verified auth and entitlements
- never accept tenant identity from request body, query, or headers
- data access must remain tenant-scoped by construction
- do not introduce scan-then-filter tenancy patterns
- keep fail-closed behavior intact during refactors

## What Not To Do

Do not:

- create a new generic `_lib` dumping ground
- place business logic inside handlers
- place domain-specific code inside `src/platform`
- move long-term idea placeholders into active product paths without implementation value
- mix scratch files or local export folders into the tracked repo

## How To Place New Code

Use this decision rule:

1. Is it shared across multiple domains and truly cross-cutting?
   - put it in `src/platform`

2. Does it belong to one business capability or entity?
   - put it in `src/domains/<domain>`

3. Is it the Lambda entrypoint or route-specific orchestration?
   - keep it in the top-level handler folder

4. Is it a specialized operational workflow like exports, ingest, or ETL?
   - keep it in its dedicated workflow folder

## Examples

- new shared auth/HTTP wrapper  
  -> `src/platform/http/`

- new session builder validator  
  -> `src/domains/session-builder/`

- new session feedback repository  
  -> `src/domains/sessions/`

- new team membership rule  
  -> `src/domains/memberships/` or `src/domains/teams/` depending on ownership

- new route handler for sessions  
  -> `sessions/handler.js`

- new lake ingest processor  
  -> `lake-ingest/`

## Working Rule for AI Coding Tools

When adding files, prefer the current domain structure over creating new top-level utility folders.

Default assumption:
- platform concern -> `src/platform`
- business/domain concern -> `src/domains/<domain>`
- route entrypoint -> existing handler folder

If uncertain, choose the narrowest domain folder that fits the behavior instead of introducing a generic shared folder.

## Status

This document reflects the implemented repo structure after the repo hardening phases that moved:

- shared platform utilities into `src/platform`
- session builder domain logic into `src/domains/session-builder`
- repositories into domain folders
- session PDF helpers into `src/domains/sessions/pdf`

This file should be updated whenever the repo structure changes in a meaningful way.
