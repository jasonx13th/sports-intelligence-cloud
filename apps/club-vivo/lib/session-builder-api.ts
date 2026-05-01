import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_COOKIE } from "./auth";
import { buildApiUrl } from "./api";

export type SessionListItem = {
  sessionId: string;
  createdAt: string;
  sport: string;
  ageBand: string;
  durationMin: number;
  objectiveTags: string[];
  activityCount: number;
};

export type SessionActivity = {
  name: string;
  minutes: number;
  description?: string;
};

export type SessionDetail = {
  sessionId: string;
  createdAt: string;
  createdBy: string | null;
  sport: string;
  ageBand: string;
  durationMin: number;
  objectiveTags: string[];
  equipment: string[];
  activities: SessionActivity[];
  schemaVersion: number;
};

export type GenerateSessionPackInput = {
  sport: string;
  sportPackId?: "fut-soccer";
  ageBand: string;
  durationMin: number;
  theme: string;
  sessionMode?: "full_session" | "drill" | "quick_activity";
  coachNotes?: string;
  sessionsCount?: number;
  equipment?: string[];
  confirmedProfile?: ConfirmedImageAnalysisProfile;
  teamName?: string;
  teamAgeBand?: string;
  programType?: "travel" | "ost" | string;
};

export type ImageAnalysisMode = "environment_profile" | "setup_to_drill";
export type SourceImageMimeType = "image/jpeg" | "image/png" | "image/webp";
export type AnalysisStatus = "draft" | "confirmed";
export type AnalysisConfidence = "low" | "medium" | "high";
export type SpaceSize = "small" | "medium" | "large" | "full" | "unknown";

export type EnvironmentProfile = {
  mode: "environment_profile";
  schemaVersion: 1;
  analysisId: string;
  status: AnalysisStatus;
  sourceImageId: string;
  sourceImageMimeType: SourceImageMimeType;
  summary: string;
  surfaceType: "grass" | "turf" | "indoor" | "hardcourt" | "unknown";
  spaceSize: SpaceSize;
  boundaryType:
    | "small-grid"
    | "half-field"
    | "full-field"
    | "indoor-court"
    | "mixed"
    | "unknown";
  visibleEquipment: string[];
  constraints: string[];
  safetyNotes: string[];
  assumptions: string[];
  analysisConfidence: AnalysisConfidence;
};

export type SetupProfile = {
  mode: "setup_to_drill";
  schemaVersion: 1;
  analysisId: string;
  status: AnalysisStatus;
  sourceImageId: string;
  sourceImageMimeType: SourceImageMimeType;
  summary: string;
  layoutType: "box" | "lane" | "channel" | "grid" | "half-pitch" | "unknown";
  spaceSize: SpaceSize;
  playerOrganization:
    | "individual"
    | "pairs"
    | "small-groups"
    | "two-lines"
    | "two-teams"
    | "unknown";
  visibleEquipment: string[];
  focusTags: string[];
  constraints: string[];
  assumptions: string[];
  analysisConfidence: AnalysisConfidence;
};

export type ImageAnalysisProfile = EnvironmentProfile | SetupProfile;
export type ConfirmedImageAnalysisProfile =
  | (Omit<EnvironmentProfile, "status"> & { status: "confirmed" })
  | (Omit<SetupProfile, "status"> & { status: "confirmed" });

export type AnalyzeSessionImageInput = {
  mode: ImageAnalysisMode;
  sourceImage: {
    filename?: string;
    mimeType: SourceImageMimeType;
    bytesBase64: string;
  };
};

export type ImageAnalysisResult = {
  analysisId: string;
  profile: ImageAnalysisProfile;
};

export type GeneratedSession = {
  sport: string;
  ageBand: string;
  durationMin: number;
  objectiveTags: string[];
  equipment: string[];
  activities: SessionActivity[];
};

export type SessionPack = {
  packId: string;
  createdAt: string;
  sport: string;
  ageBand: string;
  durationMin: number;
  theme: string;
  sessionsCount: number;
  equipment: string[];
  sessions: GeneratedSession[];
};

export type SessionPdfResult = {
  url: string;
  expiresInSeconds: number;
};

export type SessionFeedbackImageAnalysisAccuracy =
  | "not_used"
  | "low"
  | "medium"
  | "high";

export type SessionFeedbackFlowMode =
  | "session_builder"
  | "environment_profile"
  | "setup_to_drill";

export type SubmitSessionFeedbackInput = {
  sessionQuality: number;
  drillUsefulness: number;
  imageAnalysisAccuracy: SessionFeedbackImageAnalysisAccuracy;
  favoriteActivity?: string;
  missingFeatures: string;
  flowMode?: SessionFeedbackFlowMode;
};

export type SessionFeedback = {
  sessionId: string;
  submittedAt: string;
  submittedBy: string | null;
  sessionQuality: number;
  drillUsefulness: number;
  imageAnalysisAccuracy: SessionFeedbackImageAnalysisAccuracy;
  favoriteActivity?: string;
  missingFeatures: string;
  flowMode?: SessionFeedbackFlowMode;
  schemaVersion: number;
};

export class SessionBuilderApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "SessionBuilderApiError";
    this.status = status;
    this.details = details;
  }
}

const LEGACY_COMPATIBILITY_FIELDS = [
  "sessionMode",
  "coachNotes",
  "sportPackId",
  "confirmedProfile"
] as const;
const SUPPORTED_API_AGE_BANDS = new Set(["u6", "u8", "u10", "u12", "u14", "u16", "u18", "adult"]);
const UNSAFE_AGE_BAND_VALUES = new Set(["", "mixed", "mixed age", "mixed_age", "not set", "unknown"]);

function stringifyErrorDetails(details: unknown) {
  if (typeof details === "string") {
    return details;
  }

  try {
    return JSON.stringify(details);
  } catch {
    return "";
  }
}

function collectUnknownFields(details: unknown): string[] {
  const fields = new Set<string>();

  function visit(value: unknown) {
    if (!value || typeof value !== "object") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const record = value as Record<string, unknown>;
    const unknown = record.unknown;

    if (Array.isArray(unknown)) {
      unknown.forEach((field) => {
        if (typeof field === "string") {
          fields.add(field);
        }
      });
    }

    Object.values(record).forEach(visit);
  }

  visit(details);
  return [...fields];
}

function collectValidationDetails(details: unknown) {
  const reasons = new Set<string>();
  const missingEquipment = new Set<string>();

  function visit(value: unknown) {
    if (!value || typeof value !== "object") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const record = value as Record<string, unknown>;

    if (typeof record.reason === "string") {
      reasons.add(record.reason);
    }

    if (Array.isArray(record.missingEquipment)) {
      record.missingEquipment.forEach((item) => {
        if (typeof item === "string") {
          missingEquipment.add(item.toLowerCase());
        }
      });
    }

    Object.values(record).forEach(visit);
  }

  visit(details);

  return {
    reasons: [...reasons],
    missingEquipment: [...missingEquipment]
  };
}

function hasValidationReason(details: unknown, reason: string) {
  const validationDetails = collectValidationDetails(details);
  const text = stringifyErrorDetails(details);
  return validationDetails.reasons.includes(reason) || text.includes(reason);
}

function isMissingGoalsError(details: unknown) {
  const validationDetails = collectValidationDetails(details);
  const text = stringifyErrorDetails(details).toLowerCase();

  return (
    hasValidationReason(details, "incompatible_equipment") &&
    (validationDetails.missingEquipment.includes("goals") ||
      text.includes("missingequipment") && text.includes("goals"))
  );
}

function hasLegacyCompatibilityUnknownFields(details: unknown) {
  const unknownFields = collectUnknownFields(details);

  if (
    unknownFields.some((field) =>
      (LEGACY_COMPATIBILITY_FIELDS as readonly string[]).includes(field)
    )
  ) {
    return true;
  }

  const text = stringifyErrorDetails(details);
  return LEGACY_COMPATIBILITY_FIELDS.some((field) => text.includes(field));
}

function hasLegacyCompatibilityFields(input: GenerateSessionPackInput) {
  return Boolean(input.sessionMode || input.coachNotes || input.sportPackId || input.confirmedProfile);
}

function normalizeAgeBandValue(value: unknown) {
  const normalized = String(value ?? "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const numberWords: Record<string, number> = {
    six: 6,
    eight: 8,
    ten: 10,
    twelve: 12,
    fourteen: 14,
    sixteen: 16,
    eighteen: 18
  };
  const underWordMatch = normalized.match(/\bunder\s+(six|eight|ten|twelve|fourteen|sixteen|eighteen)\b/);

  if (underWordMatch?.[1]) {
    const candidate = `u${numberWords[underWordMatch[1]]}`;
    return SUPPORTED_API_AGE_BANDS.has(candidate) ? candidate : "";
  }

  if (UNSAFE_AGE_BAND_VALUES.has(normalized)) {
    return "";
  }

  const match =
    normalized.match(/\bu\s*([0-9]{1,2})\b/) ||
    normalized.match(/\bunder\s*([0-9]{1,2})\b/) ||
    normalized.match(/\b([0-9]{1,2})\s*u\b/);
  const candidate = match?.[1] ? `u${Number.parseInt(match[1], 10)}` : normalized;

  return SUPPORTED_API_AGE_BANDS.has(candidate) ? candidate : "";
}

function resolveSafeAgeBand(input: GenerateSessionPackInput) {
  const candidates = [
    input.ageBand,
    input.teamAgeBand,
    input.theme,
    input.coachNotes
  ];

  for (const candidate of candidates) {
    const normalized = normalizeAgeBandValue(candidate);

    if (normalized) {
      return normalized;
    }
  }

  const programType = String(input.programType || "").toLowerCase();
  const rawTeamAgeBand = String(input.teamAgeBand || input.ageBand || "").toLowerCase();

  if (programType === "ost" && rawTeamAgeBand.includes("mixed")) {
    return "u10";
  }

  return "u14";
}

function hasGoalEquipment(items: string[] = []) {
  return items.some((item) => {
    const normalized = item.toLowerCase().replace(/\s+/g, " ").trim();
    return isGoalCompatibleEquipmentName(normalized);
  });
}

function isGoalCompatibleEquipmentName(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();
  return (
    normalized === "goals" ||
    normalized === "goal" ||
    normalized === "pugg goals" ||
    normalized === "pug goals" ||
    normalized === "mini goals" ||
    normalized === "small goals" ||
    normalized === "portable goals" ||
    normalized.includes("pugg goal") ||
    normalized.includes("pug goal") ||
    normalized.includes("mini goal") ||
    normalized.includes("small goal") ||
    normalized.includes("portable goal")
  );
}

function hasLegacyGoalsEquipment(items: string[] = []) {
  return items.some((item) => {
    const normalized = item.toLowerCase().replace(/\s+/g, " ").trim();
    return normalized === "goal" || normalized === "goals";
  });
}

function buildLegacyGoalCompatibleEquipment(items: string[] = []) {
  const nextItems = [...items];

  if (!hasLegacyGoalsEquipment(nextItems)) {
    nextItems.push("goals");
  }

  return [...new Set(nextItems)];
}

function sanitizeMixedAgeText(value: string) {
  return value
    .replace(/\bMixed age\b/gi, "mixed-age group")
    .replace(/\bmixed_age\b/gi, "mixed-age group");
}

function sanitizeGenerateSessionPackInput(input: GenerateSessionPackInput) {
  const ageBand = resolveSafeAgeBand(input);

  return {
    ...input,
    ageBand,
    theme: sanitizeMixedAgeText(input.theme),
    ...(input.coachNotes ? { coachNotes: sanitizeMixedAgeText(input.coachNotes) } : {})
  };
}

function toApiPayload(input: GenerateSessionPackInput) {
  const {
    teamName: _teamName,
    teamAgeBand: _teamAgeBand,
    programType: _programType,
    ...payload
  } = input;

  return payload;
}

function buildSafeDebugObject(input: GenerateSessionPackInput) {
  return {
    ageBand: input.ageBand,
    teamName: input.teamName,
    teamAgeBand: input.teamAgeBand,
    normalizedAgeBand: resolveSafeAgeBand(input),
    programType: input.programType,
    equipment: input.equipment,
    sessionMode: input.sessionMode
  };
}

function appendLegacyThemePart(theme: string, part: string) {
  const normalizedTheme = theme.replace(/\s+/g, " ").trim();
  const normalizedPart = part.replace(/\s+/g, " ").trim();
  const maxThemeLength = 60;

  if (!normalizedPart || normalizedTheme.toLowerCase().includes(normalizedPart.toLowerCase())) {
    return normalizedTheme;
  }

  const nextTheme = [normalizedTheme, normalizedPart].filter(Boolean).join(" | ");
  return nextTheme.slice(0, maxThemeLength).trim();
}

function buildLegacyTheme(input: GenerateSessionPackInput) {
  let theme = input.theme;

  if (input.sessionMode === "drill") {
    theme = appendLegacyThemePart(theme, "format:quick_activity");
  } else if (input.sessionMode === "full_session") {
    theme = appendLegacyThemePart(theme, "session");
  }

  if (input.coachNotes) {
    theme = appendLegacyThemePart(theme, `notes:${input.coachNotes}`);
  }

  return sanitizeMixedAgeText(theme);
}

function toLegacyGenerateSessionPackInput(input: GenerateSessionPackInput) {
  const {
    sessionMode: _sessionMode,
    coachNotes: _coachNotes,
    sportPackId: _sportPackId,
    confirmedProfile: _confirmedProfile,
    teamName: _teamName,
    teamAgeBand: _teamAgeBand,
    programType: _programType,
    ...legacyInput
  } = input;

  return {
    ...legacyInput,
    theme: buildLegacyTheme(input)
  };
}

function splitDurationByWeights(durationMin: number, weights: number[]) {
  const weighted = weights.map((weight, index) => {
    const rawMinutes = durationMin * weight;
    return {
      index,
      minutes: Math.max(1, Math.floor(rawMinutes)),
      remainder: rawMinutes - Math.floor(rawMinutes)
    };
  });
  let total = weighted.reduce((sum, item) => sum + item.minutes, 0);

  while (total < durationMin) {
    const item = [...weighted].sort((a, b) => b.remainder - a.remainder || b.index - a.index)[0];
    item.minutes += 1;
    total += 1;
  }

  while (total > durationMin) {
    const item = [...weighted]
      .sort((a, b) => b.minutes - a.minutes || b.index - a.index)
      .find((candidate) => candidate.minutes > 1);

    if (!item) {
      break;
    }

    item.minutes -= 1;
    total -= 1;
  }

  return weighted.sort((a, b) => a.index - b.index).map((item) => item.minutes);
}

function shapeLegacySessionToSingleActivity(
  session: GeneratedSession,
  durationMin: number,
  fallbackName: string
): GeneratedSession {
  const sourceActivity = session.activities[1] || session.activities[0];
  const activity = sourceActivity || {
    name: fallbackName,
    description:
      "Set one clear grid with a simple scoring rule, quick rotations, and a few practical coaching cues."
  };

  return {
    ...session,
    durationMin,
    activities: [
      {
        ...activity,
        name: activity.name?.trim() || fallbackName,
        minutes: durationMin
      }
    ]
  };
}

function shapeLegacyPackForRequestedMode(
  pack: SessionPack,
  input: GenerateSessionPackInput
): SessionPack {
  if (input.sessionMode === "full_session") {
    const minutes = splitDurationByWeights(input.durationMin, [0.2, 0.3, 0.3, 0.2]);

    return {
      ...pack,
      durationMin: input.durationMin,
      sessions: pack.sessions.map((session) => {
        const activities = session.activities;
        const first = activities[0] || {
          name: "Arrival game warm-up",
          description: "Start with an active arrival game tied to the session focus."
        };
        const second = activities[1] || activities[0] || {
          name: "Main activity",
          description: "Run the main activity with clear scoring and short coaching cues."
        };
        const third = activities[2] || activities[1] || activities[0] || {
          name: "Conditioned game progression",
          description: "Progress the activity into a game-like challenge."
        };

        return {
          ...session,
          durationMin: input.durationMin,
          activities: [
            { ...first, minutes: minutes[0] },
            { ...second, minutes: minutes[1] },
            { ...third, minutes: minutes[2] },
            {
              name: "Water break + final soccer game",
              minutes: minutes[3],
              description:
                "Take a brief water break, then finish with a real soccer game. Keep normal direction, goals, restarts, and scoring while coaching only short cues tied to the session focus."
            }
          ]
        };
      })
    };
  }

  if (input.sessionMode !== "quick_activity" && input.sessionMode !== "drill") {
    return pack;
  }

  const durationMin = input.durationMin;
  const fallbackName = input.sessionMode === "quick_activity" ? "Quick activity" : "Main activity";

  return {
    ...pack,
    durationMin,
    sessions: pack.sessions.map((session) =>
      shapeLegacySessionToSingleActivity(session, durationMin, fallbackName)
    )
  };
}

function rewriteGoalRequiredText(value: string) {
  return value
    .replace(/\bpugg goals?\b/gi, "cone gates")
    .replace(/\bmini goals?\b/gi, "cone gates")
    .replace(/\bsmall goals?\b/gi, "cone gates")
    .replace(/\bgoals?\b/gi, "end zones")
    .replace(/\bshooting\b/gi, "finishing through gates")
    .replace(/\bshoot\b/gi, "finish through the gate")
    .replace(/\bshots?\b/gi, "finishes through gates");
}

function rewriteLegacyGoalTextForSelectedGoals(value: string, originalEquipment: string[] = []) {
  const hasPuggGoals = originalEquipment.some((item) => /pugg?\s+goals?/i.test(item));
  const hasMiniGoals = originalEquipment.some((item) => /mini\s+goals?/i.test(item));
  const hasSmallGoals = originalEquipment.some((item) => /small\s+goals?/i.test(item));
  const hasPortableGoals = originalEquipment.some((item) => /portable\s+goals?/i.test(item));
  const replacement = hasPuggGoals
    ? "Pugg goals"
    : hasMiniGoals
      ? "mini goals"
      : hasSmallGoals
        ? "small goals"
        : hasPortableGoals
          ? "portable goals"
          : "goals";

  if (replacement === "goals") {
    return value;
  }

  return value
    .replace(/\bfull-size goals?\b/gi, replacement)
    .replace(/\bfull size goals?\b/gi, replacement)
    .replace(/\bgoals?\b/gi, replacement);
}

function rewriteGoalRequiredOutput(pack: SessionPack, originalEquipment: string[] = []) {
  return {
    ...pack,
    equipment: originalEquipment,
    sessions: pack.sessions.map((session) => ({
      ...session,
      equipment: originalEquipment,
      activities: session.activities.map((activity) => ({
        ...activity,
        name: rewriteGoalRequiredText(activity.name),
        ...(activity.description
          ? { description: rewriteGoalRequiredText(activity.description) }
          : {})
      }))
    }))
  };
}

function rewriteGoalCompatibleOutput(pack: SessionPack, originalEquipment: string[] = []) {
  return {
    ...pack,
    equipment: originalEquipment,
    sessions: pack.sessions.map((session) => ({
      ...session,
      equipment: originalEquipment,
      activities: session.activities.map((activity) => ({
        ...activity,
        name: rewriteLegacyGoalTextForSelectedGoals(activity.name, originalEquipment),
        ...(activity.description
          ? { description: rewriteLegacyGoalTextForSelectedGoals(activity.description, originalEquipment) }
          : {})
      }))
    }))
  };
}

async function getAccessToken() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    redirect("/login");
  }

  return accessToken;
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const accessToken = await getAccessToken();
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    redirect("/logout");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new SessionBuilderApiError("Expected JSON response", response.status);
  }

  const body = (await response.json()) as T;

  if (!response.ok) {
    let errorMessage = `Session Builder API request failed (${response.status})`;
    let errorDetails: unknown = body;

    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      errorMessage = (body as { error: string }).error;
    } else if (
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof (body as { message?: unknown }).message === "string"
    ) {
      errorMessage = (body as { message: string }).message;
    }

    throw new SessionBuilderApiError(errorMessage, response.status, errorDetails);
  }

  return body;
}

export async function getSessions(nextToken?: string) {
  const params = new URLSearchParams();
  if (nextToken) {
    params.set("nextToken", nextToken);
  }

  const path = params.size > 0 ? `/sessions?${params.toString()}` : "/sessions";
  return requestJson<{
    items: SessionListItem[];
    nextToken?: string;
  }>(path);
}

export async function getSession(sessionId: string) {
  const result = await requestJson<{
    session: SessionDetail;
  }>(`/sessions/${encodeURIComponent(sessionId)}`);

  return result.session;
}

export async function generateSessionPack(input: GenerateSessionPackInput) {
  const originalEquipment = input.equipment || [];
  const intendedInput = sanitizeGenerateSessionPackInput(input);

  if (process.env.NODE_ENV !== "production") {
    console.info("Session Builder generation request", buildSafeDebugObject(intendedInput));
  }

  let currentInput = intendedInput;
  let useLegacyShape = false;
  let usedCompatibilityRetry = false;
  let addedCompatibilityGoals = false;
  let addedLegacyGoalToken = false;
  let retriedUnknownFields = false;
  let retriedAgeBand = false;
  let retriedMissingGoals = false;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const result = await requestJson<{
        pack: SessionPack;
      }>("/session-packs", {
        method: "POST",
        body: JSON.stringify(toApiPayload(currentInput)),
      });
      let pack = result.pack;

      if (usedCompatibilityRetry) {
        // Temporary compatibility bridge until deployed /session-packs accepts
        // sessionMode behavior: legacy drill-style responses can return the old
        // activity structure, but Quick Activity and Session Builder Drill now
        // expect one activity while Full Session expects four.
        pack = shapeLegacyPackForRequestedMode(pack, intendedInput);
      }

      if (addedCompatibilityGoals && !hasGoalEquipment(originalEquipment)) {
        pack = rewriteGoalRequiredOutput(pack, originalEquipment);
      }

      if (addedLegacyGoalToken && hasGoalEquipment(originalEquipment)) {
        pack = rewriteGoalCompatibleOutput(pack, originalEquipment);
      }

      return pack;
    } catch (error) {
      if (!(error instanceof SessionBuilderApiError) || error.status !== 400) {
        throw error;
      }

      if (
        !retriedUnknownFields &&
        hasLegacyCompatibilityFields(currentInput) &&
        hasLegacyCompatibilityUnknownFields(error.details)
      ) {
        // Temporary compatibility bridge: deployed /session-packs may not yet
        // accept sessionMode or coachNotes, so retry once with the legacy shape.
        currentInput = toLegacyGenerateSessionPackInput(currentInput);
        useLegacyShape = true;
        usedCompatibilityRetry = true;
        retriedUnknownFields = true;
        continue;
      }

      if (!retriedAgeBand && hasValidationReason(error.details, "unsupported_age_band")) {
        currentInput = {
          ...(useLegacyShape ? toLegacyGenerateSessionPackInput(currentInput) : currentInput),
          ageBand: resolveSafeAgeBand(currentInput)
        };
        usedCompatibilityRetry = true;
        retriedAgeBand = true;
        continue;
      }

      if (!retriedMissingGoals && isMissingGoalsError(error.details)) {
        const hasOriginalGoalEquipment = hasGoalEquipment(originalEquipment);
        currentInput = {
          ...(useLegacyShape ? toLegacyGenerateSessionPackInput(currentInput) : currentInput),
          // Temporary hosted API bridge: older /session-packs validates
          // finishing/goal wording against equipment before the generator can
          // adapt. If the coach selected Pugg/mini/small/portable goals, add a
          // legacy "goals" token for transport only, then restore the selected
          // equipment and wording after the hosted response returns.
          ...(hasOriginalGoalEquipment
            ? { equipment: buildLegacyGoalCompatibleEquipment(currentInput.equipment || []) }
            : { equipment: undefined })
        };
        usedCompatibilityRetry = true;
        addedCompatibilityGoals = !hasOriginalGoalEquipment;
        addedLegacyGoalToken = hasOriginalGoalEquipment && !hasLegacyGoalsEquipment(originalEquipment);
        retriedMissingGoals = true;
        continue;
      }

      throw error;
    }
  }

  throw new SessionBuilderApiError(
    "The session could not be generated because the selected team or equipment is not compatible yet. Try choosing a specific age band or adjusting the equipment selection.",
    400
  );
}

export async function analyzeSessionImage(input: AnalyzeSessionImageInput) {
  const result = await requestJson<{
    analysis: ImageAnalysisResult;
  }>("/session-packs", {
    method: "POST",
    body: JSON.stringify({
      requestType: "image-analysis",
      mode: input.mode,
      sourceImage: input.sourceImage,
    }),
  });

  return result.analysis;
}

export async function createSession(session: GeneratedSession) {
  const result = await requestJson<{
    session: SessionDetail;
  }>("/sessions", {
    method: "POST",
    body: JSON.stringify(session),
  });

  return result.session;
}

export async function getSessionPdf(sessionId: string) {
  return requestJson<SessionPdfResult>(
    `/sessions/${encodeURIComponent(sessionId)}/pdf`
  );
}

export async function submitSessionFeedback(
  sessionId: string,
  input: SubmitSessionFeedbackInput
) {
  const result = await requestJson<{
    feedback: SessionFeedback;
  }>(`/sessions/${encodeURIComponent(sessionId)}/feedback`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return result.feedback;
}
