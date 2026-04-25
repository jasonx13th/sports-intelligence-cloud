# Week 21 - Closeout Summary (Coach Workspace Frontend Reconstruction Kickoff)

## Theme

Coach Workspace Hardening for KSC

## Status

Week 21 moved from planning-only into a real frontend reconstruction slice for the Club Vivo coach app.

This work stayed inside the frozen Week 21 product boundary:
- one shared coach-facing app
- `/sessions/new` remains the current shared generation path
- no auth, tenancy, entitlements, IAM, or CDK drift
- no backend contract expansion yet

## What changed today

### 1. Week 21 source-of-truth alignment was completed
The main Week 21 product direction was frozen and aligned across the tracked docs.

Updated or added:
- `docs/progress/build-progress/roadmap-vnext.md`
- `docs/product/sic-coach-lite/sic-session-builder.md`
- `docs/vision.md`
- `docs/product/sic-coach-lite/coach-workspace-v1.md`
- `docs/product/sic-coach-lite/ksc-program-types-and-methodology-v1.md`
- `docs/progress/week_21/day1-scope-lock.md`

This reframed Week 21 as **Coach Workspace Hardening for KSC** instead of a generic release week.

### 2. GPT/project knowledge was updated
The Week 21 product direction and supporting source-of-truth docs were added to the GPT/project knowledge setup so future planning stays aligned.

### 3. Frontend audit and planning were completed
A focused audit of the current Club Vivo app and backend-connected coach flow was completed.

That audit confirmed:
- authenticated coach flow already exists
- `/sessions/new` is the active generation route
- saved sessions list/detail already exist
- team APIs exist but the durable team model is still small
- Quick Drill is still product direction, not a full shipped runtime mode
- profile/environment/equipment are still missing as durable product surfaces

### 4. First Week 21 frontend slice was implemented
The first generation-page hardening slice was built in `apps/club-vivo`.

Implemented:
- Session Builder top block
- Team selector
- Mode selector
- Duration selector
- Objective and constraints inputs
- Recent sessions support
- Reuse-from-library entry

Quick Drill remained UI-only.
Backend contracts remained unchanged.

### 5. Generate-page cleanup and stabilization began
The main builder on `/sessions/new` was simplified:
- primary generate button moved to the bottom
- visible `Flow` selector removed from the main builder
- image-assisted intake demoted into a secondary/collapsible area
- state-sync issues were investigated and partly corrected
- hidden-form compatibility was kept where needed to avoid backend contract changes

### 6. Club Vivo app shell reconstruction started
The app moved away from isolated page shells and toward one shared protected coach-facing shell.

Implemented:
- protected route group under `app/(protected)/`
- shared coach shell
- shared nav
- shared page header pattern
- protected placeholder profile page
- protected pages moved under the shell without changing URL paths:
  - `/sessions/new`
  - `/sessions`
  - `/sessions/[sessionId]`
  - `/dashboard`

### 7. Page normalization was completed across the protected shell
Protected pages were cleaned up so they no longer each tried to build their own separate full-page shell inside the new app shell.

This made:
- `Generate`
- `Sessions`
- `Session Detail`
- `Profile`
- `Dashboard`

feel more like one product.

### 8. Type and render blockers were debugged
Several frontend issues were found and corrected during manual smoke checks:
- default-vs-named export mismatch around `NewSessionFlow`
- `teamOptions` prop-shape mismatch (`teamId` vs `id`)
- broken relative import in `coach-lite-preview/mock-session-pack.ts`

Result:
- `npx tsc --noEmit` passed successfully in `apps/club-vivo`
- real shell smoke checks became possible again

## Manual smoke-check result

The following routes were manually checked successfully:
- `/sessions/new` renders inside the protected shell
- `/sessions`
- a real `/sessions/{sessionId}` detail page
- `/profile`
- `/dashboard`

Current state by page:
- `Sessions` is the strongest page right now
- `Session Detail` works when opened from a real saved session
- `Profile` works as a useful placeholder
- `Dashboard` works as a secondary route
- `Generate` now renders and is structurally improved, but still needs more product simplification and another full generation behavior pass
- `/` still shows the older scaffold page and needs to be repurposed
- `/login` still works but should later be redesigned to feel more branded and welcoming

## Important decisions captured today

- The product should move toward a real app flow:
  - Login
  - Home
  - Sessions
  - Generate
  - Profile
  - Dashboard secondary
- The builder should be focused and practical, not a mixed demo/workbench page
- Image-assisted intake should not stay in the main everyday builder flow unless a real coach use case is proven
- Travel vs OST should continue to live through team context, not separate app paths
- Quick Drill should remain UI/product direction only until backend support exists

## What did not change

- no backend contract changes
- no auth changes
- no tenancy changes
- no entitlements changes
- no IAM changes
- no CDK changes
- no second app
- no full admin workspace

## Next steps

### Immediate next steps
1. Repurpose `/` into a real public entry or redirect page.
2. Create a true protected `Home` flow.
3. Demote the logout button so it is less prominent.
4. Keep polishing the app page by page:
   - Home
   - Generate
   - Sessions
   - Profile
   - Login

### Generate-page follow-up
- simplify `/sessions/new` one more time
- keep it focused on practical coach inputs
- retest real generation behavior end to end after the latest shell changes

### Profile follow-up
- keep `/profile` lightweight for now
- later turn it into the real home for:
  - teams
  - environment
  - equipment

## High-level summary

Today moved Week 21 from documentation and planning into a real frontend Coach Workspace reconstruction.

The app now has:
- aligned Week 21 product direction
- a shared protected shell
- cleaner coach-facing routes
- a working page structure for Generate, Sessions, Profile, and Dashboard
- successful type-checking again

The main unfinished work is no longer basic structure.
The next work is about refining the actual coach experience page by page, starting with Home, Generate, and the public entry flow.
