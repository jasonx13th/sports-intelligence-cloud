# Sports Intelligence Cloud (SIC) – Vision

## 1. Mission

Sports Intelligence Cloud (SIC) is a multi-tenant, cloud-native platform that gives **clubs, schools, municipalities and individual coaches true ownership and intelligence over their sports data**.

The mission is to turn everyday training, competition and mobility data into **actionable insights that keep people active longer, safer and happier** – while staying affordable and manageable for non-technical organisations **and accessible to individual practitioners, even in low-resource contexts**.

---

## 2. Target Users

SIC is designed for four primary groups:

- **Sports Clubs & Academies**  
  Community clubs, performance academies and youth programmes that need a central, long-term record of athlete development, regardless of coach turnover or tooling changes.

- **Individual Coaches & Practitioners**  
  Solo coaches and trainers (e.g. football, swimming, athletics) who need a simple, affordable way to plan sessions, track athletes and organise data – even if they are not part of a formal club or have limited income.

- **Schools & Educational Programs**  
  Schools and NGO programs running physical education or after-school sports, who need to monitor participation, wellbeing and risk without complex IT overhead.

- **Municipalities & Public-Sector Partners**  
  City sports departments, tourism boards and mobility/health teams who need geospatial and economic insights about cycling routes, participation and social impact.

---

## 3. The Three Pillars

SIC is one platform with three core pillars, sharing the same serverless, multi-tenant AWS foundation.

### 3.1 Club Vivo – Club- and Coach-Centric Data Ownership

**Vision:** Make the **club or training environment** (not the individual app) the long-term owner of athlete data – while still empowering individual coaches to operate independently when no formal club exists.

- Multi-tenant org structure:  
  - **club/academy tenants**: `club → teams → athletes`  
  - **solo-coach tenants**: `coach → groups/athletes`
- Centralised tracking of attendance, training load, wellness, injuries and participation history.
- Role-based access for club admins, coaches, medical staff and optionally families.
- Support for **solo-coach workspaces** where a single coach is both admin and coach for their own tenant.
- Dashboards and season reports that help clubs and coaches make better training and resource decisions.

**Outcome:**  
- Clubs retain athlete history over years, reducing data loss when staff or tools change.  
- Individual coaches gain a “mini platform” of their own that organises their work without requiring a large budget or IT team.

---

### 3.2 Athlete Evolution AI – Intelligence & Risk Management Engine

**Vision:** Provide **early-warning signals and development insights** so coaches can act before dropout or injury happens.

- Predict athlete **dropout risk** within the next 60–90 days.
- Estimate **injury/overload risk** based on training load, recovery and history.
- Track progression curves and development benchmarks over seasons.
- Expose explainable ML outputs and coach-friendly narratives on *why* risk is increasing.

**Outcome:** Coaches move from intuition-only to data-informed decisions, improving retention, safety and fairness.

---

### 3.3 Ruta Viva – Geospatial & Community Impact Analytics

**Vision:** Turn cycling routes and mobility data into **evidence of health, tourism and economic impact**.

- Ingest ride telemetry (GPX/CSV) and map it onto routes and geofences.
- Analyse route usage, intensity, rider categories and temporal patterns.
- Generate municipality-ready reports on tourism, health and potential infrastructure improvements.
- Provide geospatial dashboards and story-telling for local governments and sponsors.

**Outcome:** Cities and programmes can justify investments in active mobility using real data, not anecdotes.

---

## 4. High-Level Problems SIC Will Solve

Across these pillars, Sports Intelligence Cloud focuses on a set of cross-cutting, high-value problems:

1. **Athlete data fragmentation**  
   - Today: Data is scattered across WhatsApp, spreadsheets, paper notebooks and single-purpose apps.  
   - SIC: Provides a unified, multi-tenant platform with clear data ownership, backed by cloud-native storage.

2. **Dropout risk and churn in youth sports**  
   - Today: Coaches see athletes disappear without warning.  
   - SIC: Uses ML pipelines (Athlete Evolution AI) to predict dropout risk and surface early interventions.

3. **Injury and overload risk without visibility**  
   - Today: Training load, wellness and injury history are rarely analysed systematically.  
   - SIC: Aggregates training, workload and recovery signals; surfaces risk scores and explanations so coaches can adjust plans.

4. **Lack of mobility and route analytics for cities**  
   - Today: Cities struggle to quantify how much routes are used, when and by whom.  
   - SIC: Ruta Viva ingests geospatial data, builds heatmaps and impact metrics that inform infrastructure and tourism strategies.

5. **Manual, time-consuming impact reporting**  
   - Today: Clubs and NGOs manually compile reports for sponsors and municipalities.  
   - SIC: Uses a curated data lake plus GenAI to generate clear, stakeholder-specific narratives and visuals.

6. **Limited access to affordable analytics & AI expertise**  
   - Today: Smaller clubs and municipalities cannot hire full data teams. Solo coaches often have no access at all.  
   - SIC: Packages best-practice serverless, ML and GenAI patterns into a managed, multi-tenant SaaS that is cost-aware and secure by design, with tiers that remain accessible for individual coaches.

---

## 5. Architectural & Engineering Principles (Guardrails)

SIC is built under a strict engineering “constitution”:

- **Multi-Tenant First:** Every request carries a `tenant_id`, enforced at auth, API, data and storage layers. No cross-tenant access. Both **solo-coach workspaces** and **club tenants** use the same isolation model.
- **Serverless-First:** Prefer managed services like Lambda, API Gateway, DynamoDB and S3 to reduce ops overhead.
- **ML Lifecycle Completeness:** Any production model must cover data quality, evaluation, deployment, monitoring, drift and retraining.
- **Security & Observability by Default:** Encryption, IAM least-privilege, structured logging, metrics and alerts are non-negotiable.
- **Accessibility & Inclusivity by Design:** Features and pricing should support both well-funded organisations and individual practitioners in low-resource environments without compromising security or data quality.

These principles ensure that each feature in Club Vivo, Athlete Evolution AI and Ruta Viva is **production-ready**, auditable and sustainable to operate.

---

## 6. Long-Term Vision

Over time, Sports Intelligence Cloud will expand with additional modules that plug into the same platform.

The long-term goal is to become the **default AI/ML platform for community sports and active mobility**, enabling any club, city or coach – regardless of size or budget – to make high-quality, data-driven decisions that improve participation, safety and community wellbeing.

---

## 7. Tenant Types & Onboarding (Conceptual)

SIC models access around **tenants**, each with a unique `tenant_id` and shared multi-tenant infrastructure:

- **Solo-Coach Tenant (`tenant_type = "solo-coach"`)**  
  - Created via low-friction self-sign-up.  
  - One primary user acts as both `cv-admin` and `cv-coach`.  
  - No formal club verification required; suitable for low-income or independent coaches.  

- **Club / Organisation Tenant (`tenant_type = "club"`)**  
  - Created via a “Create club/academy” flow with optional verification.  
  - First user is a `cv-admin` who can invite staff (`cv-coach`, `cv-medical`, etc.).  
  - Designed for multi-coach environments, academies, schools and programmes.

Both tenant types:

- Live in the **same Cognito User Pool** and platform.
- Use `custom:tenant_id` on users plus role groups (e.g. `cv-admin`, `cv-coach`) to enforce isolation and permissions.
- Are isolated by `tenant_id` at auth, API and data layers, so no tenant can access another’s data.