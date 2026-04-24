import { buildBuilderSessionLabel } from "./builder-session-label";

export const QUICK_SESSION_DEFAULT_DURATION_MIN = 60;
const QUICK_SESSION_THEME_MAX_LENGTH = 60;
const QUICK_SESSION_OBJECTIVE_MAX_LENGTH = 44;

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

function includesAny(normalizedPrompt: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(normalizedPrompt));
}

function stripDurationPhrase(prompt: string) {
  return prompt.replace(/\b\d{1,3}\s*(?:-| )?(?:minute|minutes|min|mins)\b/gi, " ");
}

function stripEquipmentPhrases(prompt: string) {
  return prompt.replace(
    /\b(?:with|using|use|need|needs)\s+(?:flat\s+cones?|cones?|balls?|goals?|mini\s+goals?|pug\s+goals?|pinnies|bibs|mannequins?|poles?|ladders?)(?:\s*(?:,|and)\s*(?:flat\s+cones?|cones?|balls?|goals?|mini\s+goals?|pug\s+goals?|pinnies|bibs|mannequins?|poles?|ladders?))*\b/gi,
    " "
  );
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
    stripEquipmentPhrases(stripDurationPhrase(prompt))
      .replace(
        /^(today we need|today i need|we need|i need|need|want|please|create|build|make|give me|plan)\s+/i,
        ""
      )
      .replace(/\b(session|practice)\b/gi, " ")
  );
}

function detectOverloads(prompt: string) {
  const matches = prompt.match(/\b\d+\s*v\s*\d+\b/gi) || [];
  return [...new Set(matches.map((match) => match.toLowerCase().replace(/\s+/g, "")))];
}

export function detectQuickSessionFocusTags(prompt: string) {
  const normalized = ` ${normalizeText(prompt).toLowerCase()} `;
  const tags: string[] = [];

  const add = (tag: string, patterns: RegExp[]) => {
    if (includesAny(normalized, patterns) && !tags.includes(tag)) {
      tags.push(tag);
    }
  };

  add("attacking", [/\battack(?:ing)?\b/, /\bcreate chances\b/, /\bgoing forward\b/]);
  add("defending", [/\bdefend(?:ing)?\b/, /\bdefensive\b/, /\bdeny\b/]);
  add("transition", [/\btransition(?:s)?\b/, /\bcounter(?: attack|attack|ing)?\b/, /\bregain\b/]);
  add("possession", [/\bpossession\b/, /\bkeep(?:ing)? the ball\b/, /\brondo\b/]);
  add("pressing", [/\bpress(?:ing)?\b/]);
  add("pressure", [/\bpressure\b/, /\bpressur(?:e|ing)\b/]);
  add("finishing", [/\bfinish(?:ing)?\b/, /\bshoot(?:ing)?\b/, /\bscore\b/, /\bgoals?\b/]);
  add("passing", [/\bpass(?:ing)?\b/, /\bcombination(?:s)?\b/, /\bsupport angles?\b/]);
  add("dribbling", [/\bdribbl(?:e|ing)\b/, /\bball mastery\b/, /\btake players on\b/]);
  add("1v1", [/\b1\s*v\s*1\b/, /\bone[\s-]?v[\s-]?one\b/]);

  const overloads = detectOverloads(normalized);
  for (const overload of overloads) {
    if (overload !== "1v1" && !tags.includes(overload)) {
      tags.push(overload);
    }
  }

  if (overloads.some((overload) => overload !== "1v1")) {
    tags.push("overloads");
  }

  return tags.slice(0, 6);
}

export function detectQuickSessionEquipment(prompt: string) {
  const normalized = ` ${normalizeText(prompt).toLowerCase()} `;
  const equipment: string[] = [];

  const add = (item: string, patterns: RegExp[]) => {
    if (includesAny(normalized, patterns) && !equipment.includes(item)) {
      equipment.push(item);
    }
  };

  add("flat cones", [/\bflat cones?\b/, /\bdisc cones?\b/]);
  add("cones", [/\bcones?\b/]);
  add("balls", [/\bballs?\b/, /\bsoccer balls?\b/]);
  add("mini goals", [/\bmini goals?\b/, /\bsmall goals?\b/]);
  add("pug goals", [/\bpug goals?\b/]);
  add("goals", [/\bgoals?\b/, /\bfull goals?\b/]);
  add("pinnies", [/\bpinnies\b/, /\bbibs\b/, /\bvests\b/]);
  add("mannequins", [/\bmannequins?\b/, /\bdummies\b/]);
  add("poles", [/\bpoles?\b/]);
  add("ladders", [/\bladders?\b/, /\bagility ladders?\b/]);

  return equipment.filter((item) => {
    if (item === "cones" && equipment.includes("flat cones")) return false;
    if (item === "goals" && (equipment.includes("mini goals") || equipment.includes("pug goals"))) return false;
    return true;
  });
}

export function detectQuickSessionPlayerCount(prompt: string) {
  const normalized = normalizeText(prompt).toLowerCase();
  const playersMatch = normalized.match(/\b(\d{1,2})\s*(?:players?|kids?|athletes?)\b/);

  if (playersMatch?.[1]) {
    const count = Number.parseInt(playersMatch[1], 10);
    return Number.isInteger(count) && count > 0 ? count : undefined;
  }

  const overload = detectOverloads(normalized)[0];
  if (!overload) {
    return undefined;
  }

  const parts = overload.split("v").map((part) => Number.parseInt(part, 10));
  const total = parts.reduce((sum, part) => sum + (Number.isInteger(part) ? part : 0), 0);
  return total > 0 ? total : undefined;
}

function buildFocusPhrase(tags: string[]) {
  const tacticalTags = tags.filter((tag) => tag !== "overloads").slice(0, 4);
  if (tacticalTags.length < 1) {
    return "";
  }

  return tacticalTags.join(" ");
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
  const focusTags = detectQuickSessionFocusTags(prompt);
  const focusPhrase = buildFocusPhrase(focusTags);

  if (focusPhrase) {
    return clampPromptPart(focusPhrase, QUICK_SESSION_OBJECTIVE_MAX_LENGTH);
  }

  const normalized = cleanObjectiveSeed(prompt);
  const firstClause = normalized
    .split(/[.;,]/)
    .map((part) => part.trim())
    .find(Boolean);

  return clampPromptPart(firstClause || normalized || "quick session", QUICK_SESSION_OBJECTIVE_MAX_LENGTH);
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
  const playerCount = detectQuickSessionPlayerCount(prompt);
  const compactTheme = [
    "quick",
    objectivePart,
    playerCount ? `${playerCount} players` : "",
    notesPart ? `notes:${notesPart}` : "",
    environmentPart ? `env:${environmentPart}` : "",
  ]
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

function formatDisplayTag(tag: string) {
  return tag
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (part.includes("v") ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

export function buildQuickSessionFocusSummary(session: QuickSessionLike & { equipment?: string[] }) {
  const focusTags = Array.isArray(session.objectiveTags)
    ? session.objectiveTags
        .filter((tag) => typeof tag === "string" && tag.trim())
        .filter((tag) => tag.trim().toLowerCase() !== "theme")
        .slice(0, 5)
        .map(formatDisplayTag)
    : [];
  const equipment = Array.isArray(session.equipment)
    ? session.equipment.filter((item) => typeof item === "string" && item.trim()).slice(0, 4)
    : [];
  const activityCount = Array.isArray(session.activities) ? session.activities.length : 0;

  const focusText = focusTags.length ? focusTags.join(", ") : "the quick-session objective";
  const equipmentText = equipment.length ? ` using ${equipment.join(", ")}` : "";
  const activityText = activityCount > 0 ? ` across ${activityCount} activities` : "";

  return `Focus on ${focusText}${equipmentText}${activityText}.`;
}

export function buildQuickSessionIntent(prompt: string) {
  const duration = extractQuickSessionDuration(prompt);
  const equipment = detectQuickSessionEquipment(prompt);

  return {
    durationMin: duration.durationMin,
    durationSource: duration.source,
    theme: buildQuickSessionTheme(prompt),
    focusTags: detectQuickSessionFocusTags(prompt),
    equipment,
    playerCount: detectQuickSessionPlayerCount(prompt),
  };
}
