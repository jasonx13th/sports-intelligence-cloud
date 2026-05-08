# Club Vivo Session Generation Quality Standards

## Purpose

Club Vivo should generate coach-ready sessions, drills, and quick activities that feel creative,
practical, safe, and game-like.

The SIC generation brain should help coaches move from a rough idea to something they can run on
the field with confidence. Outputs should feel like they came from a strong coach who understands
players, constraints, energy, and learning design.

## Multi-Intent Prompt Handling

If a coach asks for multiple things, the generator should not ignore one request.

Example:

> create a drill 3v3 focus of defending, also add a game-like drill similar to duck duck goose

The generator should detect both intents:

- 3v3 defending drill
- duck-duck-goose-inspired reaction/game activity

When the requested build mode supports multiple activities, both should be placed into the output.
The generator should decide a sensible run order instead of collapsing the prompt into one generic
activity.

## Quick Activity Standard

Quick Activity should usually produce one strong activity.

If the prompt asks for multiple activities, the app should either:

- produce a small multi-activity mini session, or
- ask/route the user to Session Builder later

This needs future design. Until then, Quick Activity should avoid pretending a multi-activity
request was only one idea.

## Full Session Structure Standard

For a 60-minute full session, use this structure:

- Activity 1: simple game-like activation that introduces the session theme
- Activity 2: main activity 1, high-quality theme-focused practice
- Activity 3: main activity 2, same importance as activity 2, progression or different game condition
- Activity 4: final game, mini tournament, or competitive game that closes the day with energy

The two main activities should feel equally important. Activity 3 should not be a throwaway add-on;
it should deepen the theme through a progression, constraint, pressure, or different game condition.
Activity 4 should close with competition and should not require a full tactical diagram.

## Session Builder Input Meaning

Objective means what the session is teaching.

Coaching note / activity idea means today's context, constraint, coach preference, or extra idea.
The generator should treat it as practical planning context, not as a replacement for the learning
objective.

## Equipment Specificity Standard

Equipment should be specific and direct in generated coach-facing setup. Avoid vague equipment
lists such as "Pugg goals, small goals, target goals, or cone gates."

If the coach selects equipment, the generator should prefer that equipment. If no equipment is
selected, the generator may choose simple standard equipment, but should still make one direct setup
choice. If the activity would be better with missing equipment, mention that as an optional coaching
note rather than a vague setup list.

## Diagram Clarity Standard

Diagrams should include a clear start cue, ball cue when relevant, movement cue, and a short
"how to read/play this" caption. Captions and labels should help coaches understand where players
start, where the ball starts, what action begins play, what the main movement/action is, and how to
score or finish the action.

## Diagram Storytelling v1 Standard

Static diagram equals setup view. It should show where the players, ball, space, and equipment
begin.

Step-based diagram equals how the activity works. It should tell a small story: setup, trigger,
main action, and score/reset. This can be a lightweight step display or simple SVG overlay; it
should not require video rendering, image generation, storage, new backend logic, or new
dependencies.

Activity 1 should look like a simple activation or warm-up pattern. Activity 2 should show the main
learning activity. Activity 3 should show a progression, transition, recovery, or harder decision
instead of repeating Activity 2 visually. Activity 4 should remain a compact competitive final-game
card only.

Diagrams must remain deterministic, lightweight, readable when static, and suitable for future
PDF/export use.

Diagram Storytelling Polish v2 should make diagrams feel like a clean coaching board. Do not
overload the SVG with text or label every dot and arrow. Use only short labels when useful, and put
the explanation in the caption.

Activity 1 stays lighter with Setup and Action only. Activity 2 and Activity 3 use Setup, How to
play, and How to score / reset. Activity 2 should show field shape, gates, first pass or first
action, and score/reset direction. Activity 3 should look related but distinct by showing a harder
progression, recovery, counter, or second decision. Activity 4 remains a final-game card only.

The diagram legend should stay short and should explain that two yellow cone dots connected by a
small line means cone gate.

## Drill Mode Standard

A drill output should be specific and usable, but still game-like when possible.

Avoid generic text. Include:

- setup
- how to start
- how to run it
- rules/scoring
- coaching cues
- what to watch for
- progression
- regression
- safety/space adjustment

Drills should describe player roles, starting positions, field shape, ball flow, scoring, restart
rules, and the coach's intervention points clearly enough that another coach could run the activity
without asking follow-up questions.

## Creativity Standard

The system should create high-standard, practical soccer activities, not generic repeated templates.

It should use constraints:

- age band
- team
- equipment
- space
- time
- objective
- coach brainstorming notes

Creative output should still be realistic. The generator should shape games around the available
players, space, and equipment instead of inventing activities that are fun on paper but hard to run.

## Output Presentation Standard

Coach-facing output should show:

- title
- duration
- run order
- setup
- how to start
- how to run it
- rules/scoring
- coaching cues
- what to watch for
- progression
- regression
- safety/space adjustment

Avoid internal prompt fragments, implementation notes, model reasoning, or template labels that do
not help a coach run the activity.

## Future Implementation Notes

Future backend work should update session-pack generation/template logic to:

- parse multi-intent brainstorming
- map requested themes into run order
- enforce warm-up/main/main/final game pattern
- avoid repeated generic setup text
- create richer main activities
- generate better titles
- use SIC knowledge bank and club methodology/source settings later

These standards should guide the next generation pass without changing current auth, tenancy,
entitlements, infrastructure, or club/subscription behavior.
