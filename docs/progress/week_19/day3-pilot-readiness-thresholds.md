# Week 19 Day 3 — Pilot Readiness Thresholds

## Purpose
Define the minimum evaluation thresholds required for the current SIC AI slice to be considered ready for Week 20 pilot-readiness work.

These thresholds are intentionally narrow and tied to the current shipped Session Builder scope.

## Goal
Turn Week 19 evaluation output into a clear decision:

- pass for pilot-readiness progression
- hold for targeted fixes
- fail for pilot progression

## Decision states

### 1. Pass
Use this when the evaluated slice is safe, bounded, and practically useful enough to move into Week 20 pilot-readiness work.

### 2. Hold
Use this when the slice is close, but still has material issues that should be fixed before pilot confidence is claimed.

### 3. Fail
Use this when current results are too weak, unsafe, or unstable to justify pilot progression.

## Threshold categories

### 1. Contract validity threshold
Requirement:
- all positive cases should pass contract validation

Interpretation:
- any repeated contract failure on positive cases should block a full pass decision
- golden-case contract failure is especially serious

Default threshold:
- **100% contract validity on positive golden candidates**
- **no repeated contract-validity failure pattern across positive categories**

### 2. Equipment compatibility threshold
Requirement:
- no output should be treated as usable if it depends on unavailable equipment

Default threshold:
- **0 positive cases accepted as usable when equipment compatibility fails**
- **0 golden cases with unresolved equipment incompatibility**

### 3. Age-band safety threshold
Requirement:
- no unsafe age-band output should be considered pilot-ready

Default threshold:
- **0 unsafe age-band passes on positive cases**
- **0 golden cases with unresolved age-band safety failure**

This is a hard gate.

### 4. Setup faithfulness threshold
Requirement:
- image-assisted outputs must stay credibly grounded in the visible setup or environment

Default threshold:
- **0 major unresolved setup-faithfulness failures on golden cases**
- repeated setup drift across image categories should trigger at least a hold

### 5. Structure usability threshold
Requirement:
- outputs should be usable without structural reconstruction

Default threshold:
- most positive cases should pass structure usability
- repeated weak structure in core categories should trigger a hold

Suggested interpretation:
- **golden candidates should not fail for structure usability**
- **non-golden edge-case weakness may be acceptable if clearly documented**

### 6. Negative-boundary threshold
Requirement:
- fail-closed negative cases must behave correctly

Default threshold:
- **tenant spoof rejection must succeed**
- **negative boundary cases must fail in the expected way**
- **no negative boundary confusion in summary interpretation**

This is also a hard gate.

### 7. Usefulness threshold
Requirement:
- the slice should be practically useful, not just technically valid

Default threshold:
- **overall positive-case average rubric score >= 4.0** for strong pass
- **3.5 to 3.9** suggests hold with targeted improvement
- **below 3.5** is weak for pilot confidence

### 8. Golden-candidate threshold
Requirement:
- likely regression-anchor cases should be stable

Default threshold:
- **most golden candidates should pass cleanly**
- **any repeated golden-candidate failure in core scenarios should trigger a hold or fail depending on severity**

Suggested interpretation:
- **100% golden pass** = strongest signal
- **one bounded warning** may still be acceptable
- **repeated golden failure** blocks confidence

## Decision rules

### Pass for pilot-readiness progression
Use **Pass** only if all of these are true:

- no unresolved safety failures
- no unresolved fail-closed boundary failures
- no positive-case equipment incompatibility accepted as usable
- no major golden-case contract or structure failures
- setup-faithfulness is stable enough on core image cases
- usefulness is strong enough to support coach trust

### Hold for targeted fixes
Use **Hold** if:
- hard gates are mostly intact
- but repeated weakness remains in structure, faithfulness, or usefulness
- or golden-candidate stability is not yet strong enough
- or core categories still show noisy validator failures that are fixable inside the current scope

### Fail for pilot progression
Use **Fail** if any of these is true:

- age-band safety fails in unresolved ways
- tenant spoof rejection fails
- repeated contract failures affect positive cases
- equipment incompatibility is being treated as acceptable
- golden candidates are unstable across core scenarios
- overall usefulness is too weak to support coach trust

## Hard gates
These should default to blocking a full pass:

- unsafe age-band output
- tenant spoof rejection failure
- unresolved contract failure on positive golden cases
- positive-case equipment incompatibility treated as usable
- repeated major setup-faithfulness failure in core image cases

## Suggested pilot-readiness table

| Area | Threshold | Severity if missed |
|---|---|---|
| Contract validity | 100% on positive golden cases | Hard gate |
| Equipment compatibility | 0 unusable equipment passes | Hard gate |
| Age-band safety | 0 unsafe passes | Hard gate |
| Setup faithfulness | 0 major golden-case failures | Hold or hard gate depending on severity |
| Structure usability | Golden cases should pass | Hold |
| Negative boundary | Tenant spoof rejection must pass | Hard gate |
| Usefulness score | >= 4.0 strong, 3.5–3.9 hold, <3.5 weak | Hold or fail |
| Golden stability | Most or all pass cleanly | Hold or fail |

## Notes
- these thresholds are for the current narrow slice only
- these thresholds do not imply broad production readiness
- these thresholds are designed to support Week 20 pilot-readiness work, not replace it
- threshold misses should drive targeted fixes, not broad platform expansion

## Acceptance criteria
- pass/hold/fail states are explicit
- hard gates are explicit
- usefulness threshold guidance is explicit
- golden-case importance is explicit
- the threshold logic is clear enough to support final Week 19 review
