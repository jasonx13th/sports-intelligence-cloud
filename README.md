# Sports Intelligence Cloud

Monorepo for the Sports Intelligence Cloud (SIC) platform.

## Portfolio highlight

Sports Intelligence Cloud (SIC) is a multi tenant, serverless AI and analytics platform on AWS for clubs, schools, municipalities, and individual coaches.

This portfolio highlight focuses on making serverless APIs predictable under pressure:

- Consistent error responses across every endpoint
- Clear guidance on what to do next, fix it or retry it
- Fail closed access to protect multi tenant boundaries
- Idempotent writes to prevent duplicate payments and registrations
- Correlation IDs for fast support tracing and operations visibility

If you only read two docs, start here:

- Error contract and response envelope: [`docs/errors/`](docs/errors/)
- Tenant identity and claims: [`docs/architecture/tenant-claim-contract.md`](docs/architecture/tenant-claim-contract.md)

More context:

- Architecture principles: [`docs/architecture/SIC architecture principles.md`](docs/architecture/SIC%20architecture%20principles.md)
- Architecture diagrams: [`docs/architecture/SIC Architecture Diagrams.md`](docs/architecture/SIC%20Architecture%20Diagrams.md)

Public safety note: this repo contains no secrets, credentials, or real customer data.

## Mission & Users

Sports Intelligence Cloud (SIC) helps **clubs, schools, municipalities and individual coaches** own and control their sports data and turn it into actionable insights.

Main users:

- Sports clubs and academies
- Individual coaches and practitioners (solo coach workspaces)
- Schools and NGO sports programmes
- Municipalities and public sector partners

SIC is designed as a **multi tenant, serverless, AI & ML platform** on AWS.

---

## Docs

- **Vision:** [`docs/vision.md`](docs/vision.md)

---

## Pillars

- **Club Vivo** – club and coach centric data ownership and athlete history (multi tenant tenants: clubs, schools, solo coach workspaces)
- **Athlete Evolution AI** – dropout and injury risk intelligence
- **Ruta Viva** – geospatial mobility and community impact analytics
