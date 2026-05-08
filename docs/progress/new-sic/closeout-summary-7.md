# New SIC Closeout Summary 7 - Session Builder Quality and Diagram Storytelling

## Theme

This block moved Club Vivo Session Builder from basic deterministic output toward a more coach-facing
training-session product.

The current generation brain is still deterministic/template-based. The work in this block improved
the quality, structure, visual explanation, and coach usability of that deterministic layer before
any real AI, RAG, Bedrock, FAISS, vector-search, or broader brain architecture work.

## Status

Completed on `main` through PR `#43`.

This closeout covers:

```text
PR #39 through PR #43
commit range: f489d57..39bc557
```

Key merged work:

```text
#39 feat(club-vivo): improve session builder quality
#40 feat(club-vivo): add diagram storytelling
#41 feat(club-vivo): polish diagram storytelling
#42 feat(club-vivo): improve session diagram layout
#43 feat(club-vivo): clarify diagram movement language
```

PR `#38` was the prior closeout docs checkpoint after the Club Vivo alignment block.

## Strategic Objective

The objective was to make the current deterministic Session Builder feel more like a real coaching
tool without widening platform scope.

The target product behavior:

- a full session should read like one progressive coaching story
- activity setup should give direct, coach-ready space and equipment instructions
- diagrams should explain how the activity works, not merely decorate the output
- diagram language should be consistent enough for future export and future structured AI planning

## What Shipped

The block shipped a connected set of backend, frontend, and docs improvements:

- clearer Session Builder product standards
- more progressive deterministic session structure
- direct grid and field setup language
- more specific equipment wording
- deterministic SVG story views for activities
- a clearer text/visual activity layout
- a reusable diagram legend with movement semantics
- a visual ball symbol instead of the word `Ball`
- cleaner diagram captions and reduced SVG label clutter

Activity 4 remained a compact final-game card throughout the block instead of becoming a full
tactical diagram.

## Product Improvements

The product standard now treats a full session as one progressive coaching arc:

- Activity 1 introduces the theme, grid, ball location, movement direction, gates, and scoring idea.
- Activity 2 becomes the first main activity and increases pressure or decision level.
- Activity 3 progresses the learning with transition, recovery, a second decision, or faster tempo.
- Activity 4 applies the same theme in a competitive final-game or mini-tournament format.

The Objective and Coaching note / activity idea distinction is now documented:

- Objective = what the session is teaching.
- Coaching note / activity idea = today's context, constraint, coach preference, or extra idea.

This keeps the coach-facing input model simpler while preserving room for context and constraints.

## Backend/Generator Improvements

The deterministic generator now produces more coach-ready session text.

Important improvements:

- setup text starts with direct grid or field dimensions such as `Grid: 20x18 yards...` or
  `Field: 24x20 yards...`
- rectangular spaces avoid `diameter` language
- selected equipment is preferred directly in setup text
- no-equipment sessions still choose simple standard equipment directly
- vague equipment alternatives such as `Pugg goals, small goals, target goals, or cone gates` are
  avoided in generated coach-facing setup text
- Activity 2 and Activity 3 setup/run language is tested to remain distinct
- final games remain competitive and connected to the session theme

This is still deterministic text generation. It is not a new AI model, RAG system, Bedrock
production generator, FAISS index, vector search, or new data architecture.

## Frontend/Diagram Improvements

Diagrams evolved from placeholders into deterministic SVG story views.

Current story behavior:

- Activity 1 shows `Setup` and `Action`
- Activity 2 shows `Setup`, `How to play`, and `How to score / reset`
- Activity 3 shows `Setup`, `How to play`, and `How to score / reset`
- Activity 4 stays a compact competitive final-game card

Activity cards now use a clearer desktop text/visual layout so the coaching text and diagram story
each get meaningful width. Smaller screens stay stacked and readable.

The story visuals are always visible for non-final activities. The explicit `Show story / Hide
story` and `Open larger diagram` button pattern was removed, while the diagram area itself remains
clickable and keyboard-accessible for opening the larger modal.

The diagram language was clarified:

- blue dots = coached team
- red dots = opposition
- yellow dots = cones/goals/equipment
- yellow `o--o` = cone gate
- solid green arrow = ball/player action
- blue dashed arrow = coached-team support, recovery, or off-ball run
- red dashed arrow = opposition pressure or chase

The ball is now shown as a small visual symbol. Captions carry more explanation so the SVG stays
clean and readable.

## Documentation Updates

The product docs now include standards for:

- Objective meaning
- Coaching note / activity idea meaning
- equipment specificity
- diagram clarity
- diagram storytelling
- diagram polish
- session diagram layout
- movement semantics
- future AI diagram guidance

Updated source-of-truth docs:

- `docs/product/club-vivo/coaching-session-design-standard.md`
- `docs/product/club-vivo/session-generation-quality-standards.md`

The docs now state that future AI diagram generation should produce structured diagram instructions
for the deterministic renderer, not raw images, when that architecture is eventually designed.

## Validation Evidence

Validation used across this block included:

```text
git diff --check
npm.cmd test --prefix services/club-vivo/api -- src/domains/session-builder/session-pack-templates.test.js
npm.cmd test --prefix services/club-vivo/api
cd apps/club-vivo && npx.cmd tsc --noEmit
cd apps/club-vivo && npm.cmd run build
```

The backend generator slices added and maintained focused tests for:

- direct grid/field dimensions
- Activity 1 theme/grid introduction
- distinct Activity 2 and Activity 3 setup/run language
- direct selected-equipment usage
- avoidance of broad equipment `or` lists
- competitive, theme-connected final games

The frontend/docs slices validated TypeScript and production build behavior.

The existing Next.js warning remains: the current `middleware` convention is deprecated in favor of
`proxy`. This warning predates the diagram work and was not changed in this block.

## Deployment Evidence

Deployment requirements by slice:

- PR `#39` changed deterministic generator behavior and required backend deployment; it also had
  frontend/docs impact requiring Amplify deployment.
- PR `#40` was frontend/docs focused and required Amplify deployment only.
- PR `#41` was frontend/docs focused and required Amplify deployment only.
- PR `#42` changed deterministic generator behavior and frontend diagram layout, so it required both
  backend deployment and Amplify deployment.
- PR `#43` was frontend/docs focused and required Amplify deployment only.

Frontend/docs slices after `#42` did not require backend deployment.

## Guardrails Preserved

This block did not introduce:

- auth changes
- tenancy changes
- client-supplied tenant scope
- IAM changes
- Cognito changes
- DynamoDB schema changes
- CDK changes
- Amplify configuration changes
- Bedrock production generation
- RAG
- FAISS
- vector search
- storage changes
- video generation
- image generation
- new package dependencies

Tenancy remains fail-closed and server-derived. The work stayed inside deterministic generation,
frontend diagram rendering, and product documentation.

## Risks and Limitations

Current limitations:

- diagrams are improved deterministic templates, not truly activity-specific tactical diagrams
- player placement and arrow paths are useful approximations rather than generated coaching-board
  plans
- the SIC brain still needs deeper coaching methodology
- age-stage rules for ages 5-21 are not yet deeply modeled
- futsal and soccer session standards need stronger research grounding
- future AI/RAG architecture is still intentionally unbuilt

The improved renderer gives a better target shape for future structured diagram planning, but it is
not itself the final coaching intelligence layer.

## Key Product Lesson

Session quality is not only about better text. A coach needs the session to read as a sequence they
can run on the field:

```text
space -> equipment -> first action -> pressure/decision -> progression -> competitive finish
```

The strongest short-term improvement came from making the deterministic system respect that coaching
sequence and from making the diagrams explain movement in a consistent visual language.

## Recommended Next Block

The next block should be a research and architecture block, not another small UI-polish block.

Recommended scope:

1. Deep research on soccer and futsal session design.
2. Age-stage methodology for ages 5-21.
3. Coach workflow and coach mental model research.
4. Diagram notation standard for static, export-friendly training diagrams.
5. RAG/FAISS/AI generation architecture planning.
6. Structured diagram JSON plan for future renderer-driven diagrams.
7. Revised SIC / Club Vivo source-of-truth docs after research.

The goal should be to design the next real brain before adding Bedrock, RAG, FAISS, vector search,
or AI diagram generation to production.
