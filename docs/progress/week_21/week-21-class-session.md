# Week 21 — Coach Workspace Hardening for KSC

## Week theme

Turn SIC from a narrow Session Builder surface into a more coach-ready **Coach Workspace** for Kensington Soccer Club, while preserving SIC's existing multi-tenant, fail-closed, product-first architecture.

---

## Why this week matters

SIC's current wedge is the **Session Builder**, but the product direction already points toward a coach-facing workspace that helps coaches turn real-world constraints into usable sessions, save and reuse work, and grow into team and club workflows over time.

For KSC, that means SIC must support:

- **Travel coaches** with assigned teams, fixed age bands, and KSC travel methodology
- **OST coaches** with school-based mixed-age groups and US Soccer-style play-and-fun methodology
- **Coach admins** who need visibility into coach activity and controlled access to methodology management

Week 21 should therefore focus less on a generic "production lite release" and more on making the **coach experience, team/program model, and methodology model** fit real KSC workflows.

---

## Week 21 high-level goal

By the end of Week 21, SIC should have a frozen and implementation-ready **Coach Workspace v1** direction that supports:

- one-time coach setup
- returning-coach fast session creation
- KSC program-aware teams
- methodology-aware generation defaults
- full session and quick drill generation modes
- coach library and uploads direction
- coach-admin visibility and methodology management direction

This week should keep SIC aligned with the existing principles:

- product-first thin slices
- one shared coach-facing app
- tenant context derived only from verified auth and authoritative entitlements
- no client-trusted tenant identity
- no unnecessary widening of infra, IAM, or auth boundaries

---

## Strategic outcome for Week 21

At the end of the week, SIC should be able to clearly answer these questions:

1. What is the **first-time coach** experience?
2. What is the **returning coach** experience?
3. How does SIC distinguish **Travel** vs **OST** without creating separate apps?
4. How does SIC store and apply **methodology** correctly?
5. What can **coach admins** see and manage?
6. What are the minimum frontend and backend changes needed to make KSC pilot success more realistic?

---

## Product direction frozen for this week

### 1. One app, two experience layers

SIC remains one shared coach-facing web app.

Inside that app, there are two experience layers:

- **Coach Workspace**
- **Coach Admin Workspace**

There should **not** be separate Travel and OST apps.

---

### 2. Team-level program distinction

The Travel vs OST distinction should live primarily on the **team**, not the coach.

A coach may work with both program types.

Each team should support:

- `programType = travel | ost`
- `methodologyId`
- age configuration
- default duration
- default environment and equipment references

---

### 3. Two generation modes

Session creation should offer two visible paths:

- **Quick Drill**
- **Full Session**

This allows SIC to support both:

- full structured training plans
- fast game-like ideas and small activities

---

### 4. One-time setup, fast repeat usage later

New coaches should complete setup once.

Returning coaches should log in and land on a **Session Builder block** that lets them:

- select a team
- choose Quick Drill or Full Session
- set time
- add objective and constraints
- optionally reuse previous work
- generate quickly

---

### 5. Methodology is a real product object

Methodology should not be treated as an invisible prompt detail.

SIC should move toward a **Methodology Pack** model where:

- Travel teams can default to KSC Travel methodology
- OST teams can default to KSC OST / US Soccer methodology
- coach admins can review, update, and add methodology packs
- generated artifacts can carry methodology metadata for reuse and review

---

## Week 21 recommended sequence

Before major coding starts, Week 21 should begin with a **targeted alignment pass** to freeze product direction and source-of-truth docs.

After that, the week should move through three high-level work areas:

1. **Product and architecture alignment**
2. **Coach Workspace frontend hardening**
3. **Methodology and admin governance shaping**

---

## Day 1 — Product shape and source-of-truth alignment

### Day 1 objective

Freeze the new KSC-aware Coach Workspace direction in the core SIC product and architecture docs before making major implementation changes.

### Day 1 outcomes

By the end of Day 1, the repo should have a documented and explicit answer for:

- new coach setup flow
- returning coach landing flow
- team-level program type
- methodology inheritance/defaulting
- coach-admin visibility and management scope
- what is in scope for Week 21 and what is not

### Day 1 planning decisions to lock

#### A. First-time coach flow

1. Log in
2. Create coach profile
3. Create one or more teams
4. Choose `travel` or `ost` per team
5. Add age information
6. Add default environment and equipment
7. Save everything for future reuse

#### B. Returning coach flow

1. Log in
2. Land on Session Builder block
3. Select team
4. Choose Quick Drill or Full Session
5. Add objective, time, and today's constraints
6. Generate
7. Review, edit, save, export or print

#### C. Team rules

Freeze the idea that one coach may own or work with multiple teams, and those teams may belong to different KSC program types.

#### D. Methodology rules

Freeze the rule that the team carries the default methodology.

#### E. Time rules

Default can remain 60 minutes, but coaches must be able to modify session length each time.

### Day 1 suggested documentation updates

#### Existing files likely to update

- `docs/progress/build-progress/roadmap-vnext.md`
- `docs/product/sic-coach-lite/sic-session-builder.md`
- `docs/vision.md`

#### New docs likely to add

- `docs/product/sic-coach-lite/coach-workspace-v1.md`
- `docs/product/sic-coach-lite/ksc-program-types-and-methodology-v1.md`
- `docs/progress/week_21/day1-scope-lock.md`

### Day 1 acceptance criteria

- Week 21 is documented as a Coach Workspace hardening week, not only a release week
- Travel and OST are explicitly documented as team-level program types
- Quick Drill and Full Session are explicitly documented as first-class modes
- coach-admin capabilities are documented at a high level
- coach setup and returning-coach flow are explicitly described

---

## Day 2 — Coach Workspace frontend hardening

### Day 2 objective

Make `apps/club-vivo` feel more like a real soccer-coach workspace and less like a narrow session form.

### Day 2 outcomes

By the end of Day 2, the frontend direction should be implementation-ready or partially implemented for:

- first-time setup wizard
- returning-coach landing experience
- Session Builder block
- team/program-aware selection
- Quick Drill vs Full Session selection
- time/objective/constraints flow

### Day 2 frontend direction

#### A. First-time setup wizard

This setup should gather and save:

- coach profile
- teams
- team program type
- age information
- default environment
- default equipment

#### B. Returning-coach landing experience

The first meaningful screen for a returning coach should be a **Session Builder block**.

That block should include:

- team selector
- mode selector
- time selector
- objective input
- today's constraints
- optional brainstorm text area
- reuse previous session or drill option
- generate button

#### C. Team selector behavior

When a coach selects a team, the UI should make the program context visible, for example:

- KSC Travel
- KSC OST

The coach should not have to manually re-select the methodology every time if the team already has a default.

#### D. Time selector behavior

Default session length can remain 60 minutes, but it must be editable.

#### E. Reuse behavior

Coaches should have a clear path to reuse prior content rather than always starting from zero.

### Day 2 likely repo areas to inspect or modify

- `apps/club-vivo/app/`
- `apps/club-vivo/components/`
- `apps/club-vivo/lib/`

### Day 2 suggested UI building blocks

- `SessionBuilderBlock`
- `ModeSelector`
- `TeamSelector`
- `TimeSelector`
- `ObjectiveInput`
- `ConstraintChips`
- `RecentContentPicker`
- `FirstTimeSetupWizard`

### Day 2 acceptance criteria

- new coach flow is simpler and guided
- returning coach can start generation in a few steps
- program type is visible via team context
- Quick Drill and Full Session are both visible and understandable
- session duration is editable
- the frontend direction clearly improves coach usability

---

## Day 3 — Methodology model, coach-admin governance, and contract shaping

### Day 3 objective

Freeze the controlled KSC methodology model and the first coach-admin governance direction without widening SIC beyond a realistic Week 21 slice.

### Day 3 outcomes

By the end of Day 3, SIC should have a clear direction for:

- how methodology is stored
- how methodology is selected
- what coach admins can do
- how generated and uploaded content should be saved and classified
- what minimum backend changes are truly needed next

### Day 3 planning decisions to lock

#### A. Methodology Pack shape

Methodology should become a durable concept, not just an informal prompt bias.

A Methodology Pack may eventually include:

- methodology name
- program fit
- coaching language preferences
- session structure preferences
- age or safety defaults
- drill or game archetype preferences
- progression and regression style
- active/inactive state
- versioning or change notes later if needed

#### B. Team-methodology mapping

Freeze these rules:

- each team has one default `methodologyId`
- `programType` strongly suggests the default methodology
- coaches normally inherit the team methodology
- coach admins can update or add methodology packs

#### C. Coach-admin workspace direction

Coach admins should have visibility into at least:

- what coaches are generating
- what coaches are saving
- what coaches are uploading
- which teams are tied to which program types and methodologies
- methodology management surface

#### D. Library and uploads direction

SIC should support a future-facing coach library that includes:

- SIC-generated sessions
- SIC-generated drills
- coach-uploaded sessions
- coach-uploaded drills

The system should make it possible to distinguish generated content from coach-sourced uploads.

### Day 3 suggested documentation updates

#### New or updated docs likely needed

- `docs/architecture/coach-workspace-architecture-v1.md`
- `docs/api/coach-workspace-v1-contract.md`
- `docs/api/methodology-pack-v1-contract.md`
- `docs/progress/week_21/closeout-summary.md`

#### ADR consideration

If Week 21 introduces a meaningful durable decision about methodology ownership, admin management, or a new product persistence boundary, consider adding an ADR.

### Day 3 acceptance criteria

- methodology is treated as a real product concept
- team-program-methodology relationships are clearly defined
- coach-admin visibility and editing power are documented
- generated content and uploaded content direction is defined
- next-step frontend and backend work is clearer and better bounded

---

## Product objects to freeze during Week 21

To reduce confusion and prevent drift, Week 21 should explicitly freeze the shape of the following high-level objects:

- `CoachProfile`
- `TeamProfile`
- `EnvironmentProfile`
- `EquipmentProfile`
- `MethodologyPack`
- `QuickDrillRequest`
- `FullSessionRequest`
- `SavedContentItem`
- `CoachUploadItem`

These do not all have to be fully implemented in Week 21, but their purpose and placement should be explicit.

---

## Roles to freeze during Week 21

- `coach`
- `coach_admin`
- `platform_admin`

### Role direction

#### Coach
Can create and manage their own working setup and content.

#### Coach Admin
Can view broader activity and manage methodology.

#### Platform Admin
Stays separate from normal tenant coaching operations and should not be confused with KSC coach admins.

---

## High-level out-of-scope list for Week 21

To keep the slice realistic, Week 21 should **not** turn into a broad platform rewrite.

Out of scope unless a narrow, justified need appears:

- major tenancy model changes
- new auth model changes
- new entitlements model changes
- broad IAM/CDK expansion without a strong reason
- heavy analytics or ML platform work
- a second app for Travel or OST
- a broad RAG or chatbot platform expansion beyond the existing product direction

---

## Focused repo audit recommended before or during Week 21

A full repo-wide audit is not necessary.

A **focused product and flow audit** is recommended across the most relevant surfaces:

### Frontend
- `/login`
- `/sessions/new`
- session list flow
- session detail flow
- existing team selection or session generation surfaces

### Backend
- `services/club-vivo/api/session-packs/`
- `services/club-vivo/api/sessions/`
- `services/club-vivo/api/teams/`
- `services/club-vivo/api/src/domains/session-builder/`
- `services/club-vivo/api/src/domains/teams/`

### Docs
- `docs/product/sic-coach-lite/`
- `docs/api/`
- `docs/architecture/`
- `docs/progress/build-progress/`

The purpose of this audit is not to clean everything. It is to identify what already exists, what is missing, and what should stay unchanged.

---

## Guidance on using Codex or AI coding tools during Week 21

### Good use cases

Use Codex or similar tools for:

- frontend component scaffolding
- repetitive TypeScript refactors
- form and UI state scaffolding
- simple DTO and validator drafts
- admin list or dashboard scaffolds
- non-sensitive view layer speed-up

### Human review required

Do not let AI tools lead on:

- tenancy boundary changes
- auth boundary changes
- entitlements logic
- IAM changes
- CDK/infra changes
- repository-level data isolation decisions

AI tools can accelerate delivery, but Week 21 should preserve human review for sensitive platform boundaries.

---

## Source-of-truth suggestions to stay aligned with the new direction

### Highest-priority files to update

1. `docs/product/sic-coach-lite/sic-session-builder.md`
   - should explicitly reflect coach setup, team program type, methodology, quick drill mode, and returning-coach flow

2. `docs/progress/build-progress/roadmap-vnext.md`
   - should reflect Week 21 as Coach Workspace hardening for KSC rather than only production-lite release work

3. `docs/vision.md`
   - may benefit from clearer Coach Workspace wording between Session Builder and broader team workflows

### Possible additional updates

4. `docs/architecture/platform-constitution.md`
   - likely only a light wording update if you want Coach Workspace named more explicitly in active priorities

5. `SIC - Product & Platform Architecture Governor GPT`
   - should likely be updated to recognize:
     - Coach Workspace as an explicit product stage
     - methodology packs as tenant-scoped product objects
     - Travel vs OST as program-driven defaults inside one shared app
     - Quick Drill and Full Session as first-class modes
     - coach-admin governance as part of the product direction

---

## What success looks like at the end of Week 21

By the end of Week 21, SIC should not necessarily have every feature fully shipped, but it should be **more coherent, more coach-friendly, and more aligned**.

A successful Week 21 means:

- the product direction is frozen clearly in docs
- frontend work is pointed at a real coach workspace
- KSC Travel and OST are supported inside one shared product path
- methodology is governed, not accidental
- coach-admin needs are acknowledged and structured
- the repo stays aligned with the product direction instead of drifting

---

## One-sentence summary

**Week 21 is about reshaping SIC into a real KSC-ready Coach Workspace, where new coaches set up once, returning coaches move fast, teams carry the right program and methodology context, and coach admins can guide quality without breaking SIC's product-first and tenant-safe foundation.**
