# New SIC Architect Process Log

## Purpose

This log is the post-Week-21 New SIC process record.

It does not replace the older archived detailed progress history. It gives the current `main`
branch a concise, factual record of what changed after the Week 21 closeout and how the New SIC
baseline is evolving.

Use the New SIC closeout summaries as the chronological source of truth:

- `closeout-summary-1.md`
- `closeout-summary-2.md`
- `closeout-summary-3.md`
- `closeout-summary-4.md`
- `closeout-summary-5.md`
- `closeout-summary-6.md`
- `closeout-summary-7.md`

The other files in this folder are supporting planning, audit, readiness, hosting, deployment, and
evidence documents.

## Relationship To Older Progress Docs

Older Week 0-21 detailed notes were removed from GitHub `main` during the showcase cleanup and are
preserved in the archive branch/tag listed in `docs/progress/README.md`.

Current summary layers remain:

- `docs/progress/weekly-progress-notes.md`
  - concise Week 0-21 summary plus the New SIC baseline marker
- `docs/progress/architect-process-summary.md`
  - short architecture/process story distilled from the archived detailed process log
- `docs/progress/new-sic/`
  - post-Week-21 New SIC plans, audits, readiness notes, and closeout summaries

This file is the ongoing New SIC process log inside the New SIC folder. It should stay concise and
should not reintroduce the old detailed week-folder style.

## Chronological Closeout Record

### Closeout Summary 1 - New SIC Starting Point

Status: completed.

Main point: established the New SIC starting point and GitHub showcase cleanup checkpoint after the
old week-based progress model closed.

The work kept New SIC cleanup docs in `main`, preserved older detailed history in the archive, and
identified follow-up reviews for stale runtime surfaces and progress-history decisions.

### Closeout Summary 2 - Coach Lite Preview Review

Status: completed.

Main point: reviewed the old Coach Lite preview direction after the cleanup checkpoint.

The useful architecture/product learning stayed available, while stale active-app preview surfaces
were treated as historical rather than current Club Vivo runtime.

### Closeout Summary 3 - Readiness And Cleanup Audit Pass

Status: completed.

Main point: continued New SIC readiness cleanup through documentation, duplication, progress
history, and backend/export/lake review work.

This kept `main` focused on concise summaries and current Club Vivo direction while treating
unwired or future-looking material as audit/supporting context rather than shipped runtime.

### Closeout Summary 4 - Club Vivo Local Sprint

Status: completed locally.

Main point: paused full deployed readiness and focused on making the Club Vivo local web app more
coach-ready before wider use.

Key decisions and work:

- improved saved session detail output
- redesigned Session Builder form flow
- improved generated session review
- added diagram placeholder and zoom behavior
- clarified Quick Session as Quick Activity
- improved shared deterministic generation behavior
- added team-aware and equipment-aware context
- improved age-band parsing
- clarified equipment behavior for selected vs available equipment

This was still a local product sprint, not a broad platform redesign.

### Closeout Summary 5 - Coach-Ready Session Generator Sprint

Status: completed on `main` through PR `#25`.

Main point: moved Club Vivo from generic activity text toward prompt-aware soccer activity
generation with coach-ready structure.

Key work:

- PR `#23` hardened coach-ready session output.
- PR `#24` added deterministic prompt archetype generation.
- PR `#25` updated Club Vivo API Lambdas from Node.js 20 to Node.js 22.

Important deployment lesson:

- Amplify deploys the frontend.
- The Session Builder generation brain lives behind the API Gateway `/session-packs` backend.
- Backend generation-quality changes require backend deployment.

The live backend was deployed after the deterministic archetype work so Quick Activity and Session
Builder could use the updated generation logic.

### Closeout Summary 6 - Club Vivo Product Alignment And Session Quality

Status: completed on `main` through PR `#37`.

Scope:

```text
PR #27 through PR #37
commit range: 66e7b2f..ec566b8
```

Main point: clarified Club Vivo as the platform, clarified KSC as Jason's pilot/example verified
club workspace, and improved the current deterministic Session Builder / Quick Activity experience.

Key work:

- defined Club Vivo role and workspace model
- added protected Club Portal shell for admin-like users
- aligned free club workspace model and public landing paths
- scoped browser-local coach workspace data by signed-in user/tenant context
- removed seeded KSC fallback teams from new users
- documented coaching session design and generation quality standards
- improved deterministic generation quality for 3v3 defending / Duck Duck Goose multi-intent prompts
- added deterministic activity diagrams
- added guided Session Builder Objective controls
- renamed Session Builder and Quick Activity flexible inputs around Coaching note / activity idea
- corrected standard equipment display/output to `Pinnies` while recognizing typo/legacy aliases

This block did not add RAG, FAISS, vector search, Bedrock production generation, a new DynamoDB
schema, or a new AI model.

### Closeout Summary 7 - Session Builder Quality And Diagram Storytelling

Status: completed on `main` through PR `#43`.

Scope:

```text
PR #39 through PR #43
commit range: f489d57..39bc557
```

Main point: moved Session Builder from basic deterministic output toward a more coach-facing
training-session product by improving deterministic session structure, equipment language, setup
dimensions, diagram storytelling, and diagram movement semantics.

Key work:

- PR `#39` improved Session Builder quality, equipment specificity, and deterministic generation
  standards.
- PR `#40` added deterministic diagram storytelling.
- PR `#41` polished diagram storytelling so the live visuals were less text-heavy.
- PR `#42` improved session diagram layout and backend setup text so sessions read as one
  progressive coaching story.
- PR `#43` clarified diagram movement language, ball symbols, arrow semantics, and legend behavior.

Key decisions:

- Keep the current generation brain deterministic/template-based until a proper research and
  architecture block defines the next AI/RAG approach.
- Treat full sessions as one progressive story: Activity 1 introduces the theme/grid/scoring idea,
  Activity 2 increases pressure or decision level, Activity 3 adds progression/transition/recovery
  or a second decision, and Activity 4 applies the theme in a competitive final game.
- Keep Activity 4 as a compact final-game card, not a full tactical diagram.
- Keep diagrams deterministic, lightweight, SVG/React/CSS-based, clickable to enlarge, and suitable
  for future export.

Shipped artifacts:

- generator setup text with direct `Grid:` and `Field:` dimensions
- direct selected-equipment language and safer no-equipment defaults
- backend tests for setup dimensions, equipment specificity, distinct Activity 2/3 language, and
  competitive final games
- always-visible diagram story views for Activity 1, Activity 2, and Activity 3
- clearer 50/50 desktop activity text and visual layout
- visual legend examples for coached team, opposition, equipment, cone gates, solid green action
  arrows, blue dashed support/recovery arrows, and red dashed pressure/chase arrows
- visual ball symbol instead of the word `Ball`
- updated Club Vivo coaching session and generation-quality standards

Validation:

- `git diff --check`
- `npm.cmd test --prefix services/club-vivo/api -- src/domains/session-builder/session-pack-templates.test.js`
- `npm.cmd test --prefix services/club-vivo/api`
- `cd apps/club-vivo && npx.cmd tsc --noEmit`
- `cd apps/club-vivo && npm.cmd run build`

Deployment notes:

- PR `#39` and PR `#42` changed backend deterministic generator behavior and required backend
  deployment.
- PR `#42` required both backend deployment and Amplify deployment.
- PR `#43` required Amplify deployment only.
- Frontend/docs slices after PR `#42` did not require backend deployment.
- The existing Next.js warning remains: `middleware` is deprecated in favor of `proxy`.

Guardrails preserved:

- no auth redesign
- no tenancy redesign
- no client-supplied tenant scope
- no IAM, Cognito, DynamoDB schema, CDK, or Amplify config changes
- no Bedrock, RAG, FAISS, vector search, storage, video generation, image generation, or new
  dependencies

Current state:

- Session Builder output is more connected and coach-ready.
- Activity setup text now gives clearer field/grid shape before the activity action.
- Diagrams now tell a deterministic setup/action/play/score story.
- Diagram movement language is clearer and documented.
- The system is still deterministic and still needs deeper coaching methodology and future brain
  architecture before real AI/RAG work.

Next block:

The next New SIC block should be research and architecture, not more small UI polish. It should cover
soccer/futsal session methodology, ages 5-21 age-stage rules, coach workflow and mental model,
diagram notation, RAG/FAISS/AI generation architecture, structured diagram JSON, and revised
SIC/Club Vivo source-of-truth docs after research.

## Supporting New SIC Docs Inventory

Planning and baseline:

- `new-sic-starting-point-plan.md`
- `progress-history-audit.md`

Closeout summaries:

- `closeout-summary-1.md`
- `closeout-summary-2.md`
- `closeout-summary-3.md`
- `closeout-summary-4.md`
- `closeout-summary-5.md`
- `closeout-summary-6.md`
- `closeout-summary-7.md`

Readiness, launch, and deployment support:

- `club-vivo-runtime-readiness-checklist.md`
- `club-vivo-runtime-readiness-evidence.md`
- `deployment-readiness-checklist.md`
- `hosting-and-domain-launch-plan.md`

Audit/supporting context:

- `backend-export-lake-audit.md`
- `coach-lite-preview-audit.md`
- `docs-readiness-duplication-audit.md`

These supporting files should not be read as shipped runtime by themselves. They provide context for
cleanup decisions, readiness decisions, and future review.

## Major Product And Runtime Decisions So Far

- Club Vivo is the platform.
- KSC is Jason's pilot/example verified club workspace, not the product identity.
- Club Vivo is free to start.
- Free Individual Coach Workspace and Free Club Workspace are product paths.
- Coach Workspace is included inside Club Workspace.
- Verified / Supported Club Workspace is a future higher-trust tier.
- Public start choices are product intent only, not authorization.
- Admin-like users can land in a protected Club Portal shell.
- Regular coaches land in Coach Workspace.
- Logout returns to the public starting page.
- Browser-local coach workspace hints are scoped by signed-in user/tenant context.
- New users should not inherit old KSC/test team hints.
- Quick Activity is the fast activity lane.
- Session Builder is the guided planning lane.
- Current generation quality improvements are deterministic/template-based.
- Current diagrams are deterministic SVG story views, not a full graphics engine.
- Full-session output should read as a progressive coaching story.
- Setup text should start with clear grid or field dimensions.
- Activity 4 remains a compact competitive final-game card.
- Diagram legend semantics are blue coached-team dots, red opposition dots, yellow equipment dots,
  yellow cone gates, solid green ball/player action arrows, blue dashed coached-team movement
  arrows, and red dashed opposition pressure/chase arrows.

## Current State After Closeout Summary 6

Club Vivo has a clearer product identity and a stronger current coach workflow.

Current state:

- public copy frames Coach Workspace and Club's Workspace paths
- KSC-specific language is no longer the general product identity
- admin-like users have a Club Portal shell entry
- regular coaches have a Coach Workspace path
- local browser hints are scoped more safely by user/tenant context
- Session Builder has guided Objective controls
- Session Builder flexible input language is aligned with Quick Activity
- Quick Activity uses Coaching note / activity idea language
- deterministic generation handles the recent multi-intent prompt family better
- full sessions follow a stronger warm-up / main / main progression / final game pattern
- deterministic diagrams improve output readability
- equipment displays/outputs `Pinnies`, with typo/legacy aliases recognized

The current generation brain remains deterministic/template-based.

It is not:

- FAISS
- RAG
- Bedrock production generation
- vector search
- a new AI model

## Current State After Closeout Summary 7

Club Vivo now has a stronger deterministic Session Builder and a more readable diagram experience.

Current state:

- Session Builder generation is still deterministic/template-based
- full sessions are structured as a progressive coaching story
- Activity 1 introduces the theme, grid, ball start, movement direction, gates, and scoring idea
- Activity 2 increases pressure or decision level
- Activity 3 progresses the learning with transition, recovery, a second decision, or faster tempo
- Activity 4 applies the theme in a competitive final-game or mini-tournament format
- setup text starts with direct grid or field dimensions
- selected equipment is used directly when available
- broad equipment `or` lists are avoided in coach-facing setup text
- diagrams show deterministic story views for setup, action, how to play, and score/reset moments
- Activity 4 remains a compact final-game card
- the diagram legend now explains cone gates, green action arrows, blue dashed support/recovery
  arrows, and red dashed pressure/chase arrows
- the ball is shown as a visual symbol

The current diagrams are better coaching-board aids, but they are still deterministic templates. They
are not truly activity-specific tactical diagrams yet.

## Guardrails Preserved

- Tenancy must fail closed.
- Tenant context must be server-derived.
- Do not trust client-supplied `tenant_id`, `tenantId`, or `x-tenant-id`.
- Auth and role-routing changes must not weaken backend authorization.
- Public role/start choices must not grant official club access.
- Deterministic generation improvements must not be described as RAG, FAISS, Bedrock production
  generation, or vector search.
- KSC is Jason's pilot/example verified club workspace, not the product identity.
- Future Club Workspace/Admin Portal work should be a clean block with backend authorization design
  before privileged management features are expanded.

## Recommended Next Block

Recommended next block:

```text
Club Vivo coaching-methodology research and future brain architecture.
```

Suggested scope:

- deep research on soccer and futsal session design
- age-stage methodology for ages 5-21
- coach workflow and coach mental model
- diagram notation standard
- RAG/FAISS/AI generation architecture planning
- structured diagram JSON plan for future renderer-driven diagrams
- revised SIC / Club Vivo source-of-truth docs after research

The next block should design the next real brain before adding Bedrock, RAG, FAISS, vector search,
or AI diagram generation to production.
