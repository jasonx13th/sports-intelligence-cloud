# Ruta Viva

Status: future SIC product concept. This is not an active runtime app in GitHub `main`.

Ruta Viva is the cycling and active mobility analytics pillar of the Sports Intelligence Cloud (SIC).
It helps municipalities, NGOs, and clubs understand **how people move and where investment matters most**, scoped per tenant (city, program, or club).

## Target users

- Municipalities and local governments (mobility / infrastructure teams)
- NGOs and community cycling programs
- Clubs and schools running community rides

## Core goals (first 6–12 months)

- Ingest **ride traces and activity logs** (GPX, CSV, app integrations).
- Store and query **geospatial data** about routes, segments, and usage.
- Provide **dashboards and maps** showing:
  - Popular routes, unsafe segments, and coverage by neighborhood.
  - Event and program impact over time.
- Generate **narrative impact reports** that non-technical stakeholders can understand.

## Planned AWS services (MVP)

- **Amazon S3** – raw and processed ride data (Bronze / Silver / Gold layers).
- **AWS Glue** – ETL jobs to clean and transform ride datasets.
- **Amazon Athena** – interactive queries over S3 data.
- **Amazon QuickSight** – dashboards and basic mapping.
- **Amazon Location Service** (or equivalent) – map tiles, geocoding, route info.
- **AWS Lambda** – ingestion endpoints and processing helpers.
- **Amazon Bedrock (later)** – generating plain-language impact summaries.

## Relationship to other pillars

- Shares the core SIC platform (auth, `tenant_id` model, data lake, ML) with Club Vivo and Athlete Evolution AI.
- Can link routes and events back to **Club Vivo tenants** (clubs, schools, programmes) to tell a combined story about sports, mobility, and community impact for each tenant.
