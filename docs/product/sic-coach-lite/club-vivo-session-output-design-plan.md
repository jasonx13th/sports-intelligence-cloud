# Club Vivo Session Output Design Plan

## Purpose

This plan defines the product design direction for improving Club Vivo generated session output.

The goal is to make generated sessions easier for coaches to read, trust, adapt, and run on the field without changing runtime code in this planning pass.

## Scope

In scope:

- Coach-facing session output structure.
- Review-page layout and saved-session layout.
- Activity detail hierarchy.
- Coaching cues, setup notes, progressions, and constraints.
- Later PDF/export design alignment.

Out of scope for this document:

- Runtime implementation.
- Backend API changes.
- Auth, middleware, Cognito, tenancy, entitlements, IAM, CDK, or package changes.
- New active routes.
- Reintroducing removed `/dashboard` or `/profile` surfaces.

## Current Product Surface

Session output is currently viewed in the active Club Vivo app through:

- `/sessions/new`
- `/sessions/quick-review`
- `/sessions/[sessionId]`

The output should continue to support both detailed Session Builder sessions and Quick Session results. Quick Session can stay shorter and more direct, while detailed Session Builder can expose richer planning context.

## Current Coach Workflow Map by Route

This map is for product planning only. It should be confirmed against current source during implementation.

### `/home`

Current role:

- Main protected coach workspace entry.
- Gives the coach a fast way to start or resume session work.
- Surfaces recent sessions through the home/library components.

Output design implication:

- Home should preview enough saved-session value to make the coach want to open the detail page, but it should not become the full session output surface.

### `/teams`

Current role:

- Coach-facing team management route.
- Session Builder uses backend teams when available, with local fallback behavior still present in the builder page.

Output design implication:

- Saved output can show team context when the builder flow preserved it in session context hints.
- Any deeper team influence in generation needs implementation-phase review because the deployed `/session-packs` contract may not yet accept full team context.

### `/equipment`

Current role:

- Equipment and essentials context route.
- Equipment hints are browser-local in the current web app.

Output design implication:

- Generated output should make equipment needs easy to scan.
- It should distinguish "equipment the coach chose" from "equipment assumed by the generated plan" only if the data is available. This needs code confirmation.

### `/methodology`

Current role:

- Methodology workspace route backed by the app methodology API helper.
- Current output rendering does not clearly show methodology influence on a generated session.

Output design implication:

- If methodology influenced generation, the output should say so plainly.
- If methodology influence is not present in the generated payload, the UI should not imply it is. This needs implementation-phase review.

### `/sessions`

Current role:

- Saved session library.
- Entry point into saved session detail pages.

Output design implication:

- Cards should help coaches recognize saved outputs quickly: source, theme, team if known, duration, and activity count.
- The library should stay a browsing surface, not duplicate the full saved-session detail.

### `/sessions/new`

Current role:

- Detailed Session Builder route.
- Collects coach form inputs, optional image analysis, team options, equipment hints, environment, objective, constraints, duration, and mode.
- Generates a candidate session and offers a save path.

Output design implication:

- This is the richest review surface before saving.
- The generated candidate should show the coach what will be saved, what came from their inputs, and what was inferred.

### `/sessions/quick`

Current role:

- One-prompt Quick Session entry.
- Builds a compact quick intent and calls the same deployed session-pack generation helper.

Output design implication:

- The page should stay fast and lightweight.
- It should not ask for all detailed builder fields unless the coach chooses to move into Session Builder.

### `/sessions/quick-review`

Current role:

- Temporary review surface for the generated Quick Session payload stored in a short-lived cookie.
- Lets the coach edit the prompt or save the generated candidate.

Output design implication:

- This page should show the generated activities clearly but briefly.
- It can use the same language system as detailed output, but it should not become as dense as `/sessions/new`.

### `/sessions/[sessionId]`

Current role:

- Saved-session detail page.
- Renders origin-aware output for Quick Session and Session Builder sessions.
- Includes export and feedback affordances.

Output design implication:

- This should become the most reliable coach-ready version of the output.
- Export/PDF design should follow this page once the page hierarchy is stable.

## Current Session Builder Source/Data Flow

Current flow, based on the app surface:

1. Coach opens `/sessions/new`.
2. The page loads backend team options through `listTeams()` when available, with local fallback team hints.
3. The page loads browser-local equipment hints.
4. The coach chooses mode, team, sport, age band, duration, environment, objective/theme, equipment, and constraints.
5. Optional image analysis can add a confirmed image profile.
6. `generateSessionPackAction` builds a deployed API request.
7. `generateSessionPack` in `session-builder-api.ts` posts to backend `/session-packs`.
8. The backend returns a session pack with one or more generated session candidates.
9. The builder review card renders a candidate and posts selected candidate data to the shared save action.
10. `saveGeneratedSessionAction` posts the generated session to backend `/sessions`.
11. The save path stores origin/context hints where available and redirects to `/sessions/[sessionId]`.

Planning notes:

- Coach form inputs are richer than the saved session detail payload currently appears to be.
- Team context is displayed/preserved through hints in some saved detail states, but full team context in generation needs implementation-phase review.
- Equipment context is partly browser-local and partly generated output; avoid implying durable backend equipment state unless confirmed.
- Methodology context should not be overstated until the request/response path is confirmed in code.
- `session-builder-api.ts` is the app-side API boundary for generation and saving; do not plan around direct frontend imports from backend source.

## Current Quick Session Source/Data Flow

Current flow, based on the app surface:

1. Coach opens `/sessions/quick`.
2. The coach enters one free-text prompt.
3. `buildQuickSessionIntent` turns the prompt into a compact generation intent.
4. `createQuickSessionAction` calls `generateSessionPack` with default sport/age values, inferred duration, theme, and equipment when found.
5. The generated pack, values, and original prompt are serialized into the quick-session payload cookie.
6. The app redirects to `/sessions/quick-review`.
7. `QuickSessionReview` renders the first generated candidate.
8. The coach can edit the prompt or save.
9. Save posts the candidate through `saveGeneratedSessionAction`, marks origin as `quick_session`, stores title hints, and redirects to `/sessions/[sessionId]`.

What is lighter than full Session Builder:

- One prompt instead of a multi-field setup flow.
- Default sport and age values unless inferred/changed elsewhere. Needs code confirmation for exact defaults before implementation copy changes.
- Short-lived review payload rather than a long-lived builder draft.
- Activity descriptions are shown more simply than the richer `SessionPackView` activity structure.
- Save path is shared with Session Builder, but review and input burden stay lower.

## Current Session Output Rendering Map

### `SessionPackView`

Current role:

- Renders `SessionPackV2` style output with title, objective, equipment, space, assumptions, safety notes, success criteria, cooldown, activities, setup, instructions, coaching points, organization, constraints, progressions, regressions, common mistakes, and diagrams when present.

Planning note:

- This component already has richer output sections than the saved-session detail page appears to expose.
- Implementation should confirm which generated flows still use `SessionPackView` and which use the lighter saved-session activity shape.

### Saved session detail page

Current role:

- Renders saved `SessionDetail` records from `/sessions/{sessionId}`.
- Uses origin hints to adjust title, source label, Quick Session title behavior, builder context labels, and feedback/export actions.
- Activity rendering currently uses activity name, timing, and a single delivery/description block.

Planning note:

- This is the best candidate for the durable coach-ready output design.
- It may need richer backend response fields or a better mapping from existing fields; that is implementation-phase review, not a planning assumption.

### Quick review page

Current role:

- Renders the first generated Quick Session candidate before save.
- Shows prompt summary, inferred duration signal, candidate metadata, activity names, minutes, and descriptions.

Planning note:

- Quick Review should stay short.
- It can borrow section naming from saved output, but should not present unavailable details as if they are known.

### Export-readiness implications

- PDF/export should not drive the first page design pass.
- The saved-session detail page should become the visual source for eventual export.
- Export may require a stable output hierarchy and possibly richer saved-session data. Needs implementation-phase review.
- If PDF currently fails or is parked for some sessions, page output improvements can still proceed independently.

## UX and Design Gaps by Page

### `/home`

- Recent-session cards may not communicate enough about whether a session came from Quick Session or full Session Builder. Needs code confirmation.
- The route should help coaches resume work without pulling full output detail into the home page.

### `/teams`

- Team context is important to session quality, but the output path does not clearly prove when team context influenced generation.
- The design should not imply team-specific adaptation unless the generation payload supports it.

### `/equipment`

- Equipment context exists as planning support, but the output may not clearly distinguish selected equipment from generated equipment.
- A future design should keep "needed before practice" highly visible.

### `/methodology`

- Methodology is a core product promise, but current generated output may not show methodology influence clearly.
- If methodology is unavailable or not used, the output should be honest rather than decorative.

### `/sessions`

- Saved sessions need stronger scanning cues: source, focus, duration, activity count, and team if known.
- Avoid turning the library into a dense report page.

### `/sessions/new`

- Generated candidate review needs a clearer "what you asked for" vs "what was generated" split.
- The activity preview may need more coach-delivery detail before saving.
- Auto-scroll and save flow should remain simple.

### `/sessions/quick`

- The prompt flow should stay fast, but coach expectations need a clear handoff into review.
- Avoid adding full-builder controls here unless the coach chooses that path.

### `/sessions/quick-review`

- Current review is intentionally light, but the coach may need slightly more setup clarity before saving.
- The page should make edit/save choices obvious without adding heavy planning controls.

### `/sessions/[sessionId]`

- Saved detail is the main output page, but activity cards appear lighter than the richer generated pack component.
- Export and feedback are useful, but the coach-ready run order should remain the visual priority.
- Quick Session and full Session Builder outputs need related but distinct framing.

## Specific Files Likely to Change During Implementation

Likely product/UI files:

- `apps/club-vivo/components/coach/SessionPackView.tsx`
- `apps/club-vivo/app/(protected)/sessions/[sessionId]/page.tsx`
- `apps/club-vivo/app/(protected)/sessions/quick-review/quick-session-review.tsx`
- `apps/club-vivo/app/(protected)/sessions/new/session-new-flow.tsx`
- `apps/club-vivo/app/(protected)/sessions/page.tsx`
- `apps/club-vivo/components/coach/RecentSessionsPanel.tsx`
- `apps/club-vivo/components/coach/HomeSessionStartCard.tsx`

Likely app helper files:

- `apps/club-vivo/lib/session-builder-api.ts`
- `apps/club-vivo/lib/session-origin-hints.ts`
- `apps/club-vivo/lib/session-builder-context-hints.ts`
- `apps/club-vivo/lib/builder-session-label.ts`
- `apps/club-vivo/lib/quick-session-intent.ts`
- `apps/club-vivo/lib/quick-session-payload.ts`
- `apps/club-vivo/lib/quick-session-title-hints.ts`

Implementation-phase review before touching:

- Backend `/session-packs` response shape.
- Backend `/sessions` saved-session detail shape.
- PDF/export behavior.
- Any methodology/team context propagation.
- Any changes that would require API contract, backend, auth, middleware, IAM, CDK, or package edits.

## Design Goals

- Make the session readable in under one minute.
- Help a coach run the first activity without hunting for missing setup details.
- Separate the coach's intent from the generated plan.
- Make each activity scannable on mobile and desktop.
- Show constraints and adaptations without making the page feel like a report.
- Preserve trust by making assumptions visible when the model fills gaps.
- Keep the design compatible with later PDF export and diagram work.

## Proposed Output Hierarchy

Use a consistent session shape:

1. Session summary
2. Coach intent and constraints
3. Equipment and setup overview
4. Activity sequence
5. Coaching cues
6. Progressions and regressions
7. Timing and transitions
8. Safety or field-management notes
9. Save/export actions

## Session Summary

The top of the output should answer:

- What is this session for?
- Who is it for?
- How long does it take?
- What is the primary coaching theme?
- What does the coach need before starting?

Recommended fields:

- Title
- Sport or product flavor
- Age band
- Duration
- Environment
- Objective
- Equipment
- Number of activities

## Activity Card Design

Each activity should include:

- Activity name
- Time block
- Setup
- How it works
- Coaching points
- Progression
- Regression
- Common mistakes
- Success signal

Keep activity cards compact, but avoid hiding the instructions a coach needs during practice.

## Coach Trust Signals

Generated output should make uncertainty visible without sounding apologetic.

Useful signals:

- "Assumption" notes when the coach did not provide age, space, equipment, or team context.
- "Adapt if" notes for low numbers, limited space, or missing equipment.
- "Watch for" notes tied to safety, pace, or confusion.
- Clear labels for methodology influence if that context is available.

## Quick Session Variant

Quick Session output should stay lighter:

- One short summary.
- One to three activities.
- Minimal setup burden.
- Clear save path.
- Optional "make it harder" or "make it easier" guidance.

Quick Session should not become a full builder UI by another name.

## Detailed Session Builder Variant

Detailed Session Builder output can support:

- More explicit activity sequencing.
- More detailed constraints.
- Team and methodology context when available through the deployed API contract.
- Stronger review-before-save affordances.
- Better comparison between coach intent and generated result.

## Future Diagram Alignment

Diagram work should support the activity structure rather than define it.

For each activity, reserve a future place for:

- Field shape
- Player groups
- Ball movement
- Player movement
- Coach position
- Optional setup image or generated diagram

Do not block text output improvements on diagram generation.

## Future PDF Alignment

The saved-session page should become the source for later PDF design decisions.

PDF-ready output should:

- Fit on a small number of pages.
- Preserve activity order and timing.
- Avoid UI-only controls.
- Include enough setup and coaching cues to run the session offline.

## Proposed Small Implementation Sequence

1. Audit current generated session fields in the saved-session detail UI.
2. Improve the visual hierarchy of `SessionPackView`.
3. Add missing labels and coach-facing section names.
4. Improve activity cards for setup, flow, cues, and adaptations.
5. Align Quick Session review with the same output language.
6. Validate on mobile and desktop.
7. Revisit PDF/export only after the page output feels stable.

## Validation Questions

- Can a coach understand the full session at a glance?
- Can a coach run activity one without extra interpretation?
- Are progressions and regressions easy to find?
- Does the output avoid overexplaining?
- Does Quick Session still feel fast?
- Does detailed Session Builder feel worth the extra inputs?
- Would the saved-session page translate cleanly into a PDF later?

## Stop Conditions

Pause before implementation if the work requires:

- Backend API contract changes.
- Auth, middleware, Cognito, tenancy, entitlement, IAM, CDK, or package changes.
- New active routes.
- Reintroducing removed runtime surfaces.
- Making PDF or diagram generation the first dependency.
