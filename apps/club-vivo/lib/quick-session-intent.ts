import { buildBuilderSessionLabel } from "./builder-session-label";

export const QUICK_SESSION_DEFAULT_DURATION_MIN = 60;
const QUICK_SESSION_THEME_MAX_LENGTH = 60;

type QuickSessionLike = {
  objectiveTags: string[];
  activities?: { name: string }[];
};

function normalizeText(value: string | undefined, maxLength?: number) {
  if (!value) {
    return "";
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  return typeof maxLength === "number" ? normalized.slice(0, maxLength).trim() : normalized;
}

function clampPromptPart(value: string, maxLength: number) {
  return normalizeText(value, maxLength);
}

function stripDurationPhrase(prompt: string) {
  return prompt.replace(/\b\d{1,3}\s*(?:-| )?(?:minute|minutes|min|mins)\b/gi, " ");
}

function detectEnvironment(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("indoor wood")) return "indoor wood floor";
  if (normalized.includes("gym")) return "gym floor";
  if (normalized.includes("wood floor") || normalized.includes("hardwood")) return "wood floor";
  if (normalized.includes("turf")) return "turf";
  if (normalized.includes("grass")) return "grass";

  return "";
}

function cleanObjectiveSeed(prompt: string) {
  return normalizeText(
    stripDurationPhrase(prompt)
      .replace(
        /^(today we need|we need|i need|need|want|please|create|build|make|give me|plan)\s+/i,
        ""
      )
      .replace(/\b(session|practice)\b/gi, " ")
  );
}

export function extractQuickSessionDuration(prompt: string) {
  const match = prompt.match(/\b(\d{1,3})\s*(?:-| )?(?:minute|minutes|min|mins)\b/i);
  const duration = match ? Number.parseInt(match[1] || "", 10) : Number.NaN;

  if (!Number.isInteger(duration) || duration < 1) {
    return {
      durationMin: QUICK_SESSION_DEFAULT_DURATION_MIN,
      source: "default" as const
    };
  }

  return {
    durationMin: duration,
    source: "prompt" as const
  };
}

export function buildQuickSessionObjective(prompt: string) {
  const normalized = cleanObjectiveSeed(prompt);
  const firstClause = normalized
    .split(/[.;,]/)
    .map((part) => part.trim())
    .find(Boolean);

  return clampPromptPart(firstClause || normalized || "quick session", 32);
}

export function buildQuickSessionNotes(prompt: string) {
  const normalized = cleanObjectiveSeed(prompt);
  const clauses = normalized
    .split(/[.;,]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (clauses.length <= 1) {
    return "";
  }

  return clampPromptPart(clauses.slice(1).join(", "), 26);
}

export function buildQuickSessionTheme(prompt: string) {
  const objectivePart = buildQuickSessionObjective(prompt);
  const notesPart = buildQuickSessionNotes(prompt);
  const environmentPart = clampPromptPart(detectEnvironment(prompt), 14);
  const compactTheme = [objectivePart, notesPart ? `notes:${notesPart}` : "", environmentPart ? `env:${environmentPart}` : ""]
    .filter(Boolean)
    .join(" | ");

  return clampPromptPart(compactTheme || "quick session", QUICK_SESSION_THEME_MAX_LENGTH);
}

export function buildQuickSessionTitle({
  prompt,
  session
}: {
  prompt?: string;
  session?: QuickSessionLike;
}) {
  const normalizedPrompt = normalizeText(prompt);
  const objective = normalizedPrompt ? buildQuickSessionObjective(normalizedPrompt) : undefined;

  if (!session) {
    return objective || "Quick Session";
  }

  return buildBuilderSessionLabel({
    objective,
    objectiveTags: session.objectiveTags,
    activities: session.activities
  });
}

export function buildQuickSessionPromptSummary(prompt: string) {
  return normalizeText(prompt, 180);
}
