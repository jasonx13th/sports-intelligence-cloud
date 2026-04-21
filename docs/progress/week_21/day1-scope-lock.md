# Week 21 Day 1 - Scope Lock

## Theme

Coach Workspace Hardening for KSC

## Status

Frozen Day 1 scope lock for Week 21.

This is a tracked progress artifact only.
It does not change runtime behavior, UI behavior, API behavior, persistence behavior, auth, tenancy, entitlements, IAM, or CDK.

## Current repo baseline

Week 21 starts from a real shipped coach-facing slice, not a blank slate.

Current repo reality:

- authenticated coach flow already exists through the shared Club Vivo web app
- `/sessions/new` is the main current generation path
- saved sessions list, detail, and feedback already exist
- session export already exists at API level, but is not surfaced in the Next UI
- team APIs already exist, but the durable team model is still small
- there is no `teams` UI route yet in `apps/club-vivo`
- Quick Drill does not yet exist as a first-class product mode
- coach profile is not yet a durable product surface
- equipment profile is not yet a durable product surface
- coach-admin workspace is not yet a durable product surface

This means Week 21 should harden and reshape the current coach workflow into a more complete Coach Workspace direction without pretending the repo already has those missing surfaces.

## 1. Week 21 objective

Freeze Week 21 as a **Coach Workspace Hardening for KSC** week instead of a generic release week.

The goal is to define the smallest realistic product shape that turns the current authenticated Session Builder flow into a more complete KSC-ready coach workspace while staying inside the existing SIC boundaries.

Week 21 must remain aligned to the current repo and platform rules:

- keep one shared coach-facing app
- keep `/sessions/new` as the current core generation path
- reuse the current saved-session flow
- do not change auth, tenancy, entitlements, IAM, or CDK
- do not invent a second app for Travel or OST

## 2. Product outcomes to freeze

By the end of Day 1, Week 21 should freeze the following product outcomes:

- SIC is explicitly positioned as moving from narrow Session Builder toward a real Coach Workspace
- first-time coach setup is defined clearly
- returning-coach fast entry into session creation is defined clearly
- KSC Travel and OST live inside one shared product path
- team context becomes the main place where KSC program defaults live
- methodology becomes an explicit product concept instead of an accidental prompt detail
- coach-admin direction is acknowledged as a real product need
- missing surfaces are named clearly so implementation does not drift or overclaim

## 3. First-time coach flow

Frozen first-time coach direction:

1. Coach logs in through the existing authenticated app flow.
2. Coach is guided through first-time setup instead of being dropped into a narrow blank form.
3. Coach creates a basic coach setup record.
4. Coach creates one or more teams.
5. Coach selects KSC program type per team.
6. Coach sets age information per team.
7. Coach sets practical defaults such as likely duration, environment context, and equipment context.
8. Coach saves this setup for reuse in future session creation.

Day 1 rule:

- this is a product flow freeze, not a commitment that all of those surfaces already exist in the current repo

## 4. Returning coach flow

Frozen returning-coach direction:

1. Coach logs in through the existing authenticated flow.
2. Coach lands in the current coach workspace entry area centered around session creation.
3. Coach selects a team.
4. Coach chooses a session creation mode.
5. Coach adjusts time, objective, and today's constraints.
6. Coach generates quickly through the shared session creation path.
7. Coach reviews, saves, and continues into the existing saved-session flow.

Day 1 rule:

- the returning-coach experience should feel faster and more team-aware than the current narrow `/sessions/new` form
- Week 21 does not require replacing the current Session Builder core

## 5. Team-level KSC rules

KSC Travel and OST should be treated as team-level context, not separate apps and not coach-level product forks.

Frozen rules:

- one coach may work with multiple teams
- those teams may belong to different KSC program types
- each team should eventually carry `programType = travel | ost`
- each team should eventually carry age information appropriate to that program
- each team should eventually carry a default duration
- each team should eventually carry methodology defaulting context

Current repo grounding:

- the current durable team model already supports `name`, `sport`, `ageBand`, `level`, `notes`, and `status`
- the current durable team model does not yet support `programType`, birth-year structure, default duration, or methodology linkage
- team APIs exist already, but there is no teams UI route yet

## 6. Methodology rules

Methodology should be frozen as a real product object that the workspace will eventually use deliberately.

Frozen rules:

- methodology should not live only as hidden generation bias
- each team should eventually have one default methodology context
- Travel teams should be able to default to KSC Travel methodology
- OST teams should be able to default to OST or US Soccer-style methodology
- the coach should not have to reselect methodology manually every time if the team already carries the default
- saved or generated artifacts should be able to reflect methodology context later

Current repo grounding:

- methodology is present in docs and direction, but not yet as a durable first-class product surface in the current shipped flow

## 7. Coach-admin rules

Week 21 should freeze coach-admin direction without pretending a full admin workspace already exists.

Frozen rules:

- coach-admin is a real product need for KSC
- coach-admin should remain inside the same shared app direction
- coach-admin should be able to see broader coach and team activity than a normal coach
- coach-admin should be the likely owner of methodology management direction
- coach-admin workspace should be treated as a future durable surface, not as an accidental extension of a single endpoint

Current repo grounding:

- admin-only API behavior already exists for narrow routes such as team creation and some tenant-management surfaces
- a real coach-admin workspace UI does not yet exist

## 8. In-scope

Week 21 Day 1 is in scope for:

- freezing Week 21 as Coach Workspace Hardening for KSC
- documenting the current repo baseline honestly
- freezing first-time coach flow
- freezing returning-coach flow
- freezing team-level Travel vs OST direction
- freezing team-level defaults direction
- freezing methodology direction
- freezing coach-admin direction
- identifying missing durable product surfaces clearly
- keeping the implementation path grounded in the existing app and route structure

## 9. Out-of-scope

The following are explicitly out of scope for this Day 1 boundary:

- auth changes
- tenancy changes
- entitlements changes
- IAM changes
- CDK changes
- introducing a second app
- pretending a `teams` UI already exists
- pretending export is already surfaced in the Next UI
- treating Quick Drill as already shipped
- treating coach profile as already durable
- treating equipment profile as already durable
- treating coach-admin workspace as already durable
- broad platform rewrite
- broad analytics expansion
- broad chatbot or RAG expansion

## 10. Acceptance criteria

This Day 1 scope lock is correct only if all of the following are true:

- Week 21 is framed as Coach Workspace Hardening for KSC, not a generic release week
- the current repo baseline is described accurately
- `/sessions/new` remains recognized as the current main generation path
- saved sessions list, detail, and feedback are recognized as already shipped
- team APIs are recognized as real, but the team model is recognized as still small
- the lack of a teams UI route is stated explicitly
- export is recognized as API-level existing capability, not current Next UI capability
- Quick Drill is recognized as not yet first-class
- coach profile, equipment profile, and coach-admin workspace are recognized as missing durable product surfaces
- the document keeps one shared app direction
- the document does not imply auth, tenancy, entitlements, IAM, or CDK drift

## One-sentence summary

Week 21 Day 1 freezes SIC's next step as **Coach Workspace Hardening for KSC**: build forward from the existing authenticated Session Builder and saved-session flow, make team and methodology context real, and do it without widening the platform boundary or inventing a second app.
