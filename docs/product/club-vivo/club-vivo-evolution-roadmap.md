# Club Vivo Evolution Roadmap

## 1. Status

This is a long-lived product evolution guide for Club Vivo inside the Sports Intelligence Cloud platform.

It is product direction, not shipped runtime behavior. It should guide future slices, closeouts, ADRs, and implementation planning without claiming that proposed Training Prescription capabilities already exist in production.

## 2. North Star

SIC is the platform. Club Vivo is the current coach-facing product.

Club Vivo should help soccer coaches and clubs move from real-world constraints and evidence to better training sessions that are easy to understand, save, review, and export.

The product should become more intelligent over time while staying practical for grassroots and low-budget clubs first.

## 3. Current Product Foundation

Session Builder remains the active runtime wedge.

Coach Workspace is the surrounding product experience where coaches should create, review, manage, and return to session work.

The current foundation is:

- soccer-only session generation
- structured coach intake
- tenant-safe authenticated access
- validated session outputs
- save and export paths
- diagram-oriented activity output

Future evolution should extend this foundation rather than create a separate app, backend service, or tenancy path without a clear ADR.

## 4. Strategic Product Chain

The long-term Club Vivo product chain is:

1. constraints -> session
2. team context -> better session
3. methodology -> club-aligned session
4. match/performance evidence -> Training Brief
5. Training Brief -> objective
6. objective -> activities/drills
7. activities -> structured diagrams
8. session -> save/review/export
9. coach feedback -> future intelligence

Each step should produce usable coach value before the next layer expands.

## 5. Active Scope

Active scope is soccer/football/fútbol only.

The starting market is:

- grassroots coaches
- low-budget clubs
- assistant coaches
- small clubs and academies
- nonprofit or community programs

The proposed next evolution is a soccer-only Training Prescription Layer that helps convert match, team, performance, and coach evidence into a Training Brief and practical session direction.

## 6. Parked Scope

The following are parked outside active Club Vivo scope:

- futsal
- multi-sport support
- professional-only workflows
- paid data-provider dependency
- broad AI/ML infrastructure before product need is proven
- raw generated images as authoritative drill diagrams

These ideas may return later, but they should not pull the current roadmap away from the soccer-first Session Builder and Training Prescription path.

## 7. Product Pillars

### Practical coach value

Club Vivo should help a coach build something useful for the next session, not only produce theory.

### Club methodology alignment

Over time, Club Vivo should help clubs keep sessions consistent with their principles, language, age-group expectations, and coaching model.

### Evidence-to-training bridge

The Training Prescription direction should help translate observations and performance evidence into a clear objective and training action.

### Five-star diagrams

Diagrams are a five-star requirement. Activity visuals should be driven by structured sequence data that can be validated and rendered, not by raw generated images as the source of truth.

### Football intelligence and learning

Club Vivo should develop a simple football intelligence language that helps coaches and players understand why a training objective matters.

The proposed 7Q direction should support tactical classification, Training Brief reasoning, Session Builder objectives, activity recommendations, DiagramSequence intent, coach education, player learning, and future engagement surfaces.

This is proposed product direction only. It is not shipped runtime behavior.

### Low-cost scalability

The product should start with minimal required inputs and affordable infrastructure, then scale toward academies and professional environments as richer evidence and workflows become useful.

## 8. Build Order

The preferred build order is:

1. strengthen the existing Session Builder and Coach Workspace path
2. improve saved session review and export quality
3. align diagrams around structured sequence data
4. add lightweight Training Brief intake
5. map Training Brief output into Session Builder objectives and activities
6. add coach review, edit, and feedback loops
7. add lightweight football intelligence classification through 7Q tags and coach-facing learning prompts
8. introduce methodology-aware and evidence-aware intelligence only after the core workflow proves value

This order can change when a smaller slice delivers clearer product value, but platform expansion should not outrun the user workflow.

## 9. Decision Rules

- Prefer thin vertical product slices over broad platform construction.
- Extend Session Builder unless there is a documented reason to create a new path.
- Treat Training Prescription as upstream guidance for Session Builder, not a replacement.
- Use structured, validated data for diagrams and activity outputs.
- Keep grassroots and low-budget usefulness ahead of elite-only sophistication.
- Make future academy and professional scaling possible without requiring it now.
- If a decision changes architecture, tenancy, AI/ML operating model, or repo structure, capture it in an ADR or architecture note.

## 10. Non-Negotiables

Future work must preserve:

- tenant isolation
- server-derived tenant context
- fail-closed authentication and authorization
- validation before persistence or rendering
- structured observability
- cost-awareness
- product value before platform expansion
- soccer-only active scope until explicitly changed
- no separate Training Prescription app, backend service, or tenancy path

Training Prescription must not weaken tenancy, bypass validation, or create unreviewable AI output paths.

## 11. Near-Term Build Runway

Near-term work should stay focused on proving the evidence-to-training bridge:

- Training Brief intake draft
- Training Brief validation model
- mapping from brief to Session Builder objective
- one to three activity recommendations from a brief
- diagram sequence validator alignment
- diagram-first activity output prototype
- save/review/export continuity through the existing Coach Workspace
- coach feedback capture after session use
- optional 7Q tagging for Training Briefs and activity recommendations
- coach-facing learning prompts connected to football intelligence categories
- future 7Q learning-surface exploration kept separate from current runtime claims

These are roadmap slices, not a claim of current shipped behavior.

## 12. Finish-Line Definition

The current evolution phase is successful when Club Vivo can credibly support this loop:

1. a coach enters constraints and/or evidence
2. Club Vivo proposes a clear training objective
3. the coach receives practical activities with structured diagrams
4. the session can be saved, reviewed, and exported
5. coach feedback can improve future session guidance

The first finish line is not full automation. It is a trusted, tenant-safe workflow that helps real soccer coaches make better training decisions faster.

## 13. Source-Of-Truth Links

Read this roadmap with:

- `docs/product/club-vivo/README.md`
- `docs/product/club-vivo/session-builder.md`
- `docs/product/club-vivo/coach-workspace.md`
- `docs/product/club-vivo/training-prescription-layer.md`
- `docs/product/club-vivo/football-intelligence-learning-layer.md`
- `docs/product/club-vivo/future/7q-board-game-learning-surface.md`
- `docs/product/club-vivo/coaching-session-design-standard.md`
- `docs/product/club-vivo/session-generation-quality-standards.md`
- `docs/api/session-builder-v1-contract.md`
- `docs/api/training-brief-v1-contract.md`
- `docs/api/diagram-rendering-contract-v1.md`
- `docs/architecture/club-vivo/diagram-sequence-spec-v1.md`
- `docs/architecture/platform-constitution.md`
- `docs/architecture/architecture-principles.md`
- `docs/architecture/tenant-claim-contract.md`
- `docs/architecture/club-vivo-source-map.md`
- `docs/architecture/repo-structure.md`
- `docs/adr/ADR-0011-soccer-only-training-prescription-layer.md`

If this roadmap conflicts with shipped source code or higher-order platform rules, the source code and platform source-of-truth docs govern until an explicit implementation change is made.
