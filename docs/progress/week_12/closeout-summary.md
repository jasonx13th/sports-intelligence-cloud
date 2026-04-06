# Week 12 - Closeout Summary (Web Application Foundation + Coach Lite Preview Bridge)

## Week 12 goal

Create the first coach-facing web foundation on top of the hardened Week 11 Session Builder API and extend it with a safe Coach Lite preview bridge by:

- scaffolding the frontend app in `apps/club-vivo`
- adding localhost Cognito Hosted UI authentication with PKCE
- protecting the first dashboard and sessions routes
- connecting the first web pages to the existing Session Builder endpoints
- adding a local authenticated Coach Lite preview inside Club Vivo without breaking the live Session Builder path
- documenting the current Week 12 web foundation and Coach Lite bridge decisions

## What changed

### Day 1 - frontend foundation

- created the frontend app scaffold in:
  - `apps/club-vivo`
- set up a minimal Next.js app router project with:
  - React
  - TypeScript
  - Tailwind
- added the first app routes and base styling for the Week 12 coach-facing slice

### Day 2 - auth and protected routes

- added localhost Cognito Hosted UI authentication with:
  - authorization code flow
  - PKCE
  - HttpOnly cookies
- implemented the auth route set:
  - `/login`
  - `/login/start`
  - `/callback`
  - `/logout`
- added protected route behavior for:
  - `/dashboard`
  - `/sessions`
  - `/sessions/new`
  - `/sessions/[sessionId]`
- added dashboard hydration from:
  - `GET /me`

### Day 3 - Session Builder web flow and Coach Lite preview bridge

- added the first protected sessions list page backed by:
  - `GET /sessions`
- added the first protected session detail page backed by:
  - `GET /sessions/{sessionId}`
- added the first session generation and save flow in `/sessions/new` using:
  - `POST /session-packs`
  - `POST /sessions`
- kept generate and save as separate visible actions
- added canonical frontend Coach Lite contract types in:
  - `apps/club-vivo/lib/types/session-pack.ts`
  - `apps/club-vivo/lib/types/drill-diagram-spec.ts`
- added Coach Lite presentation components in:
  - `apps/club-vivo/components/coach/SessionPackView.tsx`
  - `apps/club-vivo/components/coach/DrillDiagramView.tsx`
- aligned Coach Lite docs and contract decisions around:
  - canonical `drill-diagram-spec.v1`
  - canonical diagram types
  - `activity.instructions` as `string`
  - Coach Lite as an extension of the existing Session Builder path
- added backend internal Coach Lite validators in:
  - `services/club-vivo/api/_lib/session-pack-validate.js`
  - `services/club-vivo/api/_lib/diagram-spec-validate.js`
- extended the existing Session Builder backbone to derive and validate an internal Coach Lite draft through:
  - `services/club-vivo/api/_lib/session-pack-templates.js`
  - `services/club-vivo/api/_lib/session-builder-pipeline.js`
- preserved the public `POST /session-packs` response shape for current clients
- added a standalone authenticated local preview route at:
  - `/sessions/coach-lite-preview`
- upgraded the preview route from mock-only to real generated content using a preview-only server-side adapter that:
  - calls the existing authenticated Session Builder path
  - adapts only the first generated v1 candidate/session into `SessionPackV2`
  - keeps mock fallback when real preview generation fails
- tightened the preview bridge through small local fixes:
  - removed unsupported preview request fields when the live environment rejected them
  - improved preview-route debug output
  - made the preview adapter tolerate missing optional fields in the public v1 response

## Validation and evidence

The main Week 12 verification evidence came from focused local app validation plus targeted API checks.

### Local and API evidence

- local Postman auth worked through Cognito
- `POST /session-packs` returned `201` and preserved the current public v1 response shape
- the local Coach Lite preview route rendered with:
  - `Real Generated Preview`
- the existing Session Builder pages still loaded normally:
  - `/sessions`
  - `/sessions/new`

### Final visual and route checks

- `GET /sessions/coach-lite-preview 200`
- `GET /sessions 200`
- `GET /sessions/new 200`
- no AWS/CDK changes were required for this slice

### Repo and change-set checks

- `git status --short` returned clean
- the final commit sequence was present and coherent

### Key commits

- `dbd84ee` `feat(club-vivo): adapt real session pack preview for coach lite`
- `397d540` `feat(club-vivo): add coach lite local preview`
- `e1612c9` `feat(club-vivo-api): derive coach lite draft in session builder pipeline`
- `56942b5` `docs(coach-lite): align session pack and diagram contracts`
- `3da19a6` `feat(club-vivo-api): add coach lite draft validators`

## Why it changed

The Week 12 extension work was intentionally designed to create a real Coach Lite experience without:

- creating a second backend silo
- breaking the current Session Builder generate/save flow
- changing tenancy or auth boundaries
- forcing AWS or CDK changes too early

This kept the work aligned to SIC's product-first path:

- thin vertical slice
- real coach-facing value
- architecture-safe evolution inside the existing Session Builder backbone

## Contract and architecture decisions

- keep Coach Lite inside the existing monorepo and existing Club Vivo app surface
- keep Coach Lite aligned to Session Builder, not as a separate chatbot/backend silo
- do not create `services/club-vivo/api/coach-assistant/**`
- keep `POST /session-packs` as the existing entry path
- preserve the public `POST /session-packs` contract for current clients during this bridge phase
- derive and validate an internal Coach Lite draft inside the existing Session Builder pipeline
- use canonical Coach Lite contract decisions:
  - `drill-diagram-spec.v1`
  - `diagramType = setup | sequence | progression | regression | condition`
  - `activity.instructions` is `string`
- use a preview-only server-side adapter to show real generated content in Club Vivo before a public contract migration
- tolerate current public v1 response quirks in the preview adapter instead of forcing a backend contract change

## Tenancy and security check

- no infra, IAM, auth-boundary, tenancy-boundary, or entitlements-model changes were made in Week 12
- no new flow accepts `tenant_id`, `tenantId`, or `x-tenant-id`
- tenant scope remains server-derived from verified auth plus entitlements
- auth remained Cognito-based and intact
- the preview bridge uses the existing authenticated server-side path rather than client-trusted tenant input
- live session pages remained untouched while Coach Lite preview logic stayed isolated to `/sessions/coach-lite-preview`
- the public `POST /session-packs` contract stayed unchanged throughout the preview bridge work

## Observability and debugging notes

- a useful local-only debug path was added during preview work
- the preview route now logs enough nested error detail to identify real API rejection reasons quickly during local development
- that debug path helped isolate live-environment validation issues such as unsupported preview request fields
- the preview adapter was hardened to tolerate missing optional fields in the current public v1 response
- this improved local developer observability without changing backend contracts or adding a new observability subsystem

## Product impact

Week 12 now ends with more than just the first protected web foundation.

Club Vivo has an authenticated Coach Lite preview page that renders real generated content in the new Coach Lite UI while preserving the current Session Builder experience.

This gives SIC:

- a real product demo surface inside Club Vivo
- a safe bridge from current public v1 Session Builder responses to future Coach Lite UX
- proof that the architecture can evolve without a risky rewrite or duplicate pipeline

## Open issues and non-blockers

- Next.js still warns that the `middleware` convention is deprecated in favor of `proxy`
- real preview currently reflects the limits of the current public response, so some Coach Lite fields remain omitted or lightly derived
- real diagrams are not yet coming from backend-generated data in this bridge
- preview fields such as equipment, space, and intensity may remain partial until a stronger preview or public contract exists
- the preview route is intentionally isolated and not yet linked into the live session pages

## Recommended next step

Do a plan-only slice for the next bridge boundary:

- define the smallest stable preview contract or server-side adapter boundary that reduces heuristic mapping
- keep the public `POST /session-packs` response unchanged
- decide whether the next move should expose the internal `coachLiteDraft` only to the preview path or continue adapting from the public v1 pack
- only after that, consider adding richer real fields such as diagrams or more structured session details

## Final Week 12 outcome

Week 12 finishes in a strong, architecture-safe state:

- the repo stays clean
- the live Session Builder flow still works
- Coach Lite now has a real authenticated preview inside Club Vivo
- the bridge work stayed inside the existing Session Builder path rather than creating a second product silo
