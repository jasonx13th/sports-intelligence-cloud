# Club Vivo Role and Workspace Model

**Status:** Planning baseline  
**Last updated:** May 4, 2026

## Platform Definition

Club Vivo is the platform.

SIC Coach Workspace is the coach-facing planning workspace inside Club Vivo. It is where coaches create Quick Activities, build sessions, manage teams and equipment defaults, read methodology/source summaries, and return to saved sessions.

Club Vivo is free to start. Anyone can create and use an Individual Coach Workspace or a Free Club Workspace.

A Club Workspace includes access to the Coach Workspace because club admins, admin coaches, and coaches still need to create sessions, Quick Activities, teams, equipment, and saved coaching work.

Verified / Supported Club Workspace is a higher-trust future tier for real clubs, nonprofits, schools, academies, and legal sports organizations that want official setup, custom methodology, coach/admin management, source settings, reporting, and support.

KSC is Jason's pilot/example verified club workspace. It should not be treated as the hardcoded product identity. Product copy, navigation, and architecture should speak in Club Vivo terms, with KSC used only where pilot-specific context is intentionally needed.

## Roles

### Club Admin

Club admins can use everything in Club Vivo for their club.

They manage the club profile, coaches and admin coaches, teams, equipment, methodology, source settings, saved sessions, and verified setup / plans later. They can create sessions and review sessions created by all coaches in the club.

### Admin Coach

Admin coaches can use the SIC Coach Workspace with elevated operational access.

They can create sessions, Quick Activities, teams, and equipment. They can review sessions from all club coaches. They may approve coaches if that responsibility is delegated by the club admin. They should not control verified setup or plans by default.

### Coach

Coaches use the SIC Coach Workspace for their own planning.

They can create teams, use Quick Activity and Session Builder, view their own saved sessions, manage their own equipment defaults, and read the methodology/source summary being used for generation.

## Workspace Structure

### Club Vivo

- Public landing page
- Start as individual coach
- Start as free club workspace
- Verified / supported club setup later
- Sign in

### Free Individual Coach Workspace

- Home
- Quick Activity
- Session Builder
- Teams
- Equipment
- Methodology
- Saved Sessions

The Methodology page should show the SIC brain summary and any personal source context available to the individual coach. It should explain what source mode is influencing generation without exposing the raw SIC knowledge bank.

### Free Club Workspace

- Club overview
- Coach Workspace
- Session Builder
- Quick Activity
- Teams
- Equipment
- Saved Sessions
- Club methodology
- Source settings later
- Verified setup / plans later

The Free Club Workspace lets teams, academies, schools, nonprofits, and sports organizations start organizing coaching work without paid setup. It includes Coach Workspace tools so club leaders and coaches can still plan on the field.

Equipment in the Club Workspace represents shared club inventory. Suggested equipment approvals can come later.

Saved Sessions in the Club Workspace should eventually support club-wide views, with filters by coach, team, and date.

Source settings should eventually support:

- SIC knowledge bank
- Club methodology only
- SIC + club methodology

### Verified / Supported Club Workspace

Verified / Supported Club Workspace is a future higher-trust tier for official organizations that want more structure and help.

It can include official club setup, custom methodology support, coach/admin management, source settings, reporting, and support. Future backend work will handle official verification, membership, invites, subscription tiers, and any supported service rules.

KSC is the current pilot example of this model. Jason can manage KSC as the example club admin/admin coach during the pilot.

### Individual Coach Workspace vs Club Workspace

A coach can have an individual Coach Workspace or belong to a club workspace.

The Individual Coach Workspace is open for coaches to sign up and use for their own planning.

A Free Club Workspace is also free to start. The public club start path can express product intent to create or use a club workspace, but it should not grant special access to an official or verified club.

Random coaches or clubs do not get access to an official/verified club workspace such as KSC unless they are invited or approved later. A coach enters an official/verified club workspace only when the club has invited or approved that coach and the backend has verified the membership.

Public role/start choices are product intent only. They can help explain whether a user wants coach or club setup, but they do not authorize access to official membership, verified status, or protected club data.

### Club Admin Portal

- Club overview
- Coaches and admins
- Home
- Session Builder
- Quick Activity
- Teams
- Equipment
- Saved Sessions
- Club methodology
- Source settings
- Verified setup / plans later

The future Coaches and admins page owns staff access workflows: adding coach emails, assigning roles, optionally assigning teams, sending invite links or invite codes, and approving coach access. The backend must verify the invite/email and create the club membership before a coach can enter official club staff areas or protected verified club workspaces.

## Methodology And Source Mode Model

The SIC knowledge bank is platform-owned intelligence used to improve generation quality. It can influence generated sessions, but it should not be exposed to clubs or coaches as raw content.

Club methodology is club-owned guidance such as coaching philosophy, teaching model, player development language, session principles, program type guidance, and preferred constraints. Club admins and delegated admin coaches can maintain club methodology when the feature is available.

Source mode controls which knowledge sources shape generation:

- **SIC knowledge bank:** generation uses platform coaching knowledge and standard Club Vivo guidance.
- **Club methodology only:** generation uses the club's own methodology without adding SIC bank-specific guidance.
- **SIC + club methodology:** generation blends platform coaching knowledge with club-owned methodology.

Individual coaches should be able to read a plain-language summary of the current methodology/source mode. Club admins and admin coaches should have stronger management tools once club methodology editing is fully enabled.

## Equipment Model

Equipment should support both personal coach defaults and club shared inventory.

For individual coaches, equipment defaults represent what they usually have available. For clubs, equipment inventory represents shared club resources that coaches can use when planning sessions.

Generation rules:

- No selected equipment means Club Vivo may use the available workspace equipment.
- Selected equipment means generation must treat those selected items as the strict equipment constraint.
- Saved outputs should label this clearly as **Equipment used** or similar.
- Empty equipment should be shown with a coach-friendly fallback instead of dominant empty-state copy.

Future club flows may allow coaches to suggest equipment additions or request approval for shared inventory changes.

## Security Rules

Selecting a role on a public or start page is product intent only. It must not grant authorization.

Real permissions must continue to come from backend-controlled identity, tenant, role, and entitlement data.

Do not add fake client-side permissions. Client copy can describe future paths, but privileged actions must remain enforced by the backend.

Role checks should continue to use the current backend-controlled identity model until a dedicated role, membership, invite, verification, and subscription-tier slice is designed and implemented.

## Phased Implementation Plan

### Phase 1: Product Language Alignment

- Replace KSC-specific product copy with Club Vivo and Club Methodology language.
- Keep KSC documentation under pilot/test areas.
- Keep one shared Club Vivo app path.
- Do not change authorization behavior.

### Phase 2: Workspace Framing

- Make public copy distinguish free individual coach workspace, free club workspace, and future verified/supported setup.
- Clarify Methodology as source summary for coaches and source management for admins/admin coaches.
- Keep current server actions and backend permission checks unchanged.

### Phase 3: Role-Aware Navigation

- Add role-aware labels and navigation only after backend role data is ready.
- Keep public role selection as product intent.
- Avoid granting access based on selected public path.

### Phase 4: Club Admin Portal

- Add club overview, coaches/admins management, shared inventory, source settings, and club-wide saved session views.
- Add delegated coach approval only when backend authorization supports it.

### Phase 5: Verified Setup And Plans

- Add official verification, supported setup, reporting, source settings, and plan management for clubs that need a higher-trust workspace.
- Keep paid or supported-service controls unavailable to admin coaches by default unless explicitly delegated later.
