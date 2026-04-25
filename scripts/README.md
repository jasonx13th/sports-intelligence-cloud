# SIC Scripts

This folder contains repo utility scripts.

## Important Folders

- `smoke/`
  - Smoke-test scripts for API/runtime verification.

## What Belongs Here

- Repo-level utilities.
- Smoke scripts.
- Maintenance scripts that support validation or operations.

## What Should Not Go Here

- Runtime app code.
- Backend Lambda handler code.
- CDK stack source.
- Product or architecture docs.
- One-off local scratch scripts that are not meant to be maintained.

## Current Scripts

- `smoke/smoke.mjs`
  - Smoke-test runner used by the manual smoke workflow and local verification.

## Change Rules

- Keep scripts deterministic and documented.
- Do not store secrets in scripts.
- If a script becomes part of CI or release flow, document its inputs and expected outputs.

