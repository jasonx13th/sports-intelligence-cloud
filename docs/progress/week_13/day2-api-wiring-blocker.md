# Week 13 Day 2 — API Wiring Blocker

## Status
Application code for template reuse is complete and locally verified, but API deployment is blocked.

## What is ready
- template repository
- template validators
- template pipeline
- templates handler
- saved session metadata support for tags and sourceTemplateId
- local tests passing for template + session reuse paths

## Blocker
`infra/cdk/lib/sic-api-stack.ts` contains previously committed but not yet deployed infrastructure beyond Week 13 scope.

Observed in `cdk diff SicApiStack-Dev`:
- templates routes and lambda
- memberships lambda/routes
- exports domain lambda/routes
- domain export bucket
- lake bucket
- lake ingest lambda
- Glue crawler/job
- extra alarms and log metric filters

## Decision
Do not deploy `SicApiStack-Dev` as part of Week 13 Day 2 until broader infra release scope is explicitly approved.

## Why
Deploying now would ship unrelated infra, not just `/templates`.

## Safe next path
- keep Week 13 app code committed
- defer API stack deployment
- optionally update Postman/docs to reflect the intended contract
- return later with an explicit broader infra approval gate
