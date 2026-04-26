# Athlete Evolution AI

Status: future SIC product concept. This is not an active runtime app in GitHub `main`.

Athlete Evolution AI is the machine learning and GenAI engine of the Sports Intelligence Cloud (SIC).
It turns longitudinal training and context data into **insights and risk scores** for young athletes, scoped per `tenant_id` (club, school, or solo-coach workspace).

## Target users

- Coaches and performance staff
- Medical / wellbeing staff
- Club and program directors

## Core goals (first 6–12 months)

- Ingest **training, attendance, wellbeing, and context data** from Club Vivo (per tenant).
- Train models to estimate:
  - Dropout risk
  - Injury / overload risk
  - Development / progression indicators
- Return **simple, explainable scores** and recommendations back into Club Vivo dashboards for each tenant.
- Maintain a **responsible AI approach**:
  - Clear limitations and assumptions
  - Human-in-the-loop decision-making
  - Strong privacy and tenant isolation guarantees

## Planned AWS services (MVP)

- **Amazon S3** – feature and label data, training datasets, model artifacts.
- **Amazon SageMaker** – training, tuning, and hosting of ML models.
- **Amazon SageMaker Feature Store** (optional later) – reusable features across models.
- **AWS Lambda** – orchestration glue and batch/online scoring.
- **Amazon DynamoDB / S3** – storing model outputs per athlete and per tenant (`tenant_id`).
- **Amazon Bedrock (later)** – narrative explanation of risk and progression for coaches.

## Relationship to other pillars

- Reads data primarily from **Club Vivo** (S3 + APIs) and writes scores back for visualization per tenant.
- Can also use **Ruta Viva** activity data (e.g., community rides) as additional context.
- Shares the same multi-tenant, serverless foundation as other SIC components (Cognito, API Gateway, Lambda, DynamoDB, S3).
