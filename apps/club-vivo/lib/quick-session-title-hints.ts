import "server-only";

export const QUICK_SESSION_TITLE_HINTS_COOKIE = "club-vivo-quick-session-title-hints";
const MAX_QUICK_SESSION_TITLE_HINTS = 50;
const MAX_QUICK_SESSION_TITLE_LENGTH = 80;

type QuickSessionTitleHintEntry = {
  sessionId: string;
  title: string;
};

export function normalizeQuickSessionTitle(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, MAX_QUICK_SESSION_TITLE_LENGTH).trim();
}

export function parseQuickSessionTitleHints(
  rawValue: string | undefined
): Record<string, string> {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return {};
    }

    return parsed.reduce<Record<string, string>>((accumulator, item) => {
      if (!item || typeof item !== "object") {
        return accumulator;
      }

      const candidate = item as Partial<QuickSessionTitleHintEntry>;

      if (typeof candidate.sessionId !== "string") {
        return accumulator;
      }

      const title = normalizeQuickSessionTitle(candidate.title);

      if (!title) {
        return accumulator;
      }

      accumulator[candidate.sessionId] = title;
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

export function serializeQuickSessionTitleHints(hints: Record<string, string>) {
  const entries = Object.entries(hints)
    .slice(-MAX_QUICK_SESSION_TITLE_HINTS)
    .map(([sessionId, title]) => ({ sessionId, title }));

  return JSON.stringify(entries);
}

export function withQuickSessionTitleHint(
  rawValue: string | undefined,
  sessionId: string,
  title: string
) {
  const normalizedTitle = normalizeQuickSessionTitle(title);

  if (!normalizedTitle) {
    return serializeQuickSessionTitleHints(parseQuickSessionTitleHints(rawValue));
  }

  return serializeQuickSessionTitleHints({
    ...parseQuickSessionTitleHints(rawValue),
    [sessionId]: normalizedTitle
  });
}
