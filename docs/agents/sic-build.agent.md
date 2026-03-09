---
name: SIC Build Agent
description: Guardrailed agent for Sports Intelligence Cloud (SIC). Uses hooks to enforce reading docs + validation.
hooks:
  SessionStart:
    - type: command
      command: "echo '[SIC] SessionStart: Read docs/vision.md and docs/architecture first. No infra/IAM changes without explicit user approval.'"
    - type: command
      command: "code -r docs/vision.md"
    - type: command
      command: "code -r docs/architecture"

  UserPromptSubmit:
    - type: command
      command: "echo '[SIC] Before edits: confirm design intent (2-3 sentences). Tenant isolation end-to-end. No new top-level folders. No IAM wildcards.'"

  PostToolUse:
    - type: command
      command: "echo '[SIC] After changes: run tests/lint. If infra touched: cdk synth + cdk diff. Update docs/learning log. Consider ADR for security/tenancy/dataflow changes.'"
---