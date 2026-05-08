# New SIC Closeout Summary 6

## Title

Club Vivo product alignment and deterministic session-quality block.

## Status

Completed on `main` through PR `#37`.

This block moved Club Vivo from a KSC-centered pilot framing toward a clearer platform model, while improving the current deterministic Session Builder and Quick Activity experience.

## Strategic Objective

The objective was to clarify what Club Vivo is, who it serves, and how the current session-generation experience should behave before widening the product.

The product decision is now:

```text
Club Vivo is the platform.
KSC is Jason's pilot/example verified club workspace.
Coach Workspace is a planning workspace inside Club Vivo.
Club Workspace includes Coach Workspace.
```

The generation-quality objective was:

```text
Make the current deterministic/template-based brain produce more useful coach-ready sessions,
without claiming FAISS, RAG, Bedrock production generation, vector search, or broad AI services.
```

## Scope Completed

This closeout covers the Club Vivo product/runtime alignment and session-quality block across:

```text
PR #27 through PR #37
commit range: 66e7b2f..ec566b8
```

Key merged work:

```text
#27 docs(product): define Club Vivo role and workspace model
#28 feat(club-vivo): add club portal entry shell
#29 docs(product): align free club workspace model
#30 copy(club-vivo): polish public landing paths
#31 feat(club-vivo): scope coach workspace local data
#32 docs(product): define coaching session design standard
#33 feat(club-vivo): improve deterministic generation quality
#34 feat(club-vivo): add deterministic activity diagrams
#35 feat(club-vivo): guide objectives and diversify diagrams
#36 copy(club-vivo): clarify coaching notes inputs
#37 copy(club-vivo): align session input labels
```

New product docs added:

- `docs/product/club-vivo/role-and-workspace-model.md`
- `docs/product/club-vivo/session-generation-quality-standards.md`
- `docs/product/club-vivo/coaching-session-design-standard.md`

## What Changed In Product Model

Club Vivo is now described as the product/platform, not just a KSC app or capstone artifact.

KSC is now treated as:

```text
Jason's pilot/example verified club workspace
```

It is not the product identity, and it should not be hardcoded into general product copy.

The workspace model is now:

- Free Individual Coach Workspace
- Free Club Workspace
- future Verified / Supported Club Workspace
- Coach Workspace included inside Club Workspace

The public start and landing copy now frames Club Vivo around:

- Coach Workspace
- Club's Workspace
- free-to-start paths
- future verified/supported setup

Public role/start choices remain product intent only. They do not grant official club access, verified status, or protected permissions.

## What Changed In Coach Workspace

Coach Workspace local browser data is now scoped by signed-in user and tenant context.

This fixed a real product/runtime issue where new users could inherit old KSC/test team hints from the same browser.

Changes included:

- browser-local coach workspace hints are scoped by current user/tenant context
- seeded KSC fallback teams were removed for new users
- regular new users start with a cleaner workspace
- KSC-specific context stays pilot-specific instead of becoming default product state

The protected runtime gained a Club Portal shell for admin-like users. Login/callback behavior now routes admin-like users toward the Club Portal and regular coaches toward Coach Workspace. Logout now returns to the public starting page.

The Club Portal is a shell/entry surface, not a complete club-admin backend redesign.

## What Changed In Session Builder And Quick Activity Generation Quality

The current brain was clarified as deterministic/template-based.

Current state:

```text
No FAISS.
No RAG.
No Bedrock production generation.
No vector search.
No broad AI-service redesign.
```

The deterministic generation-quality slice improved the 3v3 defending / Duck Duck Goose multi-intent prompt family.

Quick Activity now combines multi-intent prompts better. For example, a prompt asking for 3v3 defending plus a Duck Duck Goose-style game should preserve both ideas instead of collapsing into generic filler.

Full Session now follows a stronger four-part run order:

1. activation / warm-up game
2. main activity
3. main progression
4. competitive final game / mini tournament

The goal is for Activity 3 to feel as important as Activity 2, and for Activity 4 to close with real competitive energy instead of a weak generic final game.

## What Changed In Diagrams And UX

Deterministic activity diagrams were added to the coach-facing output.

Current diagram behavior:

- Activity 1 gets a simpler visual.
- Activities 2 and 3 can show richer phase visuals.
- Activity 4 uses a compact final-game format card instead of a full diagram.

This is not a full graphics engine. It is a deterministic diagram/formatting step that makes current output more readable and more useful.

Session Builder gained guided Objective controls:

- primary objective
- specific focus
- Coaching note / activity idea
- Coaching note only option

The visible Session Builder language now separates:

```text
Objective = what the session teaches
Coaching note / activity idea = context, constraints, ideas, or coach preference
```

The separate visible Brainstorming box was removed from Session Builder. The builder still submits one combined theme/context string into the existing generation flow.

Quick Activity input was renamed to:

```text
Coaching note / activity idea
```

Standard equipment label was corrected to:

```text
Pinnies
```

The frontend still recognizes legacy or typo aliases such as:

- pennies
- bibs
- vests

## What Did Not Change / Guardrails Preserved

This block deliberately avoided backend platform redesign except for the deterministic generation-quality slice.

Preserved guardrails:

- no client-supplied tenant scope
- no auth redesign
- no tenancy redesign
- no IAM redesign
- no CDK redesign
- no Cognito redesign
- no DynamoDB schema redesign
- no RAG or vector-search claim
- no FAISS claim
- no Bedrock production-generation claim
- no broad AI-services claim

The backend generation-quality change was deterministic/template-based.

Frontend product/runtime slices did not change backend API contracts, auth boundaries, tenant derivation, IAM, CDK, Cognito, RAG, FAISS, Bedrock, or AI services.

## Validation Evidence

Validation pattern for this block:

- GitHub PR checks passed across the block.
- Frontend TypeScript checks passed where run.
- Frontend builds passed where run.
- Frontend build continued to show the existing Next.js warning about `middleware` being deprecated in favor of `proxy`.
- Backend API tests passed for the deterministic generation-quality slice.
- Copy/UI slices used `git diff --check` and app build checks.

Representative validation from the final copy slices:

```text
git diff --check
npx.cmd tsc --noEmit
npm.cmd run build
```

Representative backend validation from the generation-quality slice:

```text
backend API tests passed for session-builder deterministic generation behavior
```

## Deployment Notes

Backend deploy was needed only for the deterministic generation-quality change.

Amplify deploy was needed for frontend/runtime UI and copy changes.

No separate backend deploy was needed for pure frontend copy and UX slices.

No infrastructure deploy was part of the frontend/product-language slices in this block.

## Risks And Follow-Ups

Risks:

- The Club Portal is still a shell and should not be mistaken for finished club-admin management.
- Public start-role choices are product intent only and must not become authorization.
- Current generation quality is improved but still deterministic and limited.
- Diagram output is deterministic and useful, but not yet a full editable diagram system.
- Existing browser-local data may include old values, but the current frontend normalizes known equipment typo aliases and scopes local hints by user/tenant context.

Follow-ups:

- Continue replacing KSC-specific language with Club Vivo language where it is not intentionally pilot-specific.
- Design real verified/supported club membership, invite, and role flows before granting official club access.
- Keep improving deterministic generation tests around multi-intent prompts.
- Improve diagram coverage after session text quality is consistently strong.
- Decide when the current `middleware` convention should be migrated to the Next.js `proxy` convention.
- Keep RAG/vector/Bedrock work parked until the curated knowledge need and source model are ready.

## Recommended Next Block

Recommended next block:

```text
Club Vivo pilot readiness: role-safe club workspace depth, coach-facing output QA, and public-to-protected journey polish.
```

Suggested scope:

1. Keep Club Portal clearly shell-level unless backend role/membership work is intentionally started.
2. Smoke test a new individual coach account to confirm no KSC/test hints leak into the workspace.
3. Smoke test an admin-like account to confirm Club Portal landing and Coach Workspace access still work.
4. Add a small generation QA matrix for Quick Activity, Drill, and Full Session.
5. Review saved-session output after the diagram changes.
6. Decide whether the Next.js middleware/proxy warning should be handled as a focused runtime cleanup slice.

## Final Status

This block successfully clarified Club Vivo's product identity and improved the current coach-facing generation experience without overclaiming the architecture.

Club Vivo is now positioned as:

```text
a free-to-start coaching platform with individual and club workspace paths
```

The current generation brain is now positioned honestly as:

```text
deterministic/template-based session generation with improving prompt-signal handling
```

That is the right baseline for the next New SIC block.
