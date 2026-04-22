import "server-only";

import { formatCoachTeamAgeBand } from "./coach-team-hints";

export const SESSION_BUILDER_CONTEXT_HINTS_COOKIE = "club-vivo-session-builder-context-hints";
const MAX_SESSION_BUILDER_CONTEXT_HINTS = 50;

export type SessionBuilderContextHint = {
  objective?: string;
  teamName?: string;
  environment?: string;
};

type SessionBuilderContextHintEntry = SessionBuilderContextHint & {
  sessionId: string;
};

function normalizeText(value: string | undefined, maxLength: number) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength).trim() : undefined;
}

function normalizeSessionBuilderContextHint(
  value: Partial<SessionBuilderContextHint>
): SessionBuilderContextHint {
  return {
    objective: normalizeText(value.objective, 140),
    teamName: normalizeText(value.teamName, 60),
    environment: normalizeText(value.environment, 48)
  };
}

export function parseSessionBuilderContextHints(
  rawValue: string | undefined
): Record<string, SessionBuilderContextHint> {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return {};
    }

    return parsed.reduce<Record<string, SessionBuilderContextHint>>((accumulator, item) => {
      if (!item || typeof item !== "object") {
        return accumulator;
      }

      const candidate = item as Partial<SessionBuilderContextHintEntry>;

      if (typeof candidate.sessionId !== "string" || !candidate.sessionId.trim()) {
        return accumulator;
      }

      accumulator[candidate.sessionId] = normalizeSessionBuilderContextHint(candidate);
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

export function serializeSessionBuilderContextHints(
  hints: Record<string, SessionBuilderContextHint>
) {
  const entries = Object.entries(hints)
    .slice(-MAX_SESSION_BUILDER_CONTEXT_HINTS)
    .map(([sessionId, hint]) => ({
      sessionId,
      ...normalizeSessionBuilderContextHint(hint)
    }));

  return JSON.stringify(entries);
}

export function withSessionBuilderContextHint(
  rawValue: string | undefined,
  sessionId: string,
  hint: SessionBuilderContextHint
) {
  return serializeSessionBuilderContextHints({
    ...parseSessionBuilderContextHints(rawValue),
    [sessionId]: normalizeSessionBuilderContextHint(hint)
  });
}

export function formatEnvironmentLabel(environment: string | undefined) {
  if (!environment) {
    return "Not set";
  }

  switch (environment) {
    case "grass_field":
      return "Grass field";
    case "turf_field":
      return "Turf field";
    case "gym_floor":
      return "Gym floor";
    case "wood_floor":
      return "Wood floor";
    case "indoor_wood_floor":
      return "Indoor wood floor";
    default:
      return environment;
  }
}

export function buildBuilderSessionDetailTitle({
  buildModeLabel,
  objective,
  teamName,
  ageBand
}: {
  buildModeLabel: string;
  objective?: string;
  teamName?: string;
  ageBand?: string;
}) {
  return [
    buildModeLabel,
    normalizeText(objective, 140),
    normalizeText(teamName, 60),
    ageBand ? formatCoachTeamAgeBand(ageBand) : undefined
  ]
    .filter(Boolean)
    .join(" / ");
}

export function buildBuilderSessionCardTitle({
  buildModeLabel,
  objective,
  teamName,
  ageBand
}: {
  buildModeLabel: string;
  objective?: string;
  teamName?: string;
  ageBand?: string;
}) {
  const parts = [
    buildModeLabel,
    normalizeText(teamName, 60),
    ageBand ? formatCoachTeamAgeBand(ageBand) : undefined
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : null;
}
