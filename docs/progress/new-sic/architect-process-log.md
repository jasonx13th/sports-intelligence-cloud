# New SIC Architect Process Log

## Purpose

This file is the concise New SIC process record after Week 21.

It summarizes the major architecture, product, runtime, and process decisions that shaped the
current `main` branch. It is not the detailed chronological evidence record. Detailed chronology
and validation evidence live in Closeout Summaries 1-9.

## Source Documents

- `closeout-summary-1.md`
- `closeout-summary-2.md`
- `closeout-summary-3.md`
- `closeout-summary-4.md`
- `closeout-summary-5.md`
- `closeout-summary-6.md`
- `closeout-summary-7.md`
- `closeout-summary-8.md`
- `closeout-summary-9.md`

## Executive Timeline

### Phase 1 - New SIC Reset And Cleanup

Covers Closeout Summaries 1-3.

New SIC started with a GitHub showcase cleanup and a cleaner `main` branch. The old detailed
week-by-week progress history was archived outside `main`, concise progress summaries remained, and
stale preview/runtime surfaces were reviewed. The active repository story was narrowed around
current Club Vivo runtime, with future or unwired surfaces kept as documentation, audits, or parked
product direction.

### Phase 2 - Club Vivo Local Product Sprint

Covers Closeout Summary 4.

The team paused broad deployment readiness and improved the local Club Vivo web app before wider
use. The sprint improved saved session detail, Session Builder form flow, generated session review,
diagram placeholder and zoom behavior, Quick Activity naming, team-aware context, equipment-aware
context, and age-band handling.

### Phase 3 - Coach-Ready Deterministic Session Generation

Covers Closeout Summary 5.

Club Vivo moved from generic generated text toward prompt-aware soccer activities with coach-ready
structure. Deterministic prompt archetype generation was introduced, with Duck Duck Goose as the
first proof of transforming a playful idea into a soccer activity. This phase also reinforced a key
deployment lesson: Amplify deploys the frontend, while the `/session-packs` generation brain lives
behind the backend API and requires backend deployment when generation logic changes.

### Phase 4 - Club Vivo Product Alignment And Session Quality

Covers Closeout Summary 6.

Club Vivo became the platform identity, while KSC became Jason's pilot/example workspace rather than
the product identity. Free coach and club workspace paths were clarified. Session Builder and Quick
Activity language aligned around `Coaching note / activity idea`, and deterministic generation
quality improved without claiming RAG, FAISS, Bedrock production generation, vector search, or a new
AI model.

### Phase 5 - Session Builder Quality And Diagram Storytelling

Covers Closeout Summary 7.

Session Builder output became more coach-ready. Full sessions were shaped as progressive coaching
stories, and deterministic diagrams became setup/action/play/score visual aids instead of simple
placeholders. Diagram legend, ball symbols, and movement semantics improved. The generation brain
remained deterministic/template-based, not RAG, Bedrock, FAISS, vector search, or production AI.

### Phase 6 - Club Vivo Source-Of-Truth Alignment

Covers Closeout Summary 8.

The repository source-of-truth docs were aligned around SIC as the platform and Club Vivo as the
current coach-facing product. Session Builder remained the active runtime wedge, and Coach Workspace
remained the surrounding product experience. Training Prescription was framed as a proposed
soccer-only future layer that extends Session Builder. Training Brief, DiagramSequence, 7Q Football
Intelligence and Learning, and SIC Execution Protocol direction were added as source-of-truth
guidance. These future docs are not shipped runtime behavior.

### Phase 7 - Custom Build And Match-to-Match Prescription Split

Covers Closeout Summary 9.

`/sessions/new` evolved into two clearer paths:

- Custom Build
- Match-to-Match Prescription

Custom Build is the everyday coach-led builder for full sessions and drills. Match-to-Match
Prescription is an evidence-led draft planning path from last match to next match. Match-to-Match
is currently frontend-only deterministic preview behavior, not full automation. Full sessions now
support 45-120 minutes, drills/activities support 15-25 minutes, deterministic generation allocates
exact duration totals, equipment creation belongs in the Equipment page, and no new API route or
persistence model was added.

## Current Product Model

- Club Vivo is the current coach-facing product inside SIC.
- Session Builder is the active runtime wedge.
- Custom Build is the standard coach-led full session/drill builder.
- Match-to-Match Prescription is the advanced evidence-led draft path, currently frontend-only.
- Quick Activity remains the fast activity lane.
- Coach Workspace surrounds session creation, teams, equipment, methodology, and saved sessions.
- Training Prescription, Training Brief, DiagramSequence, and 7Q remain evolving/future
  intelligence layers unless implemented.

## Current Runtime Truth

- Generation is deterministic/template-based.
- Custom Build is a guided Session Builder flow.
- Match-to-Match Prescription is a frontend-only deterministic draft preview.
- Duration allocation is deterministic and totals exactly to the selected duration.
- Diagrams are deterministic story views.
- Browser-local coach workspace, team, and equipment hints exist where applicable.
- There is no RAG, FAISS, Bedrock production brain, or vector search in runtime yet.
- There is no public Training Brief or prescription API yet.

## Non-Negotiable Guardrails

- Tenant isolation must fail closed.
- Tenant context must be server-derived.
- Never trust client-supplied tenant scope.
- Auth and role routing must not weaken backend authorization.
- Public start choices are product intent only, not authorization.
- Deterministic generation must not be described as RAG, FAISS, Bedrock production generation, or
  vector search.
- KSC is a pilot/example workspace, not the product identity.
- Match-to-Match Prescription is draft preview behavior until backend architecture exists.

## Deployment Lessons

- Amplify deploys the frontend.
- The `/session-packs` generation brain is backend/API behavior.
- Backend generation changes require backend deployment.
- Frontend-only UI or docs changes may only require Amplify deployment.
- Slices touching both frontend and backend need both deployment paths.

## Recommended Next Block

1. Update long-lived product docs with the Custom Build vs Match-to-Match split.
2. Inspect Home Quick Activity and align `Coaching note / activity idea` semantics with Custom
   Build.
3. Design real Training Prescription backend/API before adding public `/training-briefs` or
   `/prescriptions`.
4. Research soccer/futsal methodology, age-stage rules, coach workflow, and diagram notation.
5. Design future RAG/FAISS/Bedrock/AI generation architecture before production AI work.
