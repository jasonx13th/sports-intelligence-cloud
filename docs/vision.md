# Sports Intelligence Cloud (SIC) Vision

Sports Intelligence Cloud (SIC) is a multi-tenant, cloud-native platform that helps clubs, schools, municipalities, and individual coaches turn everyday sports and mobility data into actionable insights, while preserving clear data ownership and designed to be operationally lightweight and price-accessible through tiered plans, with subsidised options for low-resource contexts.

---

## 1. Mission

Give sports communities true ownership and intelligence over their data.

SIC turns training, competition, wellness, and mobility signals into actionable insights that keep people active longer, safer, and happier—without requiring a dedicated IT or data team.

---

## 2. Target Users (Who SIC is for)

SIC serves four primary user groups:

- **Sports Clubs and Academies**  
  Centralise long-term athlete development history across seasons, regardless of coach turnover or tooling changes.

- **Individual Coaches and Practitioners**  
  Run a lightweight “mini platform” to plan sessions, track athletes, and organise data without high costs or complex setup.

- **Schools and Educational Programs**  
  Monitor participation, wellbeing, and risk with low operational overhead and clear role-based access.

- **Municipalities and Public-Sector Partners**  
  Generate geospatial and social-impact insights from route and participation data to support policy, investment, and tourism decisions.

---

## 3. Product Pillars (What SIC delivers)

SIC is one platform with three core product pillars built on a shared serverless, multi-tenant AWS foundation.

### 3.1 Club Vivo (Club and Coach Data Ownership)

**Vision:** Make the club or training environment (not individual apps) the long-term owner of athlete data, while still supporting independent coaches without a formal organisation.

**Capabilities**
- Multi-tenant org structure:
  - Club/academy tenants: `club -> teams -> athletes`
  - Solo-coach tenants: `coach -> groups -> athletes`
- Centralised tracking: attendance, training load, wellness, injuries, participation history.
- Role-based access: admins, coaches, medical staff, optional family views.
- Dashboards and season reports for training and resource decisions.

**Outcome**
- Clubs retain athlete history over years and reduce data loss from staff/tool changes.
- Solo coaches get a structured workspace without needing an IT team.

---

### 3.2 Athlete Evolution AI (Intelligence and Risk Management)

**Vision:** Provide early-warning signals and development insights so coaches can act before dropout or injury happens.

**Capabilities**
- Predict athlete dropout risk in the next 60–90 days.
- Estimate injury/overload risk from load, recovery, and history.
- Track progression curves and benchmarks across seasons.
- Provide explainable outputs and coach-friendly narratives (why risk is rising).

**Outcome**
- Coaches move from intuition-only to evidence-supported decisions that improve retention, safety, and fairness.

---

### 3.3 Ruta Viva (Geospatial and Community Impact Analytics)

**Vision:** Turn cycling routes and mobility data into evidence of health, tourism, and economic impact.

**Capabilities**
- Ingest ride telemetry (GPX/CSV) and map to routes/geofences.
- Analyse route usage, intensity, rider segments, and time patterns.
- Generate municipality-ready reports for infrastructure and tourism planning.
- Provide geospatial dashboards and story-driven stakeholder outputs.

**Outcome**
- Cities justify investments in active mobility using real data, not anecdotes.

---

## 4. Core Problems SIC Solves

1. **Athlete data fragmentation**  
   Today: data scattered across chats, spreadsheets, notebooks, and single-purpose apps.  
   SIC: unified multi-tenant system with clear ownership and durable storage.

2. **Dropout risk in youth sports**  
   Today: athletes disappear without warning.  
   SIC: predicts risk and surfaces early interventions.

3. **Injury and overload risk without visibility**  
   Today: load/wellness/injury history is rarely analysed systematically.  
   SIC: aggregates signals, produces risk scores, and explains drivers.

4. **Lack of route and mobility analytics for cities**  
   Today: limited evidence for usage and impact.  
   SIC: ingests geospatial telemetry and produces actionable metrics.

5. **Manual, time-consuming impact reporting**  
   Today: clubs/NGOs compile sponsor and municipality reports by hand.  
   SIC: curated data lake + AI-assisted narrative generation.

6. **Limited access to affordable analytics and AI**  
   Today: small orgs cannot hire data teams; solo coaches have little access.  
   SIC: cost-aware multi-tenant SaaS patterns with secure defaults and accessible tiers.

---

## 5. Engineering Guardrails (Non-negotiables)

- **Multi-tenant first:** every request carries `tenant_id`; isolation enforced at auth, API, app logic, and data/storage layers.
- **Serverless first:** prefer managed AWS services (Lambda, API Gateway, DynamoDB, S3, Glue, SageMaker) to minimise operational load.
- **ML lifecycle completeness:** data quality, evaluation, deployment, monitoring, drift detection, and retraining are required for production models.
- **Security and observability by default:** encryption, least-privilege IAM, structured logging, metrics, and alarms are part of “done”.
- **Accessibility by design:** features and pricing must support low-resource contexts without weakening security or data quality.

---

## 6. Tenant Types and Onboarding (Conceptual)

SIC models access around tenants, each with a unique `tenant_id`, running on shared infrastructure.

- **Solo-coach tenant (`tenant_type="solo-coach"`)**
  - Low-friction self-sign-up.
  - Primary user acts as both admin and coach for the tenant.

- **Club/organisation tenant (`tenant_type="club"`)**
  - “Create club/academy” onboarding, optional verification.
  - First user is an admin who can invite staff (coach, medical, etc.).

Both tenant types:
- Use a shared identity system with `custom:tenant_id` and role groups.
- Enforce isolation deterministically at auth, API, and data layers.

---
## Sustainable Access (Pricing Philosophy)

SIC is designed to be sustainably priced so the platform can remain reliable and improve over time.  
We use tiered plans aligned to tenant types (solo coach, club/school, municipality), with usage-based limits on compute-heavy features.  
Low-resource contexts are supported through subsidised tiers, sponsored seats, and program partnerships—without compromising security, data isolation, or quality.

---

## 7. Long-term Vision

SIC becomes the default AI/ML platform for community sports and active mobility, enabling any club, city, or coach. Regardless of budget to make high-quality decisions that improve participation, safety, and community wellbeing.
