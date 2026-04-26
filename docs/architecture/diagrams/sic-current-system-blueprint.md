# SIC Current System Diagram Blueprint

## 1. Purpose

This blueprint defines the visual layout for the official SIC current system diagram.

It should be used later to create:

- `docs/architecture/diagrams/sic-current-system.drawio`
- a Miro board version
- optional exported PNG/SVG diagrams

The diagram should be more visual and presentation-friendly than Mermaid, but it must remain source-based and honest. Use current source files and `docs/architecture/sic-current-system-map.md` as truth.

## 2. Diagram Title

Sports Intelligence Cloud / Club Vivo — Current System Architecture

## 3. Intended Audience

The diagram should help:

- the builder understand the repo
- reviewers understand frontend/backend/AWS connections
- future collaborators understand where app, API, data, auth, AI, and observability live
- portfolio viewers understand the system without reading every file

## 4. Canvas Layout

Use a left-to-right architecture board with clear zones.

### Left: User Entry

- Coach / Admin user
- Browser

Show the user interacting with the browser first, then the browser loading the shared Club Vivo web app.

### Frontend Zone

Title: `Club Vivo Next.js App`

Path: `apps/club-vivo/`

Include boxes for:

- public entry/login/callback/logout
- protected coach workspace shell
- Home
- Quick Session
- Session Builder
- Sessions Library
- Saved Session Detail
- Teams
- Equipment/Essentials
- Methodology

This should appear as the largest left-center application zone because the shared coach-facing app is the primary product surface.

### Auth/Security Zone

Include:

- Cognito Hosted UI
- JWT Authorizer
- Tenant Context Builder
- Tenant Entitlements Table
- fail-closed tenant boundary

Draw the tenant boundary as a thick red or purple outline around the server-side tenant resolution area. Show that tenant context is derived after JWT validation and entitlements lookup, not accepted from browser input.

### API/Lambda Zone

Include:

- API Gateway HTTP API
- Me Lambda
- Session Packs Lambda
- Sessions Lambda
- Teams Lambda
- Methodology Lambda
- Templates Lambda
- Athletes Lambda

This zone should sit between frontend/auth and platform/domain logic.

### Platform/Domain Zone

Include:

- with-platform wrapper
- platform logging/errors/validation
- Session Builder domain
- Sessions domain
- Teams domain
- Methodology domain
- Templates/Athletes as supporting domains

Show this as the place where route handlers become product behavior and data access decisions.

### Data/AWS Zone

Include:

- SicDomainTable
- TenantEntitlementsTable
- SessionPdfBucket
- Bedrock Runtime / Nova Lite image analysis permission
- CloudWatch logs/metrics/alarms

`TenantEntitlementsTable` may be drawn once as a shared data store connected to both auth/security and data/AWS zones, or drawn in the data zone with a clear arrow from Tenant Context Builder.

### Bottom Lane: Infrastructure As Code

Include:

- CDK / Infrastructure as Code
- `infra/cdk/lib/sic-api-stack.ts`
- `infra/cdk/lib/sic-auth-stack.ts`
- IAM permissions
- route/resource definitions

Place this as a horizontal foundation lane underneath API/Lambda, Auth/Security, Data/AWS, and Observability resources. It should make clear that CDK defines infrastructure; it is not an app runtime surface.

### Right Or Bottom-Right: Parked/Future Box

Use a light gray dashed box for items that should not be read as active runtime:

- Image-assisted intake broader restart parked
- Methodology upload/source-mode parked
- Domain export/lake review needed
- Future product concept placement reviewed
- Deeper PDF design future work

## 5. Visual Color System

Use this color plan consistently:

- Frontend: blue
- Auth/security/tenancy: purple
- API Gateway/Lambda: orange
- Platform/domain logic: green
- Data stores: dark teal
- AI/Bedrock: magenta or pink
- Observability: gray
- Infrastructure/CDK: dark navy
- Parked/future: light gray with dashed border
- Tenant boundary: red or purple outline

## 6. Diagram Layers And Exact Boxes

### User Entry Layer

| Box title | Subtitle/path | Main responsibility | Classification |
| --- | --- | --- | --- |
| Coach / Admin User | External actor | Uses the Club Vivo coach workspace | Active runtime |
| Browser | User device | Loads the web app and sends authenticated requests | Active runtime |

### Frontend Layer

| Box title | Subtitle/path | Main responsibility | Classification |
| --- | --- | --- | --- |
| Club Vivo Next.js App | `apps/club-vivo/` | Shared coach-facing web runtime | Active runtime |
| Public Entry | `apps/club-vivo/app/page.tsx` | Public SIC / Club Vivo entry page | Active runtime |
| Login Start | `app/login/start/route.ts` | Starts Cognito Hosted UI auth with PKCE | Active runtime |
| Callback | `app/callback/route.ts` | Exchanges Cognito code and sets token cookies | Active runtime |
| Logout | `app/logout/route.ts` | Clears token cookies and redirects | Active runtime |
| Protected Coach Workspace Shell | `app/(protected)/layout.tsx`, `components/coach/CoachAppShell.tsx` | Shared protected app frame | Active runtime |
| Home | `app/(protected)/home/page.tsx` | Coach workspace landing and session entry | Active runtime |
| Quick Session | `app/(protected)/sessions/quick/`, `quick-session-actions.ts` | Fast prompt-based shared-app generation lane | Active runtime |
| Session Builder | `app/(protected)/sessions/new/` | Deliberate shared generation path | Active runtime |
| Sessions Library | `app/(protected)/sessions/page.tsx` | Saved session list | Active runtime |
| Saved Session Detail | `app/(protected)/sessions/[sessionId]/` | Coach-ready session output, feedback, PDF action | Active runtime |
| Teams | `app/(protected)/teams/page.tsx` | Coach-facing team management | Active runtime |
| Equipment/Essentials | `app/(protected)/equipment/page.tsx` | Browser-local equipment/essentials planning | Active runtime |
| Methodology | `app/(protected)/methodology/` | Text-only shared-app methodology management | Active runtime |

### Auth/Security/Tenancy Layer

| Box title | Subtitle/path | Main responsibility | Classification |
| --- | --- | --- | --- |
| Cognito Hosted UI | `infra/cdk/lib/sic-auth-stack.ts` | Hosted authentication entry | Infrastructure |
| Cognito User Pool / App Client | `infra/cdk/lib/sic-auth-stack.ts` | Identity provider and web app client | Infrastructure |
| JWT Authorizer | `infra/cdk/lib/sic-api-stack.ts` | Validates API Gateway JWTs | Infrastructure |
| Post Confirmation Trigger | `services/auth/post-confirmation/handler.js` | Creates default group and entitlement row | Active runtime |
| Pre Token Generation Trigger | `services/auth/pre-token-generation/handler.js` | Adds tenant/role/tier claims when available | Active runtime |
| Tenant Context Builder | `services/club-vivo/api/src/platform/tenancy/tenant-context.js` | Builds server tenant context from JWT and entitlements | Active runtime |
| Tenant Entitlements Table | `TenantEntitlementsTable` | Authoritative tenant, role, and tier records | Infrastructure |
| Fail-Closed Tenant Boundary | Platform behavior | Rejects missing/invalid identity or entitlements | Source-of-truth |

### API/Lambda Layer

| Box title | Subtitle/path | Main responsibility | Classification |
| --- | --- | --- | --- |
| API Gateway HTTP API | `ClubVivoHttpApi` in `sic-api-stack.ts` | Routes authenticated requests to Lambdas | Infrastructure |
| Me Lambda | `services/club-vivo/api/me/handler.js` | Current user/tenant metadata endpoint | Active runtime |
| Session Packs Lambda | `services/club-vivo/api/session-packs/handler.js` | Shared generation endpoint for Session Builder and Quick Session | Active runtime |
| Sessions Lambda | `services/club-vivo/api/sessions/handler.js` | Saved sessions, feedback, and PDF export | Active runtime |
| Teams Lambda | `services/club-vivo/api/teams/handler.js` | Teams, assignments, and team-linked reads | Active runtime |
| Methodology Lambda | `services/club-vivo/api/methodology/handler.js` | Methodology read, draft save, publish | Active runtime |
| Templates Lambda | `services/club-vivo/api/templates/handler.js` | Templates and template generation support | Active runtime |
| Athletes Lambda | `services/club-vivo/api/athletes/handler.js` | Athlete records | Active runtime |

### Platform/Domain Layer

| Box title | Subtitle/path | Main responsibility | Classification |
| --- | --- | --- | --- |
| with-platform Wrapper | `src/platform/http/with-platform.js` | Common wrapper for tenant context, logging, errors, response shape | Active runtime |
| Platform Logging / Errors / Validation | `src/platform/logging/`, `src/platform/errors/`, `src/platform/validation/` | Shared backend platform utilities | Active runtime |
| Session Builder Domain | `src/domains/session-builder/` | Generation context, resolved context, pack generation, image-analysis handling | Active runtime |
| Sessions Domain | `src/domains/sessions/` | Session repository, feedback, PDF generation/storage | Active runtime |
| Teams Domain | `src/domains/teams/` | Team repository, ownership checks, assignments, attendance/planning helpers | Active runtime |
| Methodology Domain | `src/domains/methodology/` | Methodology service, repository, validation | Active runtime |
| Templates/Athletes Supporting Domains | `src/domains/templates/`, `src/domains/athletes/` | Supporting templates and athlete records | Active runtime |

### Data/AWS Layer

| Box title | Subtitle/path | Main responsibility | Classification |
| --- | --- | --- | --- |
| SicDomainTable | `infra/cdk/lib/sic-api-stack.ts` | Stores tenant-scoped domain records | Infrastructure |
| TenantEntitlementsTable | `infra/cdk/lib/sic-api-stack.ts` | Stores authoritative entitlement records | Infrastructure |
| SessionPdfBucket | `infra/cdk/lib/sic-api-stack.ts` | Stores generated session PDF objects | Infrastructure |
| Bedrock Runtime / Nova Lite | `src/platform/bedrock/session-builder-image-analysis.js`, `sic-api-stack.ts` | Image-analysis model call when requested through shared session-packs route | Active runtime/infrastructure |
| CloudWatch Logs / Metrics / Alarms | `infra/cdk/lib/sic-api-stack.ts` | Observes API/Lambda behavior | Infrastructure |

### Infrastructure/CDK Layer

| Box title | Subtitle/path | Main responsibility | Classification |
| --- | --- | --- | --- |
| SIC API Stack | `infra/cdk/lib/sic-api-stack.ts` | Defines API Gateway, API Lambdas, DynamoDB, S3, Bedrock permission, CloudWatch, IAM | Infrastructure |
| SIC Auth Stack | `infra/cdk/lib/sic-auth-stack.ts` | Defines Cognito, auth trigger Lambdas, groups, app client, hosted domain | Infrastructure |
| IAM Permissions | `infra/cdk/lib/*.ts` | Grants least-needed access between Lambdas and AWS resources | Infrastructure |
| Route / Resource Definitions | `infra/cdk/lib/sic-api-stack.ts` | Source for current CDK-wired API routes and resources | Source-of-truth |

### Parked/Future Layer

| Box title | Subtitle/path | Main responsibility | Classification |
| --- | --- | --- | --- |
| Image-Assisted Intake Broader Restart | Product parking lot docs | Future exploration, not restarted as active product work | Parked/future |
| Methodology Upload / Source Mode | `docs/product/club-vivo/future/methodology-source-mode-planning.md` | Future planning only | Parked/future |
| Domain Export / Lake Review | `services/club-vivo/api/exports-domain/`, `lake-ingest/`, `lake-etl/` | Source exists, current CDK wiring not verified | Needs review |
| Future Product Concepts | `docs/product/future/ruta-viva.md`, `docs/product/future/athlete-evolution-ai.md` | Future pillars, not active Club Vivo runtime | Parked/future |
| Deeper PDF Design | Future product/design work | Current PDF export is functional but minimal | Parked/future |

## 7. Arrows And Labels

Use arrows with verbs. Prefer fewer, clearer arrows over a dense web.

Core arrows:

- Coach uses Browser
- Browser loads Club Vivo Web App
- Web App redirects to Cognito Hosted UI
- Cognito Hosted UI returns authorization code to Callback
- Web App stores token cookies
- Web App calls API Gateway
- API Gateway validates JWT
- API Gateway invokes Lambda
- Lambda uses with-platform wrapper
- with-platform resolves Tenant Context Builder
- Tenant Context Builder reads TenantEntitlementsTable
- Lambda calls domain logic
- Domain logic reads/writes SicDomainTable
- Sessions domain writes SessionPdfBucket
- Sessions domain presigns PDF download from SessionPdfBucket
- Session Packs Lambda may call Bedrock Runtime for `requestType: "image-analysis"`
- CloudWatch observes API/Lambda behavior
- CDK defines API, Lambda, DynamoDB, S3, Cognito integration, IAM, and CloudWatch resources

Optional lower-priority arrows:

- Session Builder domain loads optional team context
- Session Builder domain loads optional published methodology context
- Methodology domain writes draft/published methodology to SicDomainTable
- Teams domain enforces coach-owned records and admin tenant-wide visibility where implemented

## 8. Quick Session Mini-Flow Callout

Place a compact callout near the Quick Session frontend box.

Callout title:

Quick Session is not a separate backend product.

Flow:

`Home or /sessions/quick -> quick-session helpers -> POST /session-packs -> shared Session Builder pipeline -> quick review -> POST /sessions -> saved detail`

Notes:

- Draw Quick Session as a frontend lane into the shared Session Packs Lambda.
- Do not draw a separate Quick Session Lambda, backend service, product, or data store.

## 9. Session Builder Mini-Flow Callout

Place a compact callout near the Session Builder frontend and Session Builder domain boxes.

Callout title:

Session Builder is the deliberate generation path.

Flow:

`/sessions/new -> selected team context -> POST /session-packs -> Generation Context v1 -> optional team/methodology lookups -> Resolved Generation Context v1 -> one candidate review -> POST /sessions -> saved detail`

Notes:

- Draw selected team context as server-validated context, not public tenant input.
- Show optional team/methodology lookups inside the backend generation flow.
- Show one candidate review in the frontend.

## 10. Tenant Safety Callout

Place this prominently near the tenant boundary.

Tenant identity is never accepted from client input.

Tenant context is server-derived from JWT claims plus authoritative entitlements.

No `tenant_id`, `tenantId`, or `x-tenant-id` from client body/query/headers.

The visual should make this boundary obvious. Use a thick tenant-boundary outline around JWT authorizer, tenant context builder, entitlements lookup, and protected backend behavior.

## 11. Source Truth Callout

Place this as a small footer.

Text source of truth:

- `docs/architecture/sic-current-system-map.md`
- `docs/architecture/sic-repo-inventory.md`
- `docs/architecture/foundations/source-of-truth-manifest.md`

## 12. What Not To Draw As Active

The diagram must not show these as active runtime:

- separate AI agent platform
- separate chatbot backend
- separate Quick Session backend product
- separate admin app
- methodology upload/source-mode
- broad RAG/vector infrastructure
- restarted image-assisted intake expansion
- deeper PDF document design
- domain export/lake as active current CDK-wired resources unless later verified

If these appear, they must be in the light gray dashed parked/future box or omitted.

## 13. Miro Version Notes

For a Miro version:

- Use colored swimlanes for the main layers.
- Use icons for user, browser, cloud, database, lock, AI, and observability.
- Use dashed future boxes for parked/future work.
- Use a thick tenant boundary outline.
- Keep arrows readable and avoid too many crossing lines.
- Create a first board called `SIC Current System Architecture`.
- Create optional frames:
  - Full System
  - Quick Session Flow
  - Session Builder Flow
  - Auth + Tenant Boundary
  - AWS Resource Map

Miro can be more colorful and explanatory than the repo diagram, but it should remain traceable to source and the markdown system map.

## 14. Draw.io Version Notes

For a draw.io / diagrams.net version:

- Use one main page for the full system.
- Add optional additional pages for focused flows.
- Use consistent layer colors from this blueprint.
- Keep editable source at `docs/architecture/diagrams/sic-current-system.drawio`.
- Export to PNG/SVG only after the `.drawio` source exists.
- Keep exported images next to the editable source or in a clearly named subfolder if that later becomes useful.

Suggested draw.io pages:

- Full System
- Quick Session Flow
- Session Builder Flow
- Auth + Tenant Boundary
- AWS Resource Map

## 15. Open Questions Before Drawing

- Should parked/future items be on the same board or a separate frame?
- Should domain export/lake be shown as parked or left out until reviewed?
- Should SIC-wide future product concepts be shown as future pillars or omitted?
- Should the first draw.io diagram be one large system map or multiple focused diagrams?
