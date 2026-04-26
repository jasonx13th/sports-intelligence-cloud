# SIC Apps

This folder contains user-facing application surfaces for Sports Intelligence Cloud.

## Active App

- `club-vivo/`
  - Active Next.js coach-facing web app and current product surface.

## What Belongs Here

- User-facing app source.
- App-specific components, routes, client helpers, and frontend package config.
- App-local README files that explain how to run and validate the app.

## What Should Not Go Here

- Backend Lambda handlers.
- CDK infrastructure source.
- API contracts.
- Product planning docs that belong under `docs/product/`.

Future SIC-wide product concepts live under `docs/product/future/`, not under `apps/`, until implementation starts.

## Change Rules

- Do not add new app folders without an approved product decision.
- Keep app-specific code inside the appropriate app folder.
- Do not make KSC pilot context the identity of the generic Club Vivo app.
