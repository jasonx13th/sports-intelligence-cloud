# Runbook Style Guide

Purpose: Every alarm/signal must map to a runbook that enables **<10 minute triage** and **safe mitigation**.

## Non-negotiables
- A runbook must start with: **Trigger → Impact → 5-minute triage**.
- Include at least **one** copy/paste **CloudWatch Logs Insights** query.
- Include **safe mitigation** steps (no risky changes during incident).
- Explicitly call out **tenant isolation constraints** (never “try another tenantId from client input”).
- Close with a **prevention backlog**: what we should change after the incident.

## Template

## 1) Trigger
- Alarm name(s):
- Metric(s) / threshold(s):
- Signal(s) (from `docs/architecture/observability-signals.md`):

## 2) Impact
- Who is impacted?
- What does the user see?
- Is data integrity at risk?

## 3) 5-minute triage (do these first)
1.
2.
3.

## 4) Deep dive

### Logs Insights (copy/paste)
```sql
-- query here
```

### What “good” looks like
- …

### What “bad” looks like
- …

## 5) Mitigation (stop the bleeding)
- Safe, reversible actions:
- If you must rollback, what is the rollback?

## 6) Prevention / follow-ups
- Backlog items:
- Owner:
- Link to issue/ADR:
