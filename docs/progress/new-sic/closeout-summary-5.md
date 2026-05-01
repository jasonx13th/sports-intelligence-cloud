# Club Vivo Closeout Summary — Coach-Ready Session Generator Sprint

**Date:** May 1, 2026
**Project:** Sports Intelligence Cloud — Club Vivo Web Runtime
**Environment:** GitHub `main`, Amplify `main`, AWS dev backend
**Primary test user:** `coach13thx@gmail.com`
**AWS account used:** `333053098932` via `j-admin`
**Region:** `us-east-1`

---

## 1. Session Objective

Today’s work focused on moving Club Vivo closer to a real coach-facing session generator.

The main goal was to stop treating the Session Builder and Quick Activity output as generic template text and begin shaping the product toward a higher-level soccer coaching brain.

The specific target was:

> When a coach gives a simple idea like “create a game-like activity similar to duck duck goose,” Club Vivo should understand the underlying game pattern, transform it into a soccer activity, and return a coach-ready field plan.

---

## 2. Starting Point

Before today’s fixes, the Club Vivo web app was running and the main paths worked:

- Public landing page loaded.
- Cognito login worked.
- Home page loaded after login.
- Quick Activity could generate, review, save, and open saved detail.
- Session Builder could generate, review, save, and open saved detail.
- Diagram placeholder and zoom worked in the review flow.

However, the generated content was not good enough.

The live output was too shallow. Example:

```text
Theme challenge: a game like activity similar
Rules / scoring: reward the action that matches the focus.
```

That showed us that the user interface was working, but the generation brain was still too basic.

---

## 3. GitHub Work Completed

### PR #23 — Coach-Ready Output Rendering

**Merged PR:** `#23`
**Commit on main:** `3e6428d`
**Title:** `feat(club-vivo): harden coach-ready session output`

This PR improved the frontend output structure and review experience.

Key changes:

- Improved saved session detail presentation.
- Refined Session Builder form and review layout.
- Added generated session diagram zoom behavior.
- Aligned Quick Activity and drill generation modes.
- Added team-aware and equipment-aware generation context.
- Added richer deterministic session generation detail.
- Added shared activity output rendering across:
  - Quick Activity review
  - Session Builder review
  - Saved session detail
- Added local sprint closeout notes.

Validation completed:

- GitHub checks passed.
- Backend session-builder tests passed.
- Frontend TypeScript passed.
- Frontend Next build passed.
- Manual local smoke test passed.

---

### PR #24 — Prompt Archetype Generation

**Merged PR:** `#24`
**Commit on main:** `2b7da0d`
**Title:** `feat(club-vivo): add prompt archetype generation`

This PR added the first deterministic prompt interpretation layer for the Club Vivo generation brain.

The important product direction is now:

```text
coach prompt
→ prompt signals
→ archetype detection
→ soccer transformation
→ coach-ready activity output
```

Duck-duck-goose is the first supported archetype. It is not the whole brain.

Key changes:

- Added prompt archetype detection for duck-duck-goose, tag, chase, and escape ideas.
- Quick Activity can now return a soccer-specific activity called:
  - `Duck Duck Goose Escape Gates`
- The generated activity now includes coach-ready sections:
  - Setup
  - How to start
  - How to run it
  - Rules / scoring
  - Coaching cues
  - What to watch for
  - Progression
  - Regression
  - Safety / space adjustment
- Full Session generation can inject a related archetype activity when the brainstorm prompt asks for it.
- Session Builder prompt shaping now preserves more meaning before fallback compression.
- Extracted the diagram placeholder into a shared component.
- Reused the diagram placeholder in saved Session Builder output.

Validation completed:

- Targeted backend tests passed: `57 pass, 0 fail`.
- Frontend TypeScript passed.
- Frontend Next build passed.
- `git diff --check` passed.
- GitHub checks passed after PR creation.

---

## 4. Amplify Deployment

Amplify successfully deployed the frontend after PR #23 and PR #24.

Current live app:

```text
https://main.d1md24x9w1ez3n.amplifyapp.com
```

Amplify confirmed deployment for:

```text
2b7da0d feat(club-vivo): add prompt archetype generation (#24)
```

Important lesson:

Amplify deploys the web app, but it does not deploy the backend Lambda generation brain. The web app calls the API Gateway `/session-packs` backend.

That is why the first live test after PR #24 still looked weak. The frontend was deployed, but the backend `SessionPacksFn` Lambda was still running older code.

---

## 5. Backend Deployment Completed

After confirming the backend was CDK-managed, we deployed the API stack.

### CDK stack

```text
SicApiStack-Dev
```

### Command used

```bash
cd ~/dev/sports-intelligence-cloud/infra/cdk
npx cdk deploy SicApiStack-Dev
```

### Deployment result

```text
✅ SicApiStack-Dev
Deployment time: 51.11s
ClubVivoApiUrl = https://ekth4bq6ze.execute-api.us-east-1.amazonaws.com/
```

The deployment updated the Lambda code asset for all API Lambdas, including the most important one for this sprint:

```text
sic-club-vivo-session-packs-dev
```

### Lambda verification

```text
Function: sic-club-vivo-session-packs-dev
Runtime: nodejs20.x
LastModified: 2026-05-01T19:17:51.000+0000
```

This confirmed that the backend brain was updated live.

---

## 6. Live App Status After Backend Deploy

After deploying the backend, Quick Activity improved significantly.

### Quick Activity Test

Prompt used:

```text
create a game like activity similar to duck duck goose
```

The live app now generated:

```text
Duck Duck Goose Escape Gates
```

With coach-ready sections:

- Setup
- How to start
- How to run it
- Rules / scoring
- Coaching cues
- What to watch for
- Progression
- Regression
- Safety / space adjustment

This is a major improvement from the previous generic response.

The current Quick Activity output is now much closer to the product vision.

### Session Builder Test

Session Builder settings:

```text
Build mode: Full Session
Team: phoenix
Time: 60 minutes
Objective: practice passing
Environment: grass field
Equipment selected: none
Brainstorming: create a game like activity similar to duck duck goose
```

The generated session now includes:

- A normal warm-up activity.
- A duck-duck-goose-inspired activity:
  - `Duck Duck Goose Escape Gates`
- Passing-related activities.
- A final game activity.
- Diagram placeholders shown beside activities.

This proves the brainstorm prompt is now influencing the full-session generation.

---

## 7. Current Product Behavior

### What is working well now

- Login works with `coach13thx@gmail.com`.
- Home page routes correctly after login.
- Quick Activity route works.
- Quick Activity generation now understands the first supported analogy.
- Quick Activity produces better coach-ready sections.
- Quick Activity save flow works.
- Saved Quick Activity detail opens.
- Session Builder form works.
- Session Builder auto-scrolls to generated review after generation.
- Session Builder review layout looks organized.
- Session Builder now injects the duck-duck-goose activity when prompted.
- Diagram placeholder and zoom behavior work in review.
- Saved Session Builder output reuses diagram placeholder language.
- Backend deployment is confirmed.
- Amplify frontend deployment is confirmed.
- GitHub `main` is current with PR #23 and PR #24.

### What is still not final

The product is improving, but it is not yet “big leagues pro soccer coach” level.

The remaining quality issues are:

1. **Saved Quick Activity detail has too much metadata before the activity.**
   The activity should be the star of the page. Metadata like coach focus, objective tags, and large info cards should be reduced, moved lower, or simplified.

2. **Some saved-session sections take more space than the actual activity.**
   This makes the page feel backward. The coach-ready activity should appear sooner and stronger.

3. **Coach focus may not be needed in the saved detail header.**
   It currently repeats or summarizes information that may not help the coach apply the activity.

4. **Objective tags may not need to be visible in saved detail.**
   Tags are useful internally, but they should not dominate the coach-facing output.

5. **Equipment logic needs refinement.**
   If the coach selects no equipment, the brain should be allowed to use available listed equipment.
   If the coach selects specific equipment, the brain must only use selected equipment.
   The saved output should clearly list the equipment the brain actually used.

6. **Session Builder still shows internal-style coach notes in some activities.**
   Example style that should be cleaned:
   ```text
   create a game like activity similar to duck duck goose | team:phoenix | ...
   ```
   This should not appear as coach-facing content.

7. **Some descriptions are still too generic.**
   The output is better, but still needs more professional detail, field language, constraints, coaching cues, and realistic variations.

8. **Some generated text appears truncated.**
   Example:
   ```text
   keep chases outside the circle, rotate the caller every rep, and enl.
   ```
   This needs validation and trimming cleanup.

9. **Diagram placeholder is good for now, but real diagrams are still future work.**
   The current placeholder is acceptable for product direction, but eventually each activity should have meaningful soccer diagram data.

---

## 8. Product Decision Captured

The Session Builder brain should not be a hardcoded duck-duck-goose generator.

The correct long-term product direction is:

```text
Prompt understanding
→ activity archetype detection
→ soccer-specific transformation
→ age/equipment/environment adaptation
→ coach-ready session plan
```

Duck-duck-goose is only the first proof.

Future archetypes to add:

- Sharks and Minnows
- Capture the Flag
- Relay-style activities
- Tag games
- Rondos
- Overloads like 2v3
- No-goals scoring games
- Small-space constraint games
- Transition games
- Scanning and reaction games

---

## 9. Equipment Rule Decision

Today we clarified an important rule:

If the coach selects no equipment in Session Builder, Club Vivo can use the available equipment listed in the coach workspace.

If the coach selects specific equipment, the brain must use only those selected items.

That means:

```text
No selected equipment = flexible use of available workspace equipment.
Selected equipment = strict constraint.
```

The generated and saved output should show the equipment actually used.

---

## 10. Deployment State

### GitHub

```text
main is current through PR #24
```

Latest important commits:

```text
2b7da0d feat(club-vivo): add prompt archetype generation (#24)
3e6428d feat(club-vivo): harden coach-ready session output (#23)
```

### Amplify

Frontend is deployed from `main`.

Live URL:

```text
https://main.d1md24x9w1ez3n.amplifyapp.com
```

### Backend

CDK API stack deployed:

```text
SicApiStack-Dev
```

Backend API URL:

```text
https://ekth4bq6ze.execute-api.us-east-1.amazonaws.com/
```

Important Lambda updated:

```text
sic-club-vivo-session-packs-dev
```

Runtime currently:

```text
nodejs20.x
```

---

## 11. Next Step

The next task is to handle the AWS Node.js runtime update notice.

Current Lambda runtime is:

```text
nodejs20.x
```

We should update runtime as a separate focused infrastructure slice, not mix it with generation-brain changes.

Recommended next slice:

```text
infra(club-vivo): update Lambda Node.js runtime
```

Suggested approach:

1. Confirm which runtime AWS is recommending.
2. Check CDK support for the target runtime.
3. Update API Lambda runtimes in `infra/cdk/lib/sic-api-stack.ts`.
4. Run CDK build and diff.
5. Confirm diff only changes Lambda runtime.
6. Deploy `SicApiStack-Dev`.
7. Verify Lambda runtime after deployment.
8. Smoke test the live app again.

---

## 12. Final Status

Today’s sprint was successful.

Club Vivo moved from:

```text
generic amateur activity text
```

toward:

```text
prompt-aware soccer activity generation with coach-ready structure
```

The app is not final yet, but the architecture is now moving in the right direction.

The biggest breakthrough today was proving that:

```text
A coach can type a playful non-soccer game idea,
and SIC can begin transforming it into a soccer-specific activity.
```

That is the foundation for the Club Vivo coaching brain.

---

## 13. Final Runtime / Deployment Closeout

The runtime next step above was completed as a focused infrastructure-only update.

### PR #25 — Lambda Runtime Update

**Merged PR:** `#25`
**Title:** `infra(club-vivo): update lambda runtime to nodejs22`

PR #25 changed only:

```text
infra/cdk/lib/sic-api-stack.ts
```

It updated seven Club Vivo API Lambdas from `nodejs20.x` to `nodejs22.x`:

- `MeFn`
- `AthletesFn`
- `SessionsFn`
- `TemplatesFn`
- `SessionPacksFn`
- `TeamsFn`
- `MethodologyFn`

Validation completed:

- CDK build passed.
- CDK diff showed only Lambda runtime changes.
- CDK deploy of `SicApiStack-Dev` completed successfully.

Backend API URL remained:

```text
https://ekth4bq6ze.execute-api.us-east-1.amazonaws.com/
```

Runtime verification after deploy:

```text
sic-club-vivo-session-packs-dev
Runtime: nodejs22.x
LastModified: 2026-05-01T20:03:07.000+0000

sic-club-vivo-sessions-dev
Runtime: nodejs22.x
LastModified: 2026-05-01T20:03:09.000+0000
```

Live smoke test passed:

- Landing page loaded.
- Cognito login worked.
- Home loaded.
- Quick Activity still generated `Duck Duck Goose Escape Gates`.
- Session Builder still generated a session.

Final deployment status:

- GitHub `main` is current through PR #25.
- Amplify frontend `main` is live.
- CDK backend `SicApiStack-Dev` is deployed.
- Club Vivo API Lambdas are running `nodejs22.x`.
