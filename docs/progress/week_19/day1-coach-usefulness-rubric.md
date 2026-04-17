# Week 19 Day 1 — Coach Usefulness Rubric

## Purpose
Define a small, repeatable scoring rubric for Week 19 evaluation cases.

This rubric is meant to measure practical coaching usefulness for the current SIC Session Builder slice. It is not a general model-quality benchmark.

## Rubric principles
- prioritize real coach usefulness over abstract AI quality
- keep scoring simple enough to apply consistently
- use deterministic checks first, rubric second
- score only within the current shipped product boundary
- do not reward product expansion beyond the current Session Builder flow

## Scoring scale
Each rubric dimension is scored from **1 to 5**.

### 5
Strong result.
A coach could use this output with little or no editing.

### 4
Good result.
Usable with light editing or clarification.

### 3
Mixed result.
Partly useful, but needs noticeable cleanup before practical use.

### 2
Weak result.
Significant editing or correction required before use.

### 1
Poor result.
Not practically usable as returned.

## Rubric dimensions

### 1. Runnable Today
Question:
- Could a coach run this session, drill, or profile today without major rework?

Score guidance:
- **5** = immediately runnable
- **4** = runnable with small edits
- **3** = usable concept but needs moderate cleanup
- **2** = major rework needed
- **1** = not runnable in practice

### 2. Clarity
Question:
- Is the output clear enough for a coach to understand and act on quickly?

Score guidance:
- **5** = very clear and easy to follow
- **4** = mostly clear with minor ambiguity
- **3** = understandable but uneven
- **2** = confusing in key places
- **1** = unclear or hard to follow

### 3. Age Appropriateness
Question:
- Is the output suitable for the stated age band and training level?

Score guidance:
- **5** = clearly age-appropriate and well matched
- **4** = acceptable with minor mismatch risk
- **3** = partly appropriate but needs coach adjustment
- **2** = notable mismatch
- **1** = inappropriate or unsafe for the age band

### 4. Constraint Fit
Question:
- Does the output fit the stated space, equipment, time, and scenario constraints?

Score guidance:
- **5** = strongly aligned to constraints
- **4** = mostly aligned with minor drift
- **3** = partly aligned but misses some constraints
- **2** = weak fit
- **1** = clearly ignores important constraints

### 5. Edit Burden
Question:
- How much coach effort is needed to fix or adapt the output before use?

Score guidance:
- **5** = almost no editing needed
- **4** = light edits needed
- **3** = moderate edits needed
- **2** = heavy edits needed
- **1** = extensive rewrite needed

## Rubric use rules

### Rule 1 — Deterministic failures come first
If a case fails a hard deterministic check, that failure must be recorded clearly before rubric scoring is considered.

Examples:
- invalid contract shape
- equipment incompatibility
- unsafe age-band mismatch
- setup faithfulness failure where required

### Rule 2 — Rubric does not override safety
A high usefulness score must never hide:
- unsafe output
- equipment-incompatible output
- invalid contract output
- fail-closed boundary issues

### Rule 3 — Keep scoring within product scope
Do not reduce a score because the system did not do something outside the shipped slice.

Examples:
- do not penalize for missing chatbot behavior
- do not penalize for missing multi-image reasoning
- do not penalize for missing broad AI explanation layers

### Rule 4 — Score the returned output, not imagined intent
Score what the case actually returns, not what the model may have meant.

## Suggested summary calculations
For each case, record:
- score by dimension
- average rubric score
- short scorer note

For each run, summarize:
- average rubric score overall
- average score by category
- lowest-scoring dimension
- highest-scoring dimension
- count of cases below usable threshold

## Suggested usable threshold
Initial recommended interpretation:
- **4.0+** = strong practical usefulness
- **3.0 to 3.9** = usable with coach edits
- **below 3.0** = weak for pilot confidence

This threshold is provisional and can be finalized on Day 3.

## Non-negotiables
- keep rubric simple
- keep rubric coach-centered
- do not expand the product boundary through scoring
- do not hide deterministic failures behind subjective scoring
- use the rubric to support pilot readiness decisions, not replace them

## Acceptance criteria
- rubric dimensions are frozen
- score meanings are explicit
- deterministic-vs-subjective order is explicit
- usable-threshold guidance exists
- rubric is narrow enough to support Day 1 fixture work and Day 2 runner work
