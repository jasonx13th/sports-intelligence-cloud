# Club Vivo Local Sprint Closeout Summary

## Date

2026-04-29 into 2026-04-30

## Main Goal

Today we paused full deployed readiness and focused on making the **Club Vivo local web app more coach-ready** before inviting real coaches or clubs to try it.

The main product decision was:

> Do not rush deployment until the coach experience, Session Builder output, Quick Activity behavior, and generation logic feel strong enough to represent the product well.

---

## Starting Point

We began from a clean `main` after these GitHub PRs had already been merged and pulled locally:

```text
#16 removed stale Club Vivo web runtime surfaces
#17 added runtime readiness checklist
#18 recorded local runtime readiness evidence
#19 audited readiness doc overlap
#20 removed stale architecture runtime references
#21 linked readiness planning docs
#22 added Club Vivo session output design plan
```

We created a local safety branch:

```text
safety/pre-local-club-vivo-sprint
```

Then we worked directly on local `main`, without pushing to GitHub or opening PRs.

---

## What We Accomplished Today

## 1. Local Safety Checkpoint Created

We created a safety branch before making major local changes:

```text
safety/pre-local-club-vivo-sprint -> 9612794
```

This gives us a recovery point if local sprint changes become messy.

---

## 2. Saved Session Detail Page Improved

We improved the saved session detail page:

```text
apps/club-vivo/app/(protected)/sessions/[sessionId]/page.tsx
```

The saved session page now feels more like a coach-facing practice plan instead of a simple generated text result.

Main improvements:

```text
- Better top summary / at-a-glance layout
- Clearer source/origin behavior
- Better duration and activity count display
- Better activity card structure
- Better “how to run it” language area
- Preserved export and feedback affordances
```

Local checkpoint commit:

```text
46dc223 wip(club-vivo): improve saved session detail presentation
```

---

## 3. Session Builder Form Flow Redesigned

We redesigned the Session Builder form layout after visual review.

The form now follows a more natural coach workflow:

```text
Build mode
Team + Time
Objective
Environment
Equipment
Brainstorming
Generate session
```

Important product changes:

```text
- Kept green “SESSION BUILDER” page label
- Kept “Build your session” title
- Updated description copy
- Changed visible “Quick Drill” label to “Drill”
- Removed unnecessary “Start here” and “Set-up” wrapper copy
- Separated major form areas into cleaner cards
```

Local checkpoint commits:

```text
23dc4a3 wip(club-vivo): refine session builder form flow
1a62e91 wip(club-vivo): polish session builder layout cards
```

---

## 4. Generated Session Review Redesigned

We improved the generated review shown after clicking **Generate session** in Session Builder.

This is important because the coach should see the final product quality **before saving**.

Main changes:

```text
- Changed review section to “Review before saving”
- Removed extra descriptions that made the page feel too system-like
- Improved “At a glance” area
- Changed coach-facing “Focus” language to “Objective”
- Reduced unnecessary metadata boxes
- Renamed “Activity sequence” to “Activities”
- Cleaned up activity card headers
- Removed “Coach guide” label
- Improved visual hierarchy
```

Local checkpoint commits:

```text
a6d216f wip(club-vivo): improve generated session review design
842615c wip(club-vivo): improve generated session review design
673d3a3 wip(club-vivo): improve generated session review design
fe1a566 wip(club-vivo): refine generated session review layout
```

There are several WIP commits with similar names because we were moving fast locally. Before pushing, we may squash or clean these.

---

## 5. Diagram Placeholder and Diagram Legend Improved

We established the first version of a **Club Vivo diagram language**.

Key product decisions:

```text
- Diagrams should use a clean white canvas.
- Environment affects the logic, but diagrams stay visually clean.
- Future diagrams should use standard symbols and colors.
- Diagram legend should explain the meaning of arrows, player colors, and equipment.
```

We changed the placeholder from just “explanation” behavior to a centered zoom view, closer to clicking a photo and seeing it larger.

We also fixed the VS Code / Edge Tools accessibility warning by removing `aria-expanded` from the diagram toggle and keeping an accessible `aria-label`.

Local checkpoint commit:

```text
4629a56 wip(club-vivo): add generated session diagram zoom
```

---

## 6. Quick Session Became Quick Activity

We clarified the product model:

```text
Old concept: Quick Session
New concept: Quick Activity
```

New rule:

```text
Quick Activity defaults to 1 text-only activity, 20 minutes.
```

But it can still generate a session if the coach clearly asks for one.

Updated behavior:

```text
Prompt says activity / drill / exercise without more structure:
-> 1 activity, 20 minutes

Prompt says session / full session / practice / training session:
-> full session behavior

Prompt specifies duration or activity count:
-> brain uses that detail when safe
```

We also aligned the copy across:

```text
Quick activity
Quick activity review
Saved session origin labels
Session cards
```

Local generation commits related to this:

```text
fed7fee wip(club-vivo): align quick activity and drill generation modes
4be64f1 wip(club-vivo): refine quick activity and session generation brain
```

---

## 7. Shared Generation Brain Improved

We confirmed that **Quick Activity and Session Builder use the same backend generation brain**, but they have different output experiences:

```text
Quick Activity:
- text-first
- no visuals yet
- fast coach helper

Session Builder:
- detailed setup
- text + future visuals
- richer review before saving
```

We added or refined support for:

```text
sessionMode
coachNotes
quick_activity
full_session
drill
```

Important generation rules established:

```text
Quick Activity default:
- 1 activity
- 20 minutes
- game-like when possible

Session Builder Full Session:
- 4 activities
- 20% / 30% / 30% / 20% time split
- final activity = water break + final soccer game

Session Builder Drill:
- 1 main activity
- uses full Session Builder context
```

We also added a compatibility bridge because the local frontend is currently calling the deployed hosted API. The hosted API does not yet fully support the new local fields, so the local app now retries safely when needed.

---

## 8. Age-Band Parsing Improved

We fixed age parsing and normalization.

Important cases now handled:

```text
u12
U12
under 12
under-12
under twelve
12u
12 U
```

The key bug we found was that prompts like “under 12” were being treated as U14 in some places.

We also discovered that the deployed API rejects:

```text
ageBand: "Mixed age"
```

Product decision:

```text
“Mixed age” should not be sent as API ageBand.
```

But it should still be used as brain context.

For OST mixed-age teams:

```text
API ageBand fallback: u10
Brain context: mixed age, ages roughly 6–11, playful/game-like/inclusive
```

---

## 9. Team Context Became Brain Context

We clarified that selecting a team is not just UI. It should carry coaching context for generation.

A team should inform the brain with:

```text
team name
age band
player count
program type
```

Program type matters:

```text
Travel:
- more soccer-specific
- technique
- tactics
- decision-making
- game-realistic constraints
- tournament/game preparation

OST:
- more playful
- game-like
- simple rules
- inclusive
- mixed-skill/mixed-age friendly
- help kids fall in love with soccer
```

Local checkpoint commit:

```text
783fc00 wip(club-vivo): add team-aware session generation context
```

---

## 10. Equipment Handling Fixed

We found another important backend validation issue:

```text
incompatible_equipment
missingEquipment: ["goals"]
```

This happened when the generated plan expected goals but the coach did not select “goals.”

We clarified the correct product behavior:

```text
No equipment selected in Session Builder:
-> use the coach’s Essentials list from Equipment page

Specific equipment selected:
-> generate using those selected items

Pugg goals selected:
-> treat as goal-compatible

No goals or Pugg goals selected:
-> use gates, target lines, end zones, cone goals, scoring zones, or possession points
```

We also found that selecting **Pugg goals** still failed because the hosted API wanted a generic `goals` token. That was fixed with compatibility normalization.

After the fix:

```text
Test 1: Balls + Mini disc cones + Pugg goals -> passed
Test 2: Balls + Mini disc cones only -> passed
```

Local checkpoint commit:

```text
09f1ffd wip(club-vivo): align session generation context and equipment handling
```

---

## Current Git State

Local `main` is ahead of GitHub by 12 commits.

Current latest local commits:

```text
09f1ffd wip(club-vivo): align session generation context and equipment handling
783fc00 wip(club-vivo): add team-aware session generation context
4be64f1 wip(club-vivo): refine quick activity and session generation brain
fed7fee wip(club-vivo): align quick activity and drill generation modes
4629a56 wip(club-vivo): add generated session diagram zoom
fe1a566 wip(club-vivo): refine generated session review layout
673d3a3 wip(club-vivo): improve generated session review design
842615c wip(club-vivo): improve generated session review design
a6d216f wip(club-vivo): improve generated session review design
1a62e91 wip(club-vivo): polish session builder layout cards
23dc4a3 wip(club-vivo): refine session builder form flow
46dc223 wip(club-vivo): improve saved session detail presentation
```

At the end, four files were staged but **not committed** because Codex hit a usage limit and we need to verify them tomorrow:

```text
services/club-vivo/api/src/domains/session-builder/session-builder-pipeline.test.js
services/club-vivo/api/src/domains/session-builder/session-pack-templates.js
services/club-vivo/api/src/domains/session-builder/session-pack-templates.test.js
services/club-vivo/api/src/domains/session-builder/session-validate.js
```

Staged diff:

```text
4 files changed, 189 insertions, 36 deletions
```

---

## Important Thing to Remember Tomorrow

We stopped with staged changes that still need review.

First commands tomorrow:

```bash
git status -sb
git diff --cached --stat
git diff --cached -- services/club-vivo/api/src/domains/session-builder/session-pack-templates.js
git diff --cached -- services/club-vivo/api/src/domains/session-builder/session-pack-templates.test.js
git diff --cached -- services/club-vivo/api/src/domains/session-builder/session-builder-pipeline.test.js
git diff --cached -- services/club-vivo/api/src/domains/session-builder/session-validate.js
```

Do not commit those staged files until we inspect them and run tests.

---

# What We Still Need to Work On Next

## 1. Verify Staged Generation-Quality Changes

Tomorrow’s first task is to verify the staged changes from Codex.

Goal:

```text
Make generated activity descriptions more coach-ready.
```

Each activity should include:

```text
Setup
How to run it
Rules/scoring
Coaching cues
What to watch for
Progression
Regression
Safety/space adjustment when useful
```

We need to make sure the staged changes improve output quality without breaking the generator.

---

## 2. Re-Test Quick Activity Output Quality

Test prompts:

```text
give me a drill similar to duck duck goose for players under 12
```

Expected:

```text
1 activity
20 minutes
U12
game-like
rich coaching description
no generic filler
```

And:

```text
give me a 45 minute session for u12, 20 players, attacking 2v3
```

Expected:

```text
session-style output
correct age tag
better activity descriptions
```

---

## 3. Re-Test Session Builder Output Quality

Test Full Session:

```text
Team: red rose or phoenix
Mode: Full Session
Duration: 60
Objective: passing with inside foot and outside foot
Environment: grass or indoor wood floor
Equipment: balls, mini disc cones, pugg goals
Brainstorming: create a game-like activity similar to duck duck goose
```

Expected:

```text
4 activities
20/30/30/20 split
team context used
program type used
equipment respected
activity descriptions rich enough for a coach
```

Test Drill:

```text
Mode: Drill
Duration: 30
Objective: first touch under pressure
```

Expected:

```text
1 main activity
coach-ready explanation
visual placeholder
```

---

## 4. Improve Graphics/Diagram Output Next

Once text quality is solid, we should improve diagram logic.

Main direction:

```text
Full Session:
- activity 2 and 3 should have the strongest diagram output

Drill mode:
- the single main activity should have strong diagram output
```

Future diagram system should include:

```text
white canvas
field/court boundary
players
opposition
cones/gates
movement arrows
passing/shooting arrows
dribbling arrows
labels
coach notes
```

---

## 5. Design the SIC Bank of Knowledge Later

We clarified the future architecture idea:

```text
SIC Bank of Knowledge = selected coaching knowledge source used by the brain
```

Future methodology page should let a club/coach choose:

```text
SIC default knowledge
club methodology
coach methodology
futsal/soccer source
mixed source
```

But we did **not** implement that today. For now, we only prepared the generation context to respect team, program, equipment, objective, environment, and notes.

---

## 6. Node.js Lambda Runtime Update

AWS is warning that deployed Lambda functions are on Node.js 20.x.

We should handle this before inviting real coaches/clubs.

Do it as a separate slice, after local product behavior stabilizes.

Order:

```text
1. Finish local app behavior
2. Commit verified staged generation-quality changes
3. Run full local validation
4. Update Lambda runtime from Node.js 20.x
5. Deploy backend/frontend
6. Test deployed app
7. Invite coaches/clubs
```

Do not mix the Node.js runtime update into the UI/generation sprint.

---

## Validation Completed Today

During the sprint, Codex repeatedly ran:

```text
npm.cmd run build
./node_modules/.bin/tsc.cmd --noEmit
targeted backend session-builder tests
```

The latest reported successful validations included:

```text
targeted backend tests passing
Next build passing
TypeScript passing
next-env.d.ts unchanged
```

We also visually tested:

```text
login
home
Session Builder
Quick Activity
Session Builder generated review
diagram zoom
equipment selected vs no equipment selected
Pugg goals compatibility
mixed-age OST context
```

---

## Final Closeout

Today was a major local product sprint.

We moved Club Vivo from a technically working coaching app toward a more real coach-facing product:

```text
Cleaner Session Builder
Better generated review
Quick Session renamed conceptually to Quick Activity
Diagram placeholder and zoom behavior
Better generation modes
Team-aware generation context
Equipment-aware generation context
Age parsing fixes
Hosted API compatibility bridge
```

The most important product decision from today:

> The brain should not just generate generic sessions. It must use the coach’s real context: team, age, program, equipment, environment, objective, and brainstorming notes.

That is the right foundation for SIC and Club Vivo.
