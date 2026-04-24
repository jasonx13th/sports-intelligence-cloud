# Methodology Source Mode Planning

## Status

Planning / future product decision.

This note describes a future methodology and source-mode model. It does not implement document upload, source switching, RAG, or admin configuration.

## Current State

The Methodology page is currently a text-based guidance area with draft and published states.

Current product behavior:

- coaches can read published methodology guidance
- admin / coaching-admin users can manage methodology text
- draft and published text are the current persistence model
- generation influence exists only in a limited form and should not be overclaimed

In the current product, methodology is not yet a full document library, source-mode system, or tenant-configurable knowledge pipeline.

## Future Model

The club methodology / knowledge area could eventually include:

- club philosophy
- mission
- teaching methodology
- playing style
- curriculum
- uploaded documents
- admin notes
- age-band or program-specific guidance
- other club guidance that can help generation

Admins could choose which knowledge sources generation may use.

Future source modes:

- `SIC only`
  - use the private SIC platform repository and general training knowledge
- `Club only`
  - use only published / approved club methodology
- `SIC + Club`
  - combine the private SIC platform repository with club-specific methodology

The SIC internal repository remains private. It should never be exposed to tenants, clubs, or coaches as raw content.

## Tags / Visibility Idea

Generated sessions may eventually show simple source indicators, such as:

- `SIC`
- `KSC`
- `SIC + KSC`

These tags would explain the selected generation mode at a high level. They would not expose raw SIC repository content.

## Guardrails

Any future implementation should preserve:

- tenant isolation
- no client-supplied `tenant_id`
- no client-supplied `tenantId`
- no client-supplied `x-tenant-id`
- admin-only methodology management
- regular coach read-only access to published guidance
- server-owned source-mode configuration
- no overclaiming when no published methodology exists
- no exposure of SIC internal repository data as raw club-facing content
- clear fallback behavior when club methodology is missing, unpublished, or incomplete

## Not In Current Scope

This planning item does not add:

- document upload
- document deletion
- vector / RAG ingestion
- source-mode switch implementation
- admin console for source configuration
- raw SIC repository browsing
- generated-session source tags
- production methodology document management

## Future Implementation Phases

Possible future phases:

1. Clarify product policy
   - define who can manage methodology
   - define coach read-only behavior
   - define source-mode defaults per tenant

2. Expand methodology records
   - support document metadata
   - define retention and deletion behavior
   - keep tenant-derived storage and access paths

3. Add admin document management
   - upload
   - review
   - publish / unpublish
   - delete

4. Add ingestion and retrieval
   - parse approved documents
   - chunk and index tenant-scoped content
   - keep retrieval server-owned

5. Add source-mode configuration
   - SIC only
   - Club only
   - SIC + Club
   - server-owned configuration, not client-provided

6. Add generation visibility
   - simple source tags
   - no raw SIC repository exposure
   - clear fallback messaging when methodology is unavailable
