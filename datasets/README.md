# SIC Datasets And Schemas

This folder contains checked-in machine-readable schemas and dataset-related reference assets.

## Important Folders

- `schemas/exports/v1/`
  - Export schemas for domain export records.

Current schemas include:

- `club.schema.json`
- `membership.schema.json`
- `session.schema.json`
- `team.schema.json`

## What Belongs Here

- Source-controlled schemas.
- Small reference files needed by CI, tests, docs, or export validation.

## What Should Not Go Here

- Runtime data dumps.
- Private data.
- Customer, club, athlete, or tenant data.
- Large generated artifacts.

## Change Rules

- CI may depend on checked schemas, so do not move them without updating workflows and docs.
- Schema changes should be reviewed for downstream export and lake compatibility.
- Keep sensitive or real tenant data out of this folder.

