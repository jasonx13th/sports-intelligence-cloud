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

- Activity 1: fun game-like warm-up that activates the theme
- Activity 2: main activity 1, high-quality theme-focused practice
- Activity 3: main activity 2, same importance as activity 2, progression or different game condition
- Activity 4: final game, mini tournament, or competitive game that closes the day with energy

The two main activities should feel equally important. Activity 3 should not be a throwaway add-on;
it should deepen the theme through a progression, constraint, pressure, or different game condition.

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
