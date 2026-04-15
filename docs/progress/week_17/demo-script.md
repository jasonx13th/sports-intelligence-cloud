# Week 17 Demo Script

## Purpose

This demo shows the smallest realistic Fut-Soccer Merge v1 flow that SIC supports today.

It stays product-first and implementation-grounded:

- use the existing Club Vivo `/sessions/new` flow
- show standard soccer generation
- show Fut-Soccer-biased generation
- prove both use the same shared Session Builder foundation
- prove save, list, detail, and export remain unchanged

This demo does not require a new route family, a new app, a new auth path, a new tenancy path, or any futsal behavior.

---

## Setup preconditions

Before running the demo, have:

- `{{baseUrl}}`
- `{{accessToken}}`
- access to the current Club Vivo app
- permission to use the existing authenticated session generation and save flows

Required setup assumptions:

- tenant scope is server-derived only from verified auth plus authoritative entitlements
- requests never send `tenant_id`, `tenantId`, or `x-tenant-id`
- the current shipped Week 17 slice is already deployed or running locally
- futsal is not part of the demo because it is not shipped

Recommended working values:

- `durationMin = 60`
- `ageBand = u12`
- `sessionsCount = 1`
- `equipment = ["cones", "balls"]`

---

## Demo flow

### 1. Show the existing shared entry point

Open:

- `/sessions/new`

What to show:

- the page is the same existing Club Vivo session creation flow
- the coach can choose `Soccer` or `Fut-Soccer`
- no `Futsal` option appears

Presenter note:

- the visible selector is a current v1 bridge for the safe Week 17 merge
- it is not the final intended long-term product expression
- the target direction is one soccer-first assistant flow with Fut-Soccer absorbed more invisibly into shared methodology and generation behavior

Why this matters:

- it proves Fut-Soccer ships inside the existing coach-facing app
- it proves futsal remains out of scope

### 2. Run the standard Soccer flow

Select:

- `Soccer`

Suggested request shape:

```json
{
  "sport": "soccer",
  "ageBand": "u12",
  "durationMin": 60,
  "theme": "passing",
  "sessionsCount": 1,
  "equipment": ["cones", "balls"]
}
```

What to show:

- `sport = "soccer"`
- `sportPackId` is omitted
- session-pack generation succeeds through the existing path
- the returned session is a standard soccer result

### 3. Save the Soccer result through the unchanged path

Use the existing save action.

What to show:

- the generated soccer session saves successfully
- the saved session appears in the existing session list
- the saved session detail page loads normally
- PDF export remains available through the existing route

Why this matters:

- it proves save, list, detail, and export remain unchanged for the baseline flow

### 4. Run the Fut-Soccer passing flow

Select:

- `Fut-Soccer`

Suggested request shape:

```json
{
  "sport": "soccer",
  "sportPackId": "fut-soccer",
  "ageBand": "u12",
  "durationMin": 60,
  "theme": "passing",
  "sessionsCount": 1,
  "equipment": ["cones", "balls"]
}
```

What to show:

- canonical `sport` remains `soccer`
- `sportPackId = "fut-soccer"` appears only on generation
- the generated result reflects reduced-space passing / build-up-under-pressure bias
- the response still uses the shared Session Builder pack shape

### 5. Run the Fut-Soccer pressing flow

Keep:

- `Fut-Soccer`

Change:

- `theme = "pressing"`

Suggested request shape:

```json
{
  "sport": "soccer",
  "sportPackId": "fut-soccer",
  "ageBand": "u12",
  "durationMin": 60,
  "theme": "pressing",
  "sessionsCount": 1,
  "equipment": ["cones", "balls"]
}
```

What to show:

- the generated result reflects reduced-space pressure-and-cover / pressing bias
- the output is still a shared soccer session-pack response
- this is the second and final shipped Fut-Soccer-biased example path in v1

### 6. Save one Fut-Soccer generated session

Use the existing save action on one Fut-Soccer-generated result.

What to show:

- save succeeds through the existing `POST /sessions` path
- the saved session continues to behave like a normal soccer session in list/detail/export
- there is no separate Fut-Soccer persistence path

Why this matters:

- it proves the current v1 limitation and shared downstream behavior

### 7. Call out the shared foundation directly

Close the demo by naming what is shared:

- one Club Vivo app
- one `/sessions/new` flow
- one `POST /session-packs` generation path
- one `POST /sessions` save path
- one list/detail/export path
- no separate Fut-Soccer stack
- no futsal behavior

---

## Evidence to capture

Capture or summarize:

- the `/sessions/new` selector showing `Soccer` and `Fut-Soccer`
- one soccer generation request with omitted `sportPackId`
- one Fut-Soccer generation request with `sportPackId = "fut-soccer"`
- one passing-biased Fut-Soccer result
- one pressing-biased Fut-Soccer result
- one saved soccer session in list/detail/export
- one saved Fut-Soccer-generated session in list/detail/export

---

## One negative check

Run one small negative check only.

Recommended option:

- confirm no `Futsal` option appears in the current `/sessions/new` flow

Why this is the recommended negative check:

- it directly proves the approved Week 17 out-of-scope boundary
- it avoids widening the demo into new runtime behavior or unsupported validation cases

---

## Logs

If logs are available in the current workflow, use them only as supporting evidence.

Primary evidence for this demo should be:

- UI behavior
- request payload shape
- generated output differences
- unchanged save/list/detail/export behavior

---

## What is explicitly deferred

This demo does not include:

- futsal behavior
- futsal templates
- futsal UI selection
- persisted `sportPackId`
- save-route widening
- tenant-configured Fut-Soccer defaults
- separate Fut-Soccer storage or export behavior
- infra or auth expansion

If any part of the demo would require those changes, that part should be treated as deferred and not included in the Week 17 demo.

---

## Closeout message

The strongest closeout for this demo is:

- SIC now supports both standard Soccer and Fut-Soccer-biased generation inside the same coach-facing flow
- Fut-Soccer is a sport-pack bias and product flavor, not a separate sport or stack
- the shared Session Builder foundation remains intact
- save, list, detail, and export remain unchanged
- futsal is not shipped in v1
