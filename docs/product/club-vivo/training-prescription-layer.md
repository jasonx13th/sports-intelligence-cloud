# Club Vivo Training Prescription Layer

## 1. Status

This is a product source-of-truth document for the next intended evolution of Club Vivo/SIC.

It is not shipped runtime behavior yet. It defines direction, scope, and MVP intent for a soccer-only Training Prescription Layer that extends the existing Club Vivo Session Builder direction.

## 2. Purpose

Define how Club Vivo evolves from a constraint-based Session Builder into a layer that helps coaches turn game and performance evidence into the next training objective, session, activity, or drill.

SIC remains the platform. Club Vivo remains the current coach-facing product.

## 3. Product Thesis

Coaches do not only need help generating sessions from constraints. They need help deciding what the next training session should work on.

The Training Prescription Layer should bridge evidence from match play, team performance, player behavior, and coach observations into practical training decisions.

## 4. Target Users

Initial users:

- grassroots soccer coaches
- low-budget clubs
- assistant coaches
- small academies

The model should also scale conceptually toward:

- larger academies
- club technical directors
- professional coaching environments

## 5. The Gap SIC Is Solving

Coaches can increasingly see match data, performance data, video notes, and subjective observations.

The hard part is translation:

- What matters most from the evidence?
- What should the next training objective be?
- Which activity or drill fits the gap?
- How should the activity be constrained?
- How should the coach explain and visualize the movement?

SIC should help close that bridge between evidence and the next training action.

## 6. What The Training Prescription Layer Does

The Training Prescription Layer helps produce:

- a prioritized training need
- a recommended session objective
- suggested activities or drills
- constraints and coaching points
- diagram-ready movement sequences
- a training brief the coach can review, adapt, and save

It should support coach decision-making, not replace the coach.

## 7. Inputs

Possible inputs include:

- match observations
- coach notes
- team or player performance evidence
- recurring tactical or technical problems
- age group and level
- available time, space, equipment, and player count
- team methodology and coaching preferences
- prior sessions and feedback

All tenant, team, and user context must remain aligned with existing SIC tenancy, validation, security, observability, and cost-awareness principles.

## 8. Outputs

Primary outputs:

- training brief
- session objective
- activity or drill recommendations
- structured activity constraints
- coaching points
- diagram sequence data
- exportable or saveable session material

Outputs should be auditable, editable, and safe to persist inside the existing Club Vivo workspace model.

## 9. Training Brief Concept

A training brief is the bridge artifact between evidence and execution.

It should explain:

- the evidence or problem being addressed
- the recommended training focus
- why that focus matters now
- the proposed session or activity shape
- key constraints
- coaching cues
- expected player behavior
- diagram-ready movement requirements

The brief should be short enough for grassroots coaches to use quickly and structured enough to support more advanced environments later.

## 10. Relationship To Session Builder

This direction extends the existing Club Vivo Session Builder. It does not replace it.

The Session Builder remains the execution surface for creating, saving, reviewing, and exporting sessions. The Training Prescription Layer adds an upstream reasoning layer that helps decide what should be built next and why.

## 11. Diagram-First Requirement

Diagrams and movement visuals are a five-star requirement from day one.

Training recommendations must be able to produce structured sequence data that can render diagrams consistently. Diagram generation should not depend on raw generated images as the source of truth.

Main activities should prefer a validated diagram sequence or an explicit reason why no diagram is needed.

The preferred model is:

1. reason about the training need
2. produce structured activity and movement data
3. validate the structure
4. render diagrams from that structure
5. allow coach review and adjustment

## 12. Soccer-Only Scope

The Training Prescription Layer is soccer/football/fútbol only.

It should focus on soccer-specific training language, tactical concepts, activity design, constraints, phases of play, and coach workflows. Multi-sport generalization is not part of this product direction.

## 13. Grassroots-To-Elite Scaling Model

The starting market is grassroots and low-budget clubs.

The product should work with minimal data and practical coach inputs first. It should not require expensive tracking systems, enterprise analytics tools, or heavy infrastructure to be useful.

The same concepts should scale upward by supporting richer evidence over time, including more structured match data, video-derived observations, staff workflows, and methodology libraries.

## 14. Spanish/Futbol Readiness

Spanish localization should be planned for later.

This document does not implement translation or require bilingual runtime behavior now. The product language, data model, and naming choices should avoid blocking future Spanish/futbol support.

## 15. Non-Goals

This direction does not yet include:

- claiming shipped Training Prescription runtime behavior
- replacing the existing Session Builder
- creating a separate Training Prescription app, backend service, or tenancy path
- supporting sports beyond soccer
- implementing Spanish localization
- requiring paid data providers or advanced tracking systems
- building broad RAG/vector infrastructure before product need is proven
- bypassing tenant isolation, validation, observability, or cost controls
- generating raw image diagrams as the authoritative diagram artifact

## 16. First MVP Slice

The first MVP slice should be small:

- accept a coach-entered match or performance observation
- identify the likely training need
- recommend one session objective
- propose one to three activities or drills
- produce structured diagram-ready sequence data for at least one activity
- let the coach review, edit, save, and continue through the existing Session Builder flow

The MVP should prove the evidence-to-training bridge before expanding data sources or automation depth.

## 17. Future Evolution

Future evolution may include:

- richer evidence intake
- session feedback loops
- team trend detection
- player-group recommendations
- methodology-aware prescription
- video-assisted evidence capture
- Spanish localization
- academy and professional workflow support

These are future directions, not current shipped behavior.

## 18. Source-Of-Truth Relationships

This document should be read with:

- `docs/product/club-vivo/session-builder.md`
- `docs/product/club-vivo/session-generation-quality-standards.md`
- `docs/product/club-vivo/coaching-session-design-standard.md`
- `docs/product/club-vivo/methodology.md`
- `docs/api/session-builder-v1-contract.md`
- `docs/api/diagram-rendering-contract-v1.md`
- `docs/architecture/platform-constitution.md`
- `docs/architecture/architecture-principles.md`
- `docs/architecture/club-vivo-source-map.md`

If this document conflicts with shipped source code or higher-order platform rules, the source code and platform source-of-truth docs govern until an explicit implementation change is made.
