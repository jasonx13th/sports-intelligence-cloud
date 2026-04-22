import "server-only";

export const SESSION_ORIGIN_HINTS_COOKIE = "club-vivo-session-origin-hints";
const MAX_SESSION_ORIGIN_HINTS = 50;

export type SessionOriginHint = "quick_session" | "full_session" | "quick_drill";

const SESSION_ORIGIN_VALUES = new Set<SessionOriginHint>([
  "quick_session",
  "full_session",
  "quick_drill"
]);

type SessionOriginHintEntry = {
  sessionId: string;
  origin: SessionOriginHint;
};

export function parseSessionOriginHint(value: string | undefined): SessionOriginHint | undefined {
  return SESSION_ORIGIN_VALUES.has(value as SessionOriginHint)
    ? (value as SessionOriginHint)
    : undefined;
}

export function parseSessionOriginHints(
  rawValue: string | undefined
): Record<string, SessionOriginHint> {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return {};
    }

    return parsed.reduce<Record<string, SessionOriginHint>>((accumulator, item) => {
      if (!item || typeof item !== "object") {
        return accumulator;
      }

      const candidate = item as Partial<SessionOriginHintEntry>;

      if (
        typeof candidate.sessionId !== "string" ||
        !SESSION_ORIGIN_VALUES.has(candidate.origin as SessionOriginHint)
      ) {
        return accumulator;
      }

      accumulator[candidate.sessionId] = candidate.origin as SessionOriginHint;
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

export function serializeSessionOriginHints(
  hints: Record<string, SessionOriginHint>
) {
  const entries = Object.entries(hints)
    .slice(-MAX_SESSION_ORIGIN_HINTS)
    .map(([sessionId, origin]) => ({ sessionId, origin }));

  return JSON.stringify(entries);
}

export function withSessionOriginHint(
  rawValue: string | undefined,
  sessionId: string,
  origin: SessionOriginHint
) {
  const nextHints = {
    ...parseSessionOriginHints(rawValue),
    [sessionId]: origin
  };

  return serializeSessionOriginHints(nextHints);
}

export function getSessionOriginLabel(origin: SessionOriginHint) {
  switch (origin) {
    case "quick_session":
      return "Quick Session";
    case "quick_drill":
      return "Drill";
    case "full_session":
      return "Full Session";
  }
}

export function getSessionCardTitle(
  session: { sport: string; ageBand: string },
  origin?: SessionOriginHint,
  quickSessionTitle?: string,
  builderSessionTitle?: string | null
) {
  switch (origin) {
    case "quick_session":
      return quickSessionTitle?.trim() || null;
    case "quick_drill":
      return builderSessionTitle?.trim() || null;
    case "full_session":
      return builderSessionTitle?.trim() || null;
    default:
      return `${session.sport} / ${session.ageBand}`;
  }
}

export function shouldShowObjectiveTagsForOrigin(origin?: SessionOriginHint) {
  return origin !== "quick_session";
}
