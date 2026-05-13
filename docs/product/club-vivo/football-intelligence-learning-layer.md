# Club Vivo Football Intelligence And Learning Layer

## 1. Status

Proposed product direction.

This is not shipped runtime behavior. It defines a future Club Vivo/SIC direction for using the 7 Questions framework as a football intelligence and learning layer.

This document does not create a new app, backend service, tenancy path, authorization model, or runtime claim.

## 2. Purpose

The Football Intelligence and Learning Layer defines how Club Vivo can help coaches, players, and clubs understand the game more deeply.

The goal is to turn tactical understanding into a structured product layer that can support:

- match observation
- tactical classification
- Training Brief creation
- Session Builder objectives
- activity and drill recommendations
- DiagramSequence intent
- coach education
- player learning
- future learning games and challenge surfaces

This layer should help SIC become more than a session generator. It should help SIC teach, organize, and eventually measure football understanding.

## 3. Product Thesis

Coaches do not only need sessions.

Players do not only need activities.

Clubs do not only need saved plans.

They need a shared way to understand the game.

The 7 Questions framework gives Club Vivo a simple football intelligence language that can connect what happens in the match to what coaches train during the week.

The product idea is:

SIC helps identify the game problem.
Training Prescription helps convert the problem into a training direction.
Session Builder helps create the session.
7Q helps coaches and players understand the football logic behind the work.

## 4. Relationship To Existing Club Vivo Direction

This layer supports the current Club Vivo evolution path.

It does not replace:

- Session Builder
- Coach Workspace
- Training Prescription
- Training Brief
- DiagramSequence
- club methodology
- saved sessions
- exports

Session Builder remains the active runtime wedge.

Training Prescription remains the proposed evidence-to-training bridge.

The Football Intelligence and Learning Layer gives those systems a simple tactical understanding model that can help classify game situations and learning outcomes.

## 5. Working 7Q Categories

The initial 7Q categories are working product categories, not final academic doctrine.

They are:

1. Ball awareness
2. Space awareness
3. Teammate awareness
4. Opponent awareness
5. Decision selection
6. Defensive transition awareness
7. Attacking transition awareness

These categories may evolve as Club Vivo tests the model with coaches, players, and real session workflows.

## 6. Category Meaning

### 6.1 Ball awareness

Helps players and coaches understand where the ball is, where it is moving, and how ball location changes the tactical problem.

Example questions:

- Where is the ball?
- Is the ball under pressure?
- Can the ball be played forward, sideways, or backward?
- What changes when the ball moves?

### 6.2 Space awareness

Helps players and coaches understand where useful space exists and which spaces are dangerous.

Example questions:

- Where is the free space?
- Which space should we protect?
- Which space can we attack?
- What space opens after the opponent moves?

### 6.3 Teammate awareness

Helps players and coaches understand support, cover, balance, depth, width, and relationship to teammates.

Example questions:

- Where are my teammates?
- Who is supporting the ball?
- Who is covering behind?
- Are we connected or stretched?

### 6.4 Opponent awareness

Helps players and coaches understand pressure, cover, marking, overloads, and opponent threats.

Example questions:

- Where are the opponents?
- Who is pressing?
- Which opponent is free?
- Where can the opponent hurt us?

### 6.5 Decision selection

Helps players and coaches connect perception to action.

Example questions:

- What is the best action now?
- Should we pass, dribble, shoot, press, delay, recover, or switch?
- What decision fits the moment?
- What decision fits our team objective?

### 6.6 Defensive transition awareness

Helps players and coaches understand what happens when possession is lost.

Example questions:

- What happens if we lose the ball?
- Who pressures first?
- Who protects the middle?
- How do we recover compactness?

### 6.7 Attacking transition awareness

Helps players and coaches understand what happens when possession is won.

Example questions:

- What happens if we win the ball?
- Can we attack quickly?
- Where is the first forward option?
- When should we counterattack or secure possession?

## 7. How 7Q Supports Training Prescription

Training Prescription helps translate evidence into training action.

7Q can help classify the evidence.

Example:

Evidence:

The team lost the ball in midfield and conceded central counterattacks.

Possible 7Q mapping:

- Space awareness
- Opponent awareness
- Defensive transition awareness
- Teammate awareness

Possible Training Brief focus:

Improve central compactness and first pressure after possession loss.

Possible Session Builder direction:

Create a defensive transition session with small-sided transition games, counterpressing cues, and compact recovery diagrams.

This keeps 7Q practical. It is not a theory layer floating above the product. It becomes a way to organize the evidence-to-training bridge.

## 8. How 7Q Supports Session Builder

7Q can later support Session Builder by helping tag:

- session objectives
- activity themes
- coaching cues
- success criteria
- player learning outcomes
- diagram intent
- coach reflection prompts

Example:

Session objective:

Improve first five seconds after losing possession.

7Q tags:

- Defensive transition awareness
- Opponent awareness
- Space awareness

Coach-facing explanation:

Players are learning to react immediately after losing the ball, protect central space, and recover together before the opponent can counterattack.

## 9. How 7Q Supports DiagramSequence

DiagramSequence should eventually express not only movement, but tactical intent.

7Q can help describe why a diagram exists.

Example:

DiagramSequence requirement:

Show turnover, first pressure, central cover, and compact recovery.

7Q tactical intent:

- Defensive transition awareness
- Space awareness
- Teammate awareness

This helps diagrams become teaching tools, not just field pictures.

## 10. How 7Q Supports Club Methodology

Each club may eventually express its methodology through 7Q emphasis.

Examples:

A possession-oriented club may emphasize:

- space awareness
- teammate awareness
- decision selection

A pressing-oriented club may emphasize:

- opponent awareness
- defensive transition awareness
- ball awareness

A counterattacking club may emphasize:

- attacking transition awareness
- space awareness
- decision selection

This keeps methodology inside one shared Club Vivo product path instead of creating separate apps or separate bots.

## 11. Learning Layer Direction

The Football Intelligence and Learning Layer may later support:

- coach-created learning prompts
- player understanding checks
- post-session reflection questions
- pre-match learning cards
- team challenge decks
- age-band learning progressions
- tactical vocabulary development
- future 7Q game surfaces

These are future directions, not current runtime behavior.

## 12. Example End-To-End Flow

Coach evidence:

We struggled to defend counters after losing the ball in the middle third.

7Q classification:

- Defensive transition awareness
- Space awareness
- Opponent awareness
- Teammate awareness

Training Brief recommendation:

Improve compact recovery and central protection after possession loss.

Session Builder objective:

Train the team to react in the first five seconds after losing possession and recover a compact central shape.

Activity recommendation:

Compact Recovery Transition Game.

DiagramSequence intent:

Show ball loss, first pressure, central cover, recovery runs, and reset.

Player learning prompt:

When we lose the ball, who pressures first and who protects the middle?

## 13. MVP Direction

The first product use of this layer should stay small.

Potential MVP direction:

- add optional 7Q tags to Training Brief output
- add optional 7Q tags to activity recommendations
- add coach-facing explanation for why a session objective maps to a 7Q category
- add simple reflection prompts after a saved session

This should not require new infrastructure.

This should not require a new public API until the product need is proven.

## 14. Future Direction

Future versions may include:

- 7Q-tagged activity libraries
- 7Q player learning decks
- 7Q coach education prompts
- 7Q match-moment review
- 7Q-based team understanding reports
- 7Q board-game learning surfaces
- 7Q methodology packs
- 7Q integration with richer video or match evidence

These are future directions and should remain secondary to the current Club Vivo build order.

## 15. Non-Goals

This direction does not:

- claim 7Q runtime behavior is shipped
- replace Session Builder
- replace Training Prescription
- create a separate app
- create a separate backend service
- create a separate auth path
- create a separate tenancy path
- require online multiplayer
- require video analysis
- require paid data providers
- require heavy analytics infrastructure
- generalize beyond soccer
- weaken validation, observability, cost-awareness, or tenant safety

## 16. Guardrails

All future work connected to this layer must preserve:

- soccer-only active scope
- tenant isolation
- server-derived tenant context
- server-side entitlements
- validation before persistence or rendering
- structured observability
- cost-awareness
- product value before platform expansion
- Session Builder as the active runtime wedge
- Training Prescription as the evidence-to-training bridge

## 17. Source-Of-Truth Relationships

Read this document with:

- `docs/product/club-vivo/club-vivo-evolution-roadmap.md`
- `docs/product/club-vivo/training-prescription-layer.md`
- `docs/api/training-brief-v1-contract.md`
- `docs/architecture/club-vivo/diagram-sequence-spec-v1.md`
- `docs/product/club-vivo/session-builder.md`
- `docs/product/club-vivo/methodology.md`
- `docs/architecture/platform-constitution.md`
- `docs/architecture/architecture-principles.md`
- `docs/architecture/tenant-claim-contract.md`
- `docs/architecture/repo-structure.md`

If this document conflicts with shipped source code or higher-order platform rules, shipped source code and the higher-order source-of-truth docs govern until an explicit implementation change is made.
