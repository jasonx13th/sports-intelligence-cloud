# Week 19 Day 1 — Evaluation Case Inventory

## Purpose
Freeze the evaluation case categories and target counts for the Week 19 lightweight AI evaluation harness.

This inventory is designed to measure real coaching usefulness across the already-shipped Session Builder AI slice and the shared generation path, without expanding the product boundary.

## Category set

### 1. Environment Profile
Purpose:
- test image-assisted environment understanding
- verify structured draft profile usefulness before coach confirmation
- catch contract-valid but low-usefulness outputs

Target count:
- 5 cases

Examples:
- small indoor court with cones and mini goals
- shared grass field with unclear boundaries
- tight futsal-style space with limited equipment
- outdoor training area with visible safety constraints
- ambiguous space with partial equipment visibility

### 2. Setup to Drill
Purpose:
- test whether a setup image can seed one practical drill/activity
- verify that the output stays within the narrow Week 18 boundary
- measure setup faithfulness and drill usability

Target count:
- 5 cases

Examples:
- cone box with mini goals for passing pattern
- rondo-style setup with bibs and cones
- finishing channel with visible goal and markers
- partial setup with unclear spacing
- small-area possession layout

### 3. Fut-Soccer
Purpose:
- test sport-pack-biased session usefulness in tight-space and fast-rotation contexts
- verify the shared Session Builder can still produce usable outputs under a Fut-Soccer bias

Target count:
- 4 cases

Examples:
- tight indoor space, fast passing focus
- ball mastery in small area
- pressing transition drill in fut-soccer setting
- short-duration, high-rotation youth session

### 4. KSC-like Coaching Scenarios
Purpose:
- test realistic pilot-adjacent coaching usefulness
- stress the harness with practical, real-world coach inputs

Target count:
- 3 cases

Examples:
- mixed equipment, limited space, 60-minute youth session
- rainy-day indoor fallback session
- low-equipment coach session needing a simple, runnable plan

## Negative boundary cases
These exist to confirm fail-closed behavior and clear failure reporting.

Target count:
- 3 to 4 cases

Include:
- invalid contract shape
- equipment incompatibility
- unsafe age-band mismatch
- one clearly labeled tenant spoof rejection case only

## Golden example candidates
Initial target:
- 5 to 10 cases total, selected later from the categories above

Golden candidates should be:
- realistic
- easy to rerun
- representative of likely pilot usage
- stable enough for regression checks

## Total target dataset size
Recommended initial dataset:
- 17 to 21 cases total

Suggested starting mix:
- 5 environment_profile
- 5 setup_to_drill
- 4 fut-soccer
- 3 KSC-like
- 3 or 4 negative boundary cases

## Non-negotiables
- no real tenant IDs
- no real user data
- no secrets, tokens, emails, or live URLs
- no normal case includes `tenantId`, `tenant_id`, or `x-tenant-id`
- tenant spoof case is rejection-only and clearly labeled
- keep the dataset aligned to the shipped product slice, not future AI expansion

## Acceptance criteria
- categories are frozen
- target counts are frozen
- negative boundary coverage is explicit
- golden-example target range is explicit
- dataset size is realistic for Day 1 fixture work
