# Week 21 — Day 3 Closeout Summary

## Theme

Coach workspace UX refinement for the Week 21 production-lite flow.

## Day 3 outcome

Day 3 pushed the Club Vivo coach workspace much closer to the intended pilot-facing flow by tightening navigation, simplifying labels, improving auth entry behavior, shaping the Quick Session experience, and making the first practical coach setup pages more usable.

The product now feels more like a real coach workspace instead of a mixed prototype surface.

At the same time, Day 3 also exposed the next important boundary: some newer frontend behavior is now pressing against older Session Builder backend expectations, so the next work needs to cleanly align UI intent with the current API contract instead of continuing to widen the frontend alone.

---

## What improved today

### 1. Auth entry and coach identity feel more real
The public entry flow now behaves much better for sign in and sign up.

What improved:
- public entry now supports both **Sign in** and **Sign up**
- sign in now correctly goes to the hosted email/password screen instead of silently dropping the user into a reused session
- sign up correctly goes through hosted signup and email verification
- after auth, the coach lands in the protected workspace
- the protected shell now shows a coach-friendly identity label based on the part of the email before `@`
  - example:
    - `jleomr1@gmail.com` -> `jleomr1`
    - `coach13thx@gmail.com` -> `coach13thx`

This made the workspace feel much more trustworthy because the coach can immediately confirm which account is active.

---

### 2. Navigation and page naming got cleaner
The main coach workspace navigation is now more aligned to how a coach actually thinks.

What improved:
- `Profile` was renamed in the UI to **Teams**
- the workspace still keeps the shared SIC Coach Workspace shell
- the main navigation now feels more role-based:
  - Home
  - Session Builder
  - Teams
  - Equipment
  - Sessions

This is a better mental model for a coach than a generic “profile” page.

---

### 3. Teams page became the first practical setup surface
The former placeholder profile area is now acting more like a real coach teams page.

What improved:
- the page now centers on **Teams**
- coaches can view existing teams
- coaches can add a team locally in the browser
- the add-team flow includes:
  - team name
  - age band
  - team type
    - Travel
    - OST
  - number of players
- saved teams render as practical cards in the page
- the UI clearly avoids pretending this is durable backend persistence

This gives the workspace stronger coaching context before session generation even starts.

---

### 4. Equipment page now feels useful instead of placeholder-only
The equipment area evolved from a placeholder page into the start of a practical planning surface.

What improved:
- page title now reads **Essentials**
- the page includes a visible **Add equipment** action
- a standard starter essentials list now exists in the UI:
  - Balls
  - Tall cones
  - Flat cones
  - Mini disc cones
  - Agility ladder
  - Agility poles
  - Pugg goals
  - Pinnies
- coaches can add browser-local equipment extras
  - example tested: `whistle`
- the Essentials section is now simpler and cleaner
- the page no longer depends on the old “starter essentials” label structure in the same way as before

This is important because equipment is becoming part of the planning context the generation flow should eventually respect.

---

### 5. Session Builder setup UI is much closer to the intended coach flow
The setup side of Session Builder now feels more structured and less repetitive.

What improved:
- top page title changed to **Build your session**
- section naming became cleaner
- repeated headings were reduced
- `Set up` and `Details` language got closer to the intended coaching workflow
- environment options became more practical
- custom environment addition was added in a browser-local way
  - example tested: `cement grid`
- session equipment can now reflect coach-selected planning equipment more clearly
- new equipment added in the builder flow can now support the browser-local essentials path
- the brainstorm field language was improved to better explain what belongs there

This moved Session Builder toward being a true planning surface instead of just a form wrapper around generation.

---

### 6. Quick Session flow is now much more coherent
The Quick Session path is now clearly separated from the detailed builder path.

What improved:
- Home Quick Session flow feels stable
- Quick Session review is cleaner
- edit returns the coach to the quick prompt path
- quick saved-session detail is simplified
- quick-session title editing is now available in detail view
- quick-session saved cards now support coach-friendly custom naming
- quick-session cards behave differently from builder-created session cards, which is correct

This is one of the biggest Day 3 wins because the Quick Session path now feels like its own real workflow.

---

### 7. Saved sessions started splitting by origin more honestly
The saved sessions area is now beginning to reflect where sessions came from.

What improved:
- quick-session cards now have their own presentation path
- quick-session detail pages keep a simplified structure
- builder-created sessions still stay on the fuller detail path
- session titles and origin pills are becoming more intentional

This lays the groundwork for a much stronger library experience later.

---

## Important issue discovered today

### Session Builder frontend and backend are starting to fight each other
While testing the updated builder flow, the app hit a real API validation problem:

- `Session Builder API request failed (400)`
- backend returned:
  - `platform.bad_request`
  - `Bad request`

This is an important signal.

It confirms that the UI is starting to send or shape planning data in ways the existing backend contract does not yet fully accept. That is expected at this stage because the project started by locking backend contracts first, and now the frontend is evolving faster around the coach experience.

This is not a random UI bug. It is a contract-alignment issue between:
- current frontend planning intent
- current saved backend payload expectations

That needs to be handled deliberately next.

---

## What remains not yet solved

### 1. Builder-generated session titles still need final cleanup
For builder-created saved sessions, we still want the title logic to be more useful.

Target behavior still open:
- saved session card title should reflect:
  - build mode
  - team name
  - age band
- full detail title should reflect:
  - build mode
  - objective
  - team name
  - age band

This is partially moving in the right direction, but not yet at the final intended state.

---

### 2. Builder detail page still needs metadata cleanup
The full session detail surface still needs refinement.

Still needed:
- remove redundant soccer labeling where it adds no value
- replace backend-style identity values with coach-friendly identity
- improve title logic
- show environment instead of over-repeating other fields
- keep objective and tags aligned with what the coach actually entered
- rename or simplify some metadata blocks
- clean feedback labels
  - `Drill usefulness` should become `Activity usefulness`
  - remove image-analysis-specific and flow-mode fields where they do not belong

---

### 3. Brainstorming content is not yet influencing generation strongly enough
During builder testing, the brainstorming note entered by the coach did not show up meaningfully in the generated sessions.

That is a major product point.

Why it matters:
- the coach used brainstorming to specify meaningful direction
- the resulting options did not clearly reflect that note
- this weakens trust in the generation flow

This likely moves into the next layer of work:
- backend prompt shaping
- generation rules
- methodology guidance
- future engine/RAG alignment

---

### 4. Equipment and environment still need deeper contract decisions
The UI now supports richer session context for:
- environment
- equipment

But the backend does not yet fully behave as though those values are first-class planning inputs.

That means the next work must clarify:
- what is local-only UI context
- what is truly sent to generation
- what is persisted
- what remains frontend-only until backend support exists

---

### 5. Teams and essentials are still browser-local only
This is still intentionally true.

Current limitation:
- teams are not yet durable backend data
- essentials are not yet durable backend data
- custom quick titles are not durable backend data
- custom local environments are not durable backend data

That is acceptable for the current slice, but it must stay clearly documented so we do not accidentally overclaim capability.

---

## What Day 3 proved

Day 3 proved that the workspace direction is correct.

The app now has a much stronger coach-facing shape:
- auth feels more believable
- identity display feels correct
- Quick Session feels like its own lane
- Teams is beginning to act like real planning context
- Equipment now looks like usable generation context
- Session Builder feels closer to a real planning workflow

But Day 3 also proved that the project is entering the phase where frontend experience and backend contract must be brought back into alignment.

That is the right next challenge.

---

## Recommended next focus

### Next narrow slice
Focus next on **Session Builder contract alignment and saved-session refinement**.

That should include:
- fix the current 400 builder request failure
- align new frontend planning fields with the current backend contract
- finalize builder-session title logic for:
  - saved session cards
  - session detail page
- refine builder-session metadata presentation
- make sure objective and brainstorming meaningfully influence generated options
- keep quick-session behavior stable while doing the above

---

## End-of-day status

### Stable or improving
- auth entry flow
- hosted sign in / sign up behavior
- coach identity display
- quick-session core flow
- teams setup surface
- essentials page
- session builder layout and labels

### Needs next-session follow-through
- builder request contract fix
- builder saved-session title logic
- builder detail metadata cleanup
- brainstorming influence on generation
- durable model decisions for environment, teams, and essentials

---

## Day 3 result in one sentence

**Week 21 Day 3 transformed Club Vivo from a mostly connected prototype into a much more believable coach workspace, while clearly revealing that the next priority is aligning the evolving frontend planning flow with the current Session Builder backend contract.**
