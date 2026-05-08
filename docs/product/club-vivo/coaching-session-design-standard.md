# Club Vivo Coaching Session Design Standard

## 1. Purpose

Club Vivo should help coaches and sport organizations turn messy ideas into practical, safe, fun,
game-like, coach-ready sessions.

Club Vivo is not just a text generator. It should become a coaching workspace that helps coaches
plan, organize, save, reuse, and improve their coaching work. The product should support the real
planning process: rough ideas, team context, equipment limits, club methodology, saved work, and
the need to walk onto the field with something usable.

## 2. Problems We Are Solving

### Coach problem

Coaches often have limited time, mixed experience, and messy ideas. They need help turning those
ideas into structured, usable sessions they can run with confidence.

### Club problem

Clubs need coaching consistency across teams, age groups, and coaches. They need a way to share
methodology, equipment context, team context, and saved work so coaches are not starting over every
week.

### Athlete problem

Kids and athletes need sessions that are active, fun, safe, age-appropriate, and connected to the
real game. They should spend less time waiting and more time learning through play, decisions, and
competition.

### Organization problem

Small clubs, nonprofits, schools, and academies often cannot afford expensive platforms, but still
need structure, continuity, and coaching memory.

## 3. What the Current Brain Is Today

The current Club Vivo generation brain is mostly deterministic/template-based. It is not true
FAISS, not true RAG, and not a live LLM-first generator.

Current flow:

```text
coach input
-> form context
-> prompt signal detection
-> activity archetype detection
-> deterministic session templates
-> coach-ready output
```

This is okay for now. A deterministic approach is safer, cheaper, testable, and easier to improve
step by step. It lets the product define coaching standards before adding more open-ended generation.

## 4. Future Brain Direction

Phase 1: Deterministic coaching standards and tests.

Phase 2: Curated SIC knowledge bank with activity archetypes, coaching patterns, and sport-specific
session examples.

Phase 3: Club methodology/source settings that influence generation.

Phase 4: RAG or vector search only when there is a real knowledge need.

Phase 5: Hybrid LLM generation with guardrails, validation, and deterministic output checks.

Do not jump to broad RAG before we know what knowledge coaches actually need. The product should
first learn which coaching patterns, club standards, age-band rules, and activity examples improve
the output.

## 5. What a Great Session Should Do

A great session should:

- be easy for a coach to run
- match the age group
- match the time available
- match the space and equipment
- keep players active
- avoid long lines
- be game-like
- have a clear objective
- progress from simple to more game-realistic
- end with competition or a real game moment
- include coaching cues and what to watch for
- include progressions and regressions
- be safe and adaptable

## 6. Standard Full Session Structure

For a 60-minute session, use this standard:

Activity 1: Simple game-like activation that introduces the session theme.

Activity 2: Main activity 1. High-quality theme-focused practice.

Activity 3: Main activity 2. Same importance as Activity 2. Should be a progression, variation, or
different game condition.

Activity 4: Final game, mini tournament, or competitive close that applies the theme. This block
should not need a full tactical diagram; the coach needs the game format, teams, scoring, and final
constraint.

Activity 1 should not be a boring generic warm-up. Activity 3 should not be weaker than Activity 2.
Activity 4 should not be just "water break + final game." It should be a real competitive close.

## 6a. Objective, Coach Notes, Equipment, and Diagram Clarity

The Objective section is for what the session is teaching. It should describe the learning focus
the coach wants players to improve.

Coaching note / activity idea is for today's context, constraint, coach preference, or extra idea.
Examples include player count, field limits, preferred activity style, team needs, or a specific
idea the coach wants included.

Equipment should be specific and direct. Generated coach-facing setup should avoid vague lists such
as "Pugg goals, small goals, target goals, or cone gates." If the coach selects equipment, the
generator should prefer that equipment in the setup. If no equipment is selected, the generator may
choose simple standard equipment, but should still write one clear setup choice. If a session would
be better with missing equipment, suggest it as an optional coaching note rather than as a vague
setup list.

Diagrams should include a clear start cue, ball cue when relevant, movement cue, and a short "how
to read/play this" caption. Coaches should be able to see where players start, where the ball
starts, what action begins the activity, where the main movement goes, and how the action scores or
finishes.

## 6b. Diagram Storytelling v1

Diagram Storytelling v1 keeps diagrams lightweight, deterministic, SVG/React/CSS-based, and
export-friendly. It does not require video, image generation, external storage, or new backend
generation logic.

A static diagram is the setup view: where the space, players, ball, and equipment begin. A
step-based or animated diagram shows how the activity works. The story should move through setup,
trigger, main action, and score/reset.

Activity 1 diagrams should stay simple and activation/warm-up oriented. Activity 2 diagrams should
show the first main learning activity. Activity 3 diagrams should show a progression, transition,
recovery, or harder decision, and should not visually repeat Activity 2. Activity 4 should stay as
a competitive final-game card only, not a full tactical diagram.

Diagram Storytelling Polish v2 keeps the SVG itself minimal. Diagrams should not overload the field
view with text; use short labels only when they add meaning, such as Start, Ball, Play, Press,
Recover, Score, or Reset. Put extra explanation in the caption below the SVG.

Activity 1 should stay lighter and use only Setup and Action story views. Activity 2 and Activity
3 should use Setup, How to play, and How to score / reset. Activity 2 should show the first main
activity, while Activity 3 should show a visibly different progression, recovery, counter, or second
decision. The legend should explain the cone-gate symbol: two yellow cone dots connected by a short
line means gate.

## 7. Quick Activity Standard

Quick Activity should usually produce one strong activity that a coach can run fast.

It should include:

- setup
- how to start
- how to run it
- rules/scoring
- coaching cues
- what to watch for
- progression
- regression
- safety/space adjustment

If a coach asks for multiple ideas in Quick Activity, the system should either:

- combine the ideas into one strong activity when possible, or
- later route/offer Session Builder for a multi-activity plan.

## 8. Drill Mode Standard

Drill mode should not mean boring lines or isolated repetition by default.

A good drill should still feel game-like when possible.

It should include:

- clear setup
- repeated action
- decision-making when possible
- scoring or success condition
- coaching cues
- progression
- regression
- safety/space adjustment

## 9. Multi-Intent Prompt Handling

Coaches often type messy prompts with multiple requests.

Example:

```text
create a drill 3v3 focus of defending, also add a game-like drill similar to duck duck goose
```

The brain should detect:

- 3v3
- defending
- drill
- game-like activity
- duck-duck-goose / chase / reaction pattern

Then it should decide:

- Quick Activity: combine into one strong activity if possible.
- Full Session: distribute across warm-up, main activities, and final game.
- Drill Mode: create one focused drill that includes the requested theme.

## 10. Visual Output Standard

The output should look like a field handout, not a raw AI answer.

Coach-facing output should include:

- title
- objective
- age/team context
- duration
- equipment
- run order
- activity cards
- setup
- how to start
- how to run
- rules/scoring
- coaching cues
- what to watch for
- progression
- regression
- safety/space adjustment
- optional diagram area
- export/save controls

Avoid internal prompt fragments.

## 11. Club and Organization Value

Club Vivo should give a club:

- shared methodology
- coach consistency
- saved session library
- coach workspace inside club workspace
- team context
- equipment context
- future coach/admin management
- future analytics/insights
- easier onboarding for new coaches

The club value is not only session generation. It is the ability to preserve coaching work, align
coaches, and make planning easier across a season.

## 12. Athlete Value

Club Vivo should improve training for kids and athletes through:

- more touches
- more play
- clearer learning
- less waiting
- safer activities
- more competition
- more confidence
- more joy in training

The athlete experience is the final test. A generated session is only good if it creates better
time on the field.

## 13. Quality Checklist for Generated Output

Future developers can use this checklist when evaluating output:

- Does the session match the coach prompt?
- Did it handle all important prompt intents?
- Is it age appropriate?
- Is the setup specific?
- Are the activities game-like?
- Are players active most of the time?
- Is there a clear scoring/win condition?
- Does the session progress logically?
- Is Activity 3 as important as Activity 2?
- Is the final activity a real game or competitive close?
- Are coaching cues useful?
- Are progression/regression included?
- Are safety/space adjustments included?
- Is the output easy to read on the field?

## 14. Implementation Notes for Future SIC Brain Work

Future generator work should:

- parse prompt signals more deeply
- detect multiple intents
- map intents into activity structure
- enforce warm-up/main/main/final-game pattern
- avoid repeated generic text
- use richer activity archetypes
- improve titles
- connect club methodology later
- use RAG only after curated knowledge exists
- validate outputs before showing them to coaches

The implementation should keep product quality visible in tests and review fixtures. Better output
should be measured against coaching usefulness, not only whether data fields are filled.

## 15. Open Questions

- What age-band standards should Club Vivo support first?
- Should activity diagrams be generated, selected from templates, or manually drawn later?
- How should clubs define methodology?
- What does a verified club workspace need beyond the free workspace?
- What should be measured to know if the session worked?
- What sport should be added after soccer?
