# SIC API Contracts

This folder contains API and cross-layer contract documentation.

These docs describe behavior that callers, handlers, frontend clients, domain code, tests, or operators may rely on. They should not change accidentally.

## What Belongs Here

- Public API contracts.
- Cross-layer request/response contracts.
- Platform error contracts.
- Internal generation-context contracts that shape frontend/backend behavior.

## What Should Not Go Here

- Product brainstorming.
- Runtime source code.
- Runbooks.
- Historical progress notes.
- New API behavior that has not been implemented or approved.

## Major Contracts

- `session-builder-v1-contract.md`
- `session-pack-contract-v2.md`
- `team-layer-v1-contract.md`
- `methodology-v1-contract.md`
- `generation-context-v1-contract.md`
- `resolved-generation-context-v1-contract.md`
- `session-feedback-v1-contract.md`
- `platform-error-contract.md`

Other contract/reference docs in this folder include:

- `athletes.md`
- `chat-contract-v1.md`
- `diagram-rendering-contract-v1.md`
- `error-handling.md`
- `team-attendance-v1-contract.md`
- `team-weekly-planning-v1-contract.md`

## Change Rules

- Public API contract changes may require an ADR or explicit architecture decision.
- Do not widen tenant input contracts without architecture approval.
- Do not add `tenant_id`, `tenantId`, or `x-tenant-id` as accepted client input.
- Keep contract docs aligned with handlers, frontend clients, tests, and source-of-truth architecture docs.
- If a contract is future-only, label it clearly.

## Related Source-Of-Truth Docs

- `../architecture/foundations/source-of-truth-manifest.md`
- `../architecture/platform-constitution.md`
- `../architecture/tenant-claim-contract.md`

