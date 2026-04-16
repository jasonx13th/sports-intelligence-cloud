# Week 18 Demo Script

## Purpose

This demo shows the smallest realistic Week 18 image-assisted intake v1 flow that SIC supports today.

It stays Session Builder-first and implementation-grounded:

- use the existing Club Vivo `/sessions/new` flow
- show `environment_profile` image intake
- show `setup_to_drill` image intake
- prove both stay on the same shared Session Builder foundation
- prove coach confirmation is required before generation
- prove downstream save and export behavior remain unchanged

This demo does not require a new app, a new route family, a new auth path, or a separate AI product surface.

---

## Short intro

Week 18 adds one narrow image-assisted intake layer inside Session Builder.

The point is not to create a separate AI product.

The point is to help a coach turn one real-world image into a draft structured profile that they can review, edit, confirm, and then use inside the same shared Session Builder flow.

---

## Demo prep checklist

Before running the demo, have:

- access to the current Club Vivo app
- access to the existing authenticated `/sessions/new` flow
- one environment image ready
- one setup image ready
- permission to use the existing generation, save, and export flows

Required setup assumptions:

- the current shipped Week 18 slice is already deployed or running locally
- requests never send `tenant_id`, `tenantId`, or `x-tenant-id`
- tenant scope is server-derived only from verified auth plus authoritative entitlements
- one image is used per analysis request

Recommended demo order:

1. show `environment_profile`
2. show save or export continuity briefly
3. show `setup_to_drill`
4. close with the shared-foundation message

---

## Demo flow

### 1. Show the shared Session Builder entry point

Open:

- `/sessions/new`

What to show:

- this is the same existing Club Vivo Session Builder workflow
- image-assisted intake appears inside the same coach flow
- there is no separate AI app or chatbot screen

Why this matters:

- it proves Week 18 is an intake enhancement inside shared Session Builder

### 2. Flow 1: environment image to confirmed session input

Select:

- `environment_profile`

Upload:

- one environment image

What to show:

- one image is uploaded for one analysis request
- the system returns a draft environment profile
- the profile is structured and reviewable
- the coach can edit the draft before using it

Presenter note:

- say clearly that this is draft output, not authoritative generation input yet

### 3. Confirm the environment draft before generation

What to show:

- the coach reviews the draft profile
- make one small edit if useful
- explicitly confirm the profile

What to say:

- coach confirmation is required before generation
- unconfirmed output does not directly trigger generation

Why this matters:

- it proves the coach remains in control
- it proves the Week 18 confirmation boundary is real

### 4. Generate a session from the confirmed environment profile

What to show:

- generation runs only after confirmation
- the result is a normal shared Session Builder output
- there is no separate downstream object model

What to say:

- `environment_profile` improves environment understanding for shared generation
- the generation path is still the same shared Session Builder foundation

### 5. Briefly show downstream continuity

Use the existing save action on the generated result.

Optionally show export if it is convenient.

What to show:

- save behavior is unchanged
- export behavior is unchanged if shown
- Week 18 changed intake quality, not downstream save or export behavior

### 6. Flow 2: setup image to confirmed drill seed

Stay in:

- the same `/sessions/new` workflow

Select:

- `setup_to_drill`

Upload:

- one setup image

What to show:

- the system returns a draft setup profile
- the draft is structured and reviewable
- the coach can edit the profile before using it

What to say:

- this is still the same shared Session Builder workflow
- this is not a different product surface

### 7. Confirm the setup draft and generate one drill/activity seed

What to show:

- the coach reviews the draft
- the coach confirms it
- generation runs only after confirmation

What to say:

- `setup_to_drill` is limited to one drill or activity seed only
- it does not widen into full-session generation from raw setup-image output

Why this matters:

- it proves the Week 18 v1 scope stayed narrow

### 8. Call out the shared foundation directly

Close the demo by naming what is shared:

- one Club Vivo app
- one `/sessions/new` flow
- one shared Session Builder foundation
- one confirmation boundary before generation
- one unchanged downstream save path
- one unchanged downstream export path

What to say:

- Week 18 adds image-assisted intake inside Session Builder
- it does not create a separate AI product

---

## Tenant-safe and fail-closed callout

Use one short callout during the demo:

- tenant scope is server-derived, not client-supplied
- invalid or unsupported input fails closed
- unsupported or invalid model output fails closed
- unconfirmed output never directly triggers generation

Keep this concise.
This is a confidence signal, not the main story of the demo.

---

## Recording tips

- keep the intro short
- narrate the confirm step clearly in both flows
- use “image-assisted intake,” “draft profile,” and “confirmed profile”
- avoid “chatbot,” “assistant,” or “AI copilot” framing
- keep each flow focused on one success path
- if export is shown, keep it brief and position it as unchanged downstream behavior

---

## If something fails during recording

If image analysis fails during recording:

- say the system fails closed
- say the coach can retry or continue manually
- do not improvise a broader AI explanation
- do not present failure handling as a separate product flow

If time is short:

- keep Flow 1 complete
- keep Flow 2 to draft -> confirm -> generate one drill seed
- shorten the save/export continuity step instead of cutting the confirm step

---

## What Week 18 proves

Week 18 proves that SIC can add image-assisted intake inside the existing Session Builder workflow without creating a separate AI product.

It proves:

- one environment image can become a draft environment profile, then a confirmed input for shared session generation
- one setup image can become a draft setup profile, then a confirmed seed for one drill or activity
- coach confirmation remains required before generation
- the same shared Session Builder foundation stays intact
- downstream save and export behavior remain unchanged
- the slice stays tenant-safe and fail-closed
