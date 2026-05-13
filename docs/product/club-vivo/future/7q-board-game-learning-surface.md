# 7Q Board Game Learning Surface

## 1. Status

Future product exploration.

This is not shipped runtime behavior.

This document defines a possible future 7Q football intelligence learning surface inspired by social board games, Parchís-style movement, tactical challenge cards, and local multiplayer learning.

This document does not create a new app, backend service, tenancy path, authorization model, online multiplayer claim, AI clip-generation claim, or runtime integration claim.

## 2. Purpose

The 7Q Board Game Learning Surface explores how Club Vivo/SIC could teach football intelligence through play.

The purpose is not traditional trivia.

The purpose is to create an engaging learning surface where players, coaches, parents, and teams can practice reading the game through:

- tactical questions
- match-moment decisions
- board-game movement
- challenge cards
- football intelligence categories
- coach-created decks
- team learning prompts
- future SIC-generated learning moments

The product identity should be closer to:

The board game that teaches players how to read football.

## 3. Product Thesis

Many players watch soccer without learning how to read the game.

Many young players train actions without understanding the decisions behind them.

Many parents and families support players but do not always understand the tactical language coaches use.

A 7Q board-game learning surface could make football intelligence social, fun, and repeatable.

The idea is:

SIC organizes football intelligence.
7Q teaches football intelligence.
The board-game layer makes football intelligence fun to practice.

## 4. Relationship To SIC And Club Vivo

This surface is a future add-on direction inside the broader SIC ecosystem.

It should support the Football Intelligence and Learning Layer, but it should not distract from the current Club Vivo execution path.

Current priority remains:

1. Session Builder
2. Coach Workspace
3. Training Prescription
4. Training Brief
5. DiagramSequence
6. save, review, export, and feedback loops

The board-game learning surface should stay parked until the core coach workflow proves enough product value.

## 5. Relationship To 7Q

The board-game surface should use the same working 7Q categories:

1. Ball awareness
2. Space awareness
3. Teammate awareness
4. Opponent awareness
5. Decision selection
6. Defensive transition awareness
7. Attacking transition awareness

Each question, challenge, or match moment should map to one or more categories.

This keeps the game connected to the same football intelligence language used by the coaching product.

## 6. Core Gameplay Concept

The player moves around a board and lands on different types of spaces.

Each space triggers a football intelligence event.

Possible space types:

- 7Q Question
- Match Moment
- Tactical Challenge
- Coach Card
- Team Play
- Chaos Moment
- Reflection Prompt
- Power-Up
- Review Card

The board-game layer should make learning feel like play, not school.

## 7. Example Turn Loop

1. Player rolls dice.
2. Player moves a piece on the board.
3. Player lands on a space.
4. The space triggers a prompt.
5. Player answers or performs the challenge.
6. The game gives feedback.
7. The player earns points, movement, protection, or a tactical advantage.
8. The next player takes a turn.

## 8. Example Prompt Structure

Prompts should follow this pattern:

Situation -> Question -> Decision -> Explanation -> Training Connection

Example:

Situation:

Your team loses the ball in midfield and the opponent starts to attack through the middle.

Question:

What should happen first?

Decision options:

- closest player presses immediately
- everyone runs forward
- goalkeeper leaves the goal
- team spreads wider

Explanation:

The closest player should pressure the ball while nearby teammates protect the central lane and recover compactness.

Training connection:

This connects to defensive transition games and compact recovery activities.

7Q tags:

- defensive transition awareness
- opponent awareness
- space awareness
- teammate awareness

## 9. Possible Game Modes

### 9.1 Local Multiplayer

The first exploration should favor local multiplayer.

This fits family, team, classroom, and club environments.

Possible shape:

- shared device or pass-and-play
- 2 to 4 players first
- simple board
- static question decks
- fast rounds

### 9.2 Player Mode

A player answers questions and completes challenges to improve football intelligence.

### 9.3 Coach Mode

A coach can eventually create decks, assign themes, or choose category emphasis.

### 9.4 Team Challenge Mode

A team can play together before or after training.

### 9.5 Family/Fan Mode

Parents and families can learn the game in simple language.

## 10. MVP Direction

A realistic first MVP should stay very small.

Possible MVP:

- local multiplayer only
- simple board
- static 7Q question deck
- no video
- no online account system
- no backend dependency
- no AI generation
- no SIC runtime dependency
- simple scoring
- simple animations
- coach explanation after each answer

This keeps the surface cheap, testable, and fun before deeper integration.

## 11. Future SIC Integration Possibilities

Future integrations may include:

- Session Builder activities connected to 7Q prompts
- Training Briefs that generate learning prompts
- coach-created learning decks
- team-level challenge decks
- methodology-based question packs
- match-moment review prompts
- DiagramSequence-based visual questions
- player understanding checks
- learning progress summaries

These are future possibilities, not current runtime behavior.

## 12. Methodology Pack Direction

Future versions may allow different methodology packs.

Examples:

- possession pack
- pressing pack
- transition pack
- finishing pack
- defending pack
- grassroots fundamentals pack
- club methodology pack
- Kuyuy methodology pack

These should remain learning presets, not separate apps or separate tenant systems.

## 13. What This Should Not Become Too Early

This should not become:

- a full online multiplayer platform
- a full game studio project
- a separate SIC product before the coach workflow is ready
- a replacement for Session Builder
- a replacement for Training Prescription
- a reason to add heavy infrastructure
- a reason to weaken the Club Vivo roadmap
- a broad multi-sport game
- a marketplace before there is real usage

## 14. Technical Direction If Explored Later

If this becomes an actual prototype later, likely early technical direction:

- mobile-first
- local-first
- React Native with Expo
- local JSON question decks first
- simple state management
- no backend dependency at MVP
- no auth dependency at MVP
- optional future sync through SIC only after product value is proven

A future implementation plan would need its own architecture note or ADR if it introduces shared infrastructure, user accounts, cloud sync, monetization, or tenant-aware content.

## 15. Guardrails

Any future 7Q board-game work must preserve:

- soccer-only scope unless explicitly changed
- product value before platform expansion
- no separate tenancy model
- no separate authorization model
- no separate backend platform without ADR
- no claim of runtime integration until implemented
- cost-awareness
- safe learning content
- coach and player usefulness
- clear separation from current Club Vivo execution priorities

## 16. Source-Of-Truth Relationships

Read this future exploration with:

- `docs/product/club-vivo/football-intelligence-learning-layer.md`
- `docs/product/club-vivo/club-vivo-evolution-roadmap.md`
- `docs/product/club-vivo/training-prescription-layer.md`
- `docs/api/training-brief-v1-contract.md`
- `docs/architecture/club-vivo/diagram-sequence-spec-v1.md`
- `docs/product/club-vivo/session-builder.md`
- `docs/product/club-vivo/coach-workspace.md`
- `docs/architecture/platform-constitution.md`
- `docs/architecture/architecture-principles.md`
- `docs/architecture/repo-structure.md`

If this document conflicts with shipped source code, current roadmap priorities, or higher-order platform rules, shipped source code and higher-order source-of-truth docs govern until an explicit decision changes that.
