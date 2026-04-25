# Week 21 - Closeout Summary

## Theme

Coach Workspace Hardening for KSC.

## Weekly Outcome

Week 21 moved Sports Intelligence Cloud / Club Vivo from a working but mixed coach prototype toward a more coherent shared coach workspace for KSC.

The week did not redesign the platform. It hardened the current authenticated coach-facing app around practical workflows:

- coaches can start fast from Home with Quick Session
- coaches can use Session Builder for more deliberate setup
- teams are now coach-owned backend objects
- saved sessions are now coach-owned backend objects
- Session Builder has clearer server-owned generation context boundaries
- methodology has a narrow text-only shared-app management path
- saved-session detail now reads more like a coach-ready field plan
- final Week 21 walkthrough documentation is in place

One shared coach-facing app remains the product direction. Week 21 did not create a separate admin app, separate Travel or OST product, or separate Quick Drill backend product.

## What Changed Across Days 1-7

Day 1 froze the Week 21 direction as Coach Workspace Hardening for KSC, aligned source-of-truth docs, started the protected app-shell reconstruction, and normalized the main protected routes around one shared coach workspace.

Day 2 split Quick Session away from the detailed Session Builder flow. Quick Session gained its own prompt and review routes, one generated option, edit, save, and saved-detail continuity while still reusing the shared generation and save paths.

Day 3 refined the coach-facing UX: auth entry felt more intentional, navigation labels improved, Teams and Equipment became more practical setup surfaces, Quick Session started rendering differently from builder-origin sessions, and the work exposed the need to align frontend planning intent with the current backend contract.

Day 4 aligned backend and app boundaries without widening the public `POST /session-packs` contract. It added Methodology v1, Generation Context v1, Resolved Generation Context v1, selected-team server context, and the first bounded internal methodology influence path.

Day 5 moved Teams to a coach-owned backend model, deployed that change to the dev API stack, simplified Team Manager, stabilized Quick Session, surfaced saved-session PDF export, fixed local Session Builder runtime issues, and cleaned up public entry/Home.

Day 6 moved saved sessions to a coach-owned model, added non-owner `404` protections for session detail/export/feedback, improved Quick Session prompt handling, simplified Session Builder to one candidate, removed noisy visible influence panels, and added planning docs for future image-assisted intake and methodology source-mode.

Day 7 polished the saved-session output screen, improved activity timing and delivery presentation, made PDF export read as a coach handout action, tightened feedback guidance, and added final walkthrough and closeout evidence docs.

## Product Improvements

The coach workspace is now more understandable as a product:

- `/home` is the returning-coach workspace entry.
- Quick Session is the fast prompt-based lane.
- Session Builder is the more deliberate setup lane.
- Teams carry practical KSC context such as age band, program type, and player count.
- Equipment/Essentials is a visible planning surface.
- Methodology exists in the shared app as a narrow managed content surface.
- Saved Sessions better reflect whether output came from Quick Session or Session Builder.
- Saved-session detail is closer to a field-ready coach artifact.

The product direction stayed intentionally unified:

- one shared coach-facing app
- one shared Session Builder generation path
- Travel and OST represented through team/program context, not separate apps
- coach-admin capability kept inside the shared app rather than a separate admin product

## Backend/API Improvements

Week 21 backend work focused on ownership, validation, and server-owned context.

Completed backend/API improvements included:

- Methodology v1 contract and validation
- text-only methodology routes with coach read access and admin-only draft save/publish
- Generation Context v1 internal normalization
- Resolved Generation Context v1 internal resolution
- tenant-scoped optional team lookup for generation
- published-only methodology lookup for generation context
- signed HttpOnly selected-team context
- coach-owned Team create/list/update behavior
- coach-owned saved-session behavior
- admin visibility for tenant-wide teams and sessions
- non-owner access returning `404` where ownership applies
- saved-session feedback validation and spoofing protections
- favorite activity feedback support
- Session Builder test coverage for validation, templates, pipeline, and context behavior

Important API boundaries held:

- public `POST /session-packs` request shape was not widened
- public handler response shape was not widened
- `tenant_id`, `tenantId`, and `x-tenant-id` were not accepted from client input
- duration, theme, and equipment stayed request-owned generation inputs
- `teamId` did not become public request body, query, or header input

## Frontend/App-Shell Improvements

The Club Vivo frontend moved toward one coherent protected app shell.

Completed frontend improvements included:

- shared protected route shell
- shared coach navigation
- Home workspace entry
- public entry and login cleanup
- Sessions list entry actions for Session Builder and Quick Session
- Quick Session prompt/review flow
- Team Manager layout with coach-owned create/list/edit behavior
- Equipment/Essentials manager improvements
- Methodology page inside the shared app
- Session Builder setup simplification
- generated-result review simplification
- saved-session origin-aware rendering
- saved-session detail output polish
- PDF export action presentation
- feedback panel guidance cleanup

The app-shell direction remains shared and coach-facing. Week 21 did not create or claim a separate admin application.

## Team Ownership And Session Ownership

Teams moved from admin-only creation to coach-owned backend objects.

Current behavior:

- any authenticated coach can create a team
- Team records persist `createdBy = tenantCtx.userId`
- regular coaches see and edit their own teams
- admin coaches can see and edit tenant-wide teams
- non-owner Team access returns `404`
- tenant identity remains server-derived

Saved sessions also moved to coach ownership.

Current behavior:

- regular coaches see their own saved sessions
- admin coaches can see tenant-wide saved sessions
- non-owner session detail returns `404`
- non-owner export and feedback access return `404`
- saved-session spoofing protections were expanded

These changes made Teams and Sessions safer for a shared multi-tenant coach product without redesigning tenancy.

## Quick Session Improvements

Quick Session became a practical fast lane.

Completed improvements:

- dedicated `/sessions/quick` prompt route
- dedicated `/sessions/quick-review` review route
- one generated candidate for review
- edit returns to the quick prompt with prompt context
- save redirects to saved-session detail
- saved quick sessions get coach-readable titles
- quick title editing is available on saved detail
- no-duration prompts default safely
- explicit durations are honored safely
- short one-drill prompts validate
- objective tags are hidden in Quick Session cards where intended
- prompt influence noise was removed from review

Quick Session still reuses the shared generation/save/session paths. It is not a separate backend product.

## Session Builder Simplification

Session Builder became more focused and less workbench-like.

Completed improvements:

- `/sessions/new` remains the detailed setup path
- Start Here team selection remains the team context source
- duration remains request-owned
- team context is validated and stored server-side before internal use
- visible Team Influence and Methodology Context cards were removed late in the week
- methodology influence remains an internal generation-context concern
- builder review now presents one strong candidate instead of three
- save flow revalidates Home and Sessions
- builder-origin saved sessions have clearer labels and detail titles

Quick Drill should still be described as product direction or a mode label, not as a full separate backend product.

## Methodology And Generation Context Work

Week 21 introduced narrow methodology management and internal generation context groundwork.

Completed:

- Methodology v1 model with `scope`, `title`, `content`, and `status`
- tenant-scoped methodology routes
- admin-only draft save and publish
- coach read access
- shared/travel/ost methodology scopes
- Methodology page in the shared app
- internal generation context helper
- resolved generation context helper
- optional published methodology lookup
- deterministic methodology influence on wording/style within existing compatible generation behavior
- documentation for future methodology source-mode planning

Not completed:

- methodology upload
- methodology source-mode
- file attachments
- version history
- durable team-to-methodology source management
- broad RAG-style methodology system

## Saved-Session Output And Feedback Improvements

Saved-session output became more coach-ready by the end of the week.

Completed:

- saved-session detail keeps Back to sessions visible
- saved-session detail distinguishes Quick Session and Session Builder origin
- created-by display is more coach-facing for current saved-session paths
- PDF export is visible from saved detail
- export action now reads as a coach PDF/field-plan handout action
- activity cards show run order, timing window, duration, and coach delivery guidance
- feedback asks coaches to use the session first and submit field-test evidence
- favorite activity feedback was added
- rating labels and missing-feature prompts are clearer

PDF export is surfaced and reachable, but deeper PDF document design is not complete.

## Validation Evidence

Validation was captured throughout the week from Day 1 through Day 7 summaries.

Frontend validation:

- `cmd /c npx tsc --noEmit` passed in `apps/club-vivo` during the frontend slices
- Day 6 `cmd /c npx tsc --noEmit` passed
- Day 7 `cmd /c npx tsc --noEmit` passed
- `git diff --check` passed on Day 6 and Day 7

Backend/domain validation included passing focused tests for:

- methodology validator
- methodology service
- methodology handler
- generation context
- resolved generation context
- lookup loader
- session builder pipeline
- session pack templates
- session validation
- session pack validation
- session repository
- session feedback service
- session feedback validation
- team validation
- team repository
- teams handler

Browser/manual validation was recorded for:

- public entry
- login flow
- Home Quick Session to quick review
- quick review edit/save flow
- saved session detail
- saved-session PDF export reachability
- Teams create after API deploy
- created teams appearing on the Teams page

One Day 4 note was recorded honestly: one Windows Node focused test run hit sandbox `spawn EPERM`, then the affected focused test command was rerun outside the sandbox and final focused results passed.

## Deployment Evidence

Deployment evidence captured during the week:

- Methodology route slice was verified against the deployed dev stack.
- `cdk synth` passed.
- `cdk diff` passed.
- `cdk deploy` passed.
- live methodology smoke checks passed for not found, bad request, admin required, save draft, publish, and read-after-publish behavior.
- `SicApiStack-Dev` deployed successfully after the Team ownership change.
- deployed API URL remained `https://ekth4bq6ze.execute-api.us-east-1.amazonaws.com/`.

No later Day 7 deployment is claimed in this summary.

## Tenancy And Security Boundaries Held

Week 21 held the core platform boundaries:

- tenant identity remains server-derived
- auth was not redesigned
- tenancy was not redesigned
- entitlements were not redesigned
- IAM was not broadly redesigned
- CDK was not broadly redesigned
- client-supplied tenant scope was not accepted
- no `tenant_id`, `tenantId`, or `x-tenant-id` client input path was added
- public `POST /session-packs` was not widened
- session ownership behavior now protects regular coaches from non-owned sessions
- team ownership behavior now protects regular coaches from non-owned teams
- admin visibility remains tenant-scoped

Infrastructure changes were limited to the methodology route/deployment and dev API deploy evidence already captured during the week.

## Intentionally Parked Work

The following were intentionally not completed in Week 21:

- image-assisted intake restart
- broader Rekognition-style image-assisted intake work
- methodology upload/source-mode implementation
- methodology file attachments
- methodology version history
- deeper PDF document design
- full Quick Drill backend product
- separate admin app
- separate Travel/OST applications
- broad auth redesign
- broad tenancy redesign
- entitlement redesign
- IAM/CDK redesign beyond the captured narrow deployments
- durable methodology source management
- deeper generation/RAG behavior

The image-assisted intake and methodology source-mode planning docs keep future ideas visible without presenting them as shipped.

## Recommended Week 22 Focus

Recommended Week 22 focus should build on the Week 21 boundaries instead of reopening them:

1. Run the final Week 21 walkthrough using `docs/progress/week_21/day7-walkthrough-script.md` and capture human/operator evidence if not already captured.
2. Improve the actual exported PDF document design, separately from the now-visible export action.
3. Continue generation-quality work using the internal generation context path, especially team/program/methodology influence, without widening public `POST /session-packs`.
4. Decide the next durable methodology step, likely source management/versioning design, before implementing upload or source-mode.
5. Tighten Team Manager only where real coach workflow friction appears; do not rebuild it as a Day 7-style scope.
6. Improve saved-session library/search/reuse around coach-owned sessions.
7. Keep Quick Session as a fast shared-app lane and Session Builder as the deliberate shared-app lane.
8. Preserve one shared coach-facing app as the product direction.

## Final Closeout

Week 21 successfully hardened the Club Vivo coach workspace for KSC without turning it into a platform rewrite.

The most important result is coherence: coaches now have a clearer Home, fast Quick Session path, deliberate Session Builder path, coach-owned Teams, coach-owned saved sessions, safer ownership boundaries, a narrow methodology management foundation, and a saved-session output screen that is closer to something a coach can take to the field.

The work remains honest about what is not done. Image-assisted intake was not restarted, methodology upload/source-mode was not implemented, deeper PDF document design is not complete, Quick Drill is not a separate backend product, and no separate admin app exists. One shared coach-facing SIC app remains the Week 21 product direction.
