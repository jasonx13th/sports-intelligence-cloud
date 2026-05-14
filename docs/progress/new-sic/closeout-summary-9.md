# New SIC Closeout Summary 9 - Match-to-Match Prescription Draft Flow

## Branch

`training-brief-intake-ui`

## Theme

Club Vivo Session Builder evolution from a single coach-led builder into two clearer planning paths:

- Custom Build
- Match-to-Match Prescription

## Summary

This session began as a small Training Brief intake UI draft and evolved into a clearer product model for the next Club Vivo/SIC evolution.

The first implementation placed match evidence as a helper above the normal Session Builder form. Manual testing showed that this was confusing because coaches could enter match evidence, then also select unrelated primary objectives, specific focuses, and coaching notes.

The product decision changed:

- **Custom Build** is the everyday coach-led session or drill builder.
- **Match-to-Match Prescription** is the advanced evidence-led planning path from last match to next match.

This work turned that decision into a frontend/runtime draft flow while preserving the existing Session Builder generation path.

## Commit

- `cac606b feat: add match-to-match prescription draft flow`

## Product Decisions

### Custom Build

Custom Build is the standard coach-led builder for coaches who already know what they want to work on.

Custom Build now uses:

- build mode: Full Session or Drill
- team
- duration
- session focus:
  - primary objective
  - specific focus
  - coaching note / activity idea
- environment
- equipment
- generate session

Custom Build keeps one clear free-text planning box:

- `Coaching note / activity idea`

This box sends `constraints` to the existing generation flow and can hold match context, creative activity ideas, field limits, player needs, constraints, or game-like ideas.

### Match-to-Match Prescription

Match-to-Match Prescription is the advanced draft path for evidence-led planning.

It is intended for data-rich competitive teams, academies, or professional-style workflows where the coach may have:

- last match observations
- team performance evidence
- next opponent or tactical notes
- coach notes
- days until next match
- environment context

This path does not ask the coach to manually select build mode, time, primary objective, or specific focus before prescription.

Instead, it drafts prescription options based on evidence and match timeline.

Current implementation is frontend-only and deterministic. It does not call a new backend endpoint or claim full prescription automation.

## Runtime Changes

### Frontend

Added a route-local Match-to-Match draft component:

- `apps/club-vivo/app/(protected)/sessions/new/match-to-match-prescription-draft.tsx`

Updated the Session Builder flow:

- `apps/club-vivo/app/(protected)/sessions/new/page.tsx`
- `apps/club-vivo/app/(protected)/sessions/new/session-new-flow.tsx`
- `apps/club-vivo/components/coach/SessionBuilderTopBlock.tsx`
- `apps/club-vivo/components/coach/ObjectiveConstraintsInputs.tsx`
- `apps/club-vivo/components/coach/DurationSelector.tsx`
- `apps/club-vivo/components/coach/ModeSelector.tsx`

Removed the earlier helper component:

- `apps/club-vivo/app/(protected)/sessions/new/training-brief-intake-draft.tsx`

### Custom Build UX

Updated Custom Build to remove confusing duplicate focus fields.

The final Custom Build model is:

- primary objective
- specific focus
- coaching note / activity idea

The previous extra `Today's focus` box was removed.

The previous `Coaching note only` option was removed.

`Custom` now means the coach can define the objective, activity idea, or constraints inside `Coaching note / activity idea`.

### Duration Model

Updated duration behavior to better match soccer reality.

Full Session:

- default: 60 minutes
- minimum: 45 minutes
- maximum: 120 minutes

Drill / Activity:

- default: 20 minutes
- minimum: 15 minutes
- maximum: 25 minutes

The deterministic generation brain now shapes full sessions by selected duration.

Examples:

- 45 minutes: activation, main activity, competitive close
- 60 minutes: activation, two main activities, competitive close
- 90 minutes: activation, two main activities, competitive close
- 120 minutes: activation, three main activities, competitive close

Drill/activity generation now creates one focused activity matching the selected duration.

### Equipment UX

Removed in-page equipment creation from Session Builder.

Equipment management belongs in the Equipment page.

Session Builder now lets the coach choose:

- Essentials / Builder choice
- specific saved equipment items

The copy no longer mentions browser-local persistence or implementation details.

### Environment UX

Removed custom environment creation from the Session Builder page.

Session Builder now uses curated soccer-related spaces so the builder gets clearer environment context.

## Backend Generation Changes

Updated deterministic session-pack generation and validation:

- `services/club-vivo/api/src/domains/session-builder/session-pack-templates.js`
- `services/club-vivo/api/src/domains/session-builder/session-pack-validate.js`

Updated tests:

- `services/club-vivo/api/src/domains/session-builder/session-pack-templates.test.js`
- `services/club-vivo/api/src/domains/session-builder/session-pack-validate.test.js`
- `services/club-vivo/api/src/domains/session-builder/session-builder-pipeline.test.js`

Key backend behavior:

- full sessions below 45 minutes are rejected
- drill/activity requests outside 15-25 minutes are rejected
- 45, 60, 90, and 120 minute full sessions have deterministic exact-minute allocation
- 23-minute drill/activity generation creates one 23-minute activity
- duration totals remain exact

## Docs Updated

Updated product docs:

- `docs/product/club-vivo/coaching-session-design-standard.md`
- `docs/product/club-vivo/session-generation-quality-standards.md`

The docs now reflect:

- 45-120 minute full-session range
- 15-25 minute drill/activity range
- duration-based activity allocation
- competitive close / final game language
- one strong drill/activity matching the selected duration

## Validation

Frontend typecheck:

```bash
cd apps/club-vivo
npx.cmd tsc --noEmit --project tsconfig.json
cd ../..
```

Result: passed.

Targeted backend tests:

```bash
cd services/club-vivo/api
npm test -- \
  src/domains/session-builder/session-pack-templates.test.js \
  src/domains/session-builder/session-pack-validate.test.js \
  src/domains/session-builder/session-builder-pipeline.test.js
cd ../../..
```

Result:

```text
tests 86
pass 86
fail 0
```

Whitespace validation:

```bash
git diff --check
```

Result: passed.

## Guardrails Preserved

This work did not change:

- auth
- tenancy
- entitlements
- IAM
- CDK
- infrastructure
- Cognito
- DynamoDB schema
- API routes
- persistence model
- tenant context derivation

Tenant isolation remains server-derived and fail-closed.

No client-supplied tenant scope was introduced.

No new backend endpoint was added for Match-to-Match Prescription.

## ADR Decision

No new ADR was required.

Reason:

- no new architecture boundary was introduced
- no new app was created
- no new backend service was created
- no new tenancy path was created
- no new authorization model was created
- no infrastructure decision changed

The existing Training Prescription ADR remains sufficient because this slice keeps Training Prescription inside the existing Club Vivo / Session Builder path.

## Important Distinction

This branch ships a draft planning surface, not full prescription automation.

Custom Build is now clearer and usable.

Match-to-Match Prescription is a frontend draft preview that establishes the product shape for future evidence-led prescription logic.

Future work must wire real prescription logic carefully through validation, tenant-safe context, observability, cost controls, and source-of-truth updates.

## Next Recommended Work

1. Open PR for `training-brief-intake-ui`.
2. Review the PR diff carefully because it touches frontend, backend deterministic generation, tests, and docs.
3. After merge, add a source-of-truth product update that explicitly defines:
   - Custom Build as the everyday coach-led builder
   - Match-to-Match Prescription as the advanced evidence-led path
4. Later, design the real Training Prescription backend behavior before adding a public `/training-briefs` or `/prescriptions` endpoint.
5. Inspect Home Quick Activity and align its `Coaching note / activity idea` semantics with Custom Build without forcing the same UI path.
