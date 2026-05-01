import "server-only";

import { Buffer } from "node:buffer";
import { cookies } from "next/headers";

import {
  analyzeSessionImage,
  generateSessionPack,
  type ConfirmedImageAnalysisProfile,
  type ImageAnalysisMode,
  type SessionBuilderApiError
} from "../../../../lib/session-builder-api";
import { EQUIPMENT_HINTS_COOKIE, getEquipmentItems } from "../../../../lib/equipment-hints";
import { formatEnvironmentLabel } from "../../../../lib/session-builder-context-hints";
import type { AnalyzeFormState, GenerateFormState } from "./session-new-flow";

const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_GENERATION_THEME_LENGTH = 60;
const SUPPORTED_API_AGE_BANDS = new Set(["u6", "u8", "u10", "u12", "u14", "u16", "u18", "adult"]);

function parseEquipment(rawValue: string) {
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSupportedAgeBand(value: string) {
  const normalized = value
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
    return `u${numberWords[underWordMatch[1]]}`;
  }

  const match =
    normalized.match(/\bu\s*([0-9]{1,2})\b/) ||
    normalized.match(/\bunder\s*([0-9]{1,2})\b/) ||
    normalized.match(/\b([0-9]{1,2})\s*u\b/);
  const candidate = match?.[1] ? `u${Number.parseInt(match[1], 10)}` : normalized;

  return SUPPORTED_API_AGE_BANDS.has(candidate) ? candidate : "";
}

function parseAgeBandFromText(value: string) {
  return normalizeSupportedAgeBand(value);
}

function isMixedAge(value: string) {
  return value.replace(/[-\s]+/g, "_").trim().toLowerCase() === "mixed_age";
}

function normalizeProgramType(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "ost" || normalized === "travel" ? normalized : "";
}

function buildSafeAgeBand({
  teamAgeBand,
  formAgeBand,
  constraints,
  programType
}: {
  teamAgeBand: string;
  formAgeBand: string;
  constraints: string;
  programType: string;
}) {
  const normalizedTeamAgeBand = normalizeSupportedAgeBand(teamAgeBand);

  if (normalizedTeamAgeBand) {
    return normalizedTeamAgeBand;
  }

  const normalizedFormAgeBand = normalizeSupportedAgeBand(formAgeBand);

  if (normalizedFormAgeBand) {
    return normalizedFormAgeBand;
  }

  const notesAgeBand = parseAgeBandFromText(constraints);

  if (notesAgeBand) {
    return notesAgeBand;
  }

  if (isMixedAge(teamAgeBand) && programType === "ost") {
    return "u10";
  }

  return "u14";
}

function hasGoalEquipment(items: string[]) {
  return items.some((item) => {
    const normalized = item.toLowerCase().replace(/\s+/g, " ").trim();
    return (
      normalized.includes("goal") ||
      normalized.includes("pugg") ||
      normalized.includes("pug")
    );
  });
}

function avoidGoalRequiredThemeWithoutGoals(theme: string, equipment: string[]) {
  if (hasGoalEquipment(equipment)) {
    return theme;
  }

  return theme.replace(/\b(finishing|finish|shooting|shoot|goals?|scoring)\b/gi, "attacking gates");
}

function buildTeamContextNotes({
  teamName,
  teamAgeBand,
  safeAgeBand,
  programType,
  playerCount
}: {
  teamName: string;
  teamAgeBand: string;
  safeAgeBand: string;
  programType: string;
  playerCount: string;
}) {
  const notes = [];
  const parsedPlayerCount = Number.parseInt(playerCount, 10);

  if (teamName) notes.push(`team:${teamName}`);
  if (teamAgeBand) notes.push(`originalTeamAgeBand:${teamAgeBand}`);
  notes.push(`apiAgeBand:${safeAgeBand}`);

  if (isMixedAge(teamAgeBand)) {
    notes.push("mixedAge:true");
  }

  if (isMixedAge(teamAgeBand) && programType === "ost") {
    notes.push("assumedAgeRange:6-11");
    notes.push("coachingStyle:playful game-like simple inclusive high-engagement love-of-the-game");
  }

  if (programType === "travel") {
    notes.push("programType:Travel");
    notes.push("coachingStyle:soccer-specific technical tactical decision-making game-realistic");
  } else if (programType === "ost") {
    notes.push("programType:OST");
    notes.push("coachingStyle:playful beginner-friendly inclusive simple rules easy/harder variations");
  }

  if (Number.isInteger(parsedPlayerCount) && parsedPlayerCount > 0) {
    notes.push(`${parsedPlayerCount} players`);
  }

  return notes.join(" | ");
}

function clampPromptPart(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  return normalized.slice(0, maxLength).trim();
}

function buildGenerationTheme({
  objective,
  environment,
  constraints
}: {
  objective: string;
  environment: string;
  constraints: string;
}) {
  const objectivePart = clampPromptPart(objective, 52);
  const environmentPart =
    environment && environment !== "grass_field"
      ? clampPromptPart(formatEnvironmentLabel(environment).toLowerCase(), 14)
      : "";
  const remainingNotesLength = Math.max(
    0,
    MAX_GENERATION_THEME_LENGTH - objectivePart.length - (environmentPart ? environmentPart.length + 8 : 0) - 9
  );
  const notesPart = clampPromptPart(constraints, Math.min(48, remainingNotesLength));
  const parts = [
    objectivePart,
    notesPart ? `notes:${notesPart}` : "",
    environmentPart ? `env:${environmentPart}` : ""
  ].filter(Boolean);
  const compactTheme = parts.join(" | ");

  return clampPromptPart(compactTheme, MAX_GENERATION_THEME_LENGTH);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as SessionBuilderApiError).status === "number"
  ) {
    const apiError = error as SessionBuilderApiError;
    const detailObject =
      apiError.details && typeof apiError.details === "object"
        ? (apiError.details as Record<string, unknown>)
        : undefined;
    const nestedError =
      detailObject?.error && typeof detailObject.error === "object"
        ? (detailObject.error as Record<string, unknown>)
        : undefined;

    console.error("Session Builder generation failed", {
      status: apiError.status,
      message: apiError.message,
      code: detailObject?.code,
      detailsMessage: detailObject?.message,
      nestedErrorMessage: nestedError?.message,
      nestedErrorDetails: formatDevErrorDetails(nestedError?.details),
      details: formatDevErrorDetails(apiError.details)
    });

    const detailText = formatDevErrorDetails(apiError.details).toLowerCase();

    if (
      apiError.status === 400 &&
      (detailText.includes("unsupported_age_band") ||
        detailText.includes("incompatible_equipment"))
    ) {
      return "The session could not be generated because the selected team or equipment is not compatible yet. Try choosing a specific age band or adjusting the equipment selection.";
    }

    return apiError.message || fallback;
  }

  if (error instanceof Error && error.message) {
    console.error("Unhandled generation error", {
      message: error.message,
      error
    });

    return error.message;
  }

  console.error("Unknown generation error", { error });
  return fallback;
}

function formatDevErrorDetails(details: unknown) {
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

function parseConfirmedProfile(rawValue: string) {
  if (!rawValue) {
    return undefined;
  }

  return JSON.parse(rawValue) as ConfirmedImageAnalysisProfile;
}

export async function analyzeSessionImageAction(
  _previousState: AnalyzeFormState,
  formData: FormData
): Promise<AnalyzeFormState> {
  "use server";

  const mode = String(formData.get("mode") || "").trim() as ImageAnalysisMode;
  const sourceImage = formData.get("sourceImage");

  const values = { mode: mode || "environment_profile" };

  if (mode !== "environment_profile" && mode !== "setup_to_drill") {
    return {
      values,
      error: "Choose a supported image analysis mode before uploading."
    };
  }

  if (!(sourceImage instanceof File) || sourceImage.size < 1) {
    return {
      values,
      error: "Upload one image before running image analysis."
    };
  }

  if (!SUPPORTED_IMAGE_MIME_TYPES.has(sourceImage.type)) {
    return {
      values,
      error: "Use a JPG, PNG, or WebP image for image-assisted intake."
    };
  }

  try {
    const imageBuffer = Buffer.from(await sourceImage.arrayBuffer());
    const analysis = await analyzeSessionImage({
      mode,
      sourceImage: {
        filename: sourceImage.name,
        mimeType: sourceImage.type as "image/jpeg" | "image/png" | "image/webp",
        bytesBase64: imageBuffer.toString("base64")
      }
    });

    return {
      values,
      analysis
    };
  } catch (error) {
    return {
      values,
      error: getErrorMessage(
        error,
        "Image analysis failed. Try a different image or review the mode."
      )
    };
  }
}

export async function generateSessionPackAction(
  _previousState: GenerateFormState,
  formData: FormData
): Promise<GenerateFormState> {
  "use server";

  const selectedSport = String(formData.get("sport") || "").trim();
  const ageBand = String(formData.get("ageBand") || "").trim();
  const teamAgeBand = String(formData.get("teamAgeBand") || "").trim();
  const teamName = String(formData.get("teamName") || "").trim();
  const teamProgramType = normalizeProgramType(String(formData.get("teamProgramType") || ""));
  const teamPlayerCount = String(formData.get("teamPlayerCount") || "").trim();
  const durationMin = String(formData.get("durationMin") || "").trim();
  const environment = String(formData.get("environment") || "").trim();
  const theme = String(formData.get("theme") || "").trim();
  const constraints = String(formData.get("constraints") || "").trim();
  const sessionModeValue = String(formData.get("sessionMode") || "").trim();
  const equipment = String(formData.get("equipment") || "").trim();
  const selectedEquipmentItems = equipment ? parseEquipment(equipment) : [];
  const confirmedProfileJson = String(formData.get("confirmedProfileJson") || "").trim();
  const sessionMode = sessionModeValue === "drill" ? "drill" : "full_session";
  const cookieStore = await cookies();
  const availableEquipmentItems =
    selectedEquipmentItems.length > 0
      ? selectedEquipmentItems
      : getEquipmentItems(cookieStore.get(EQUIPMENT_HINTS_COOKIE)?.value);

  const sport = selectedSport === "fut-soccer" ? "soccer" : selectedSport;
  const sportPackId = selectedSport === "fut-soccer" ? "fut-soccer" : undefined;
  const safeAgeBand = buildSafeAgeBand({
    teamAgeBand,
    formAgeBand: ageBand,
    constraints,
    programType: teamProgramType
  });
  const teamContextNotes = buildTeamContextNotes({
    teamName,
    teamAgeBand,
    safeAgeBand,
    programType: teamProgramType,
    playerCount: teamPlayerCount
  });
  const coachNotes = [constraints, teamContextNotes].filter(Boolean).join(" | ");

  const values = {
    sport: selectedSport,
    ageBand: safeAgeBand,
    durationMin,
    environment,
    theme,
    equipment
  };

  if (!sport || !safeAgeBand || !durationMin || !theme) {
    return {
      values,
      error: "Complete the required fields before generating a session pack."
    };
  }

  const durationValue = Number.parseInt(durationMin, 10);
  if (!Number.isInteger(durationValue)) {
    return {
      values,
      error: "Duration must be a whole number of minutes."
    };
  }

  try {
    const confirmedProfile = confirmedProfileJson
      ? parseConfirmedProfile(confirmedProfileJson)
      : undefined;

    // TODO: Pass backend team and methodology context after deployed /session-packs accepts it.
    const pack = await generateSessionPack({
      sport,
      ...(sportPackId ? { sportPackId } : {}),
      ageBand: safeAgeBand,
      durationMin: durationValue,
      theme: buildGenerationTheme({
        objective: avoidGoalRequiredThemeWithoutGoals(theme, availableEquipmentItems),
        environment,
        constraints
      }),
      sessionMode,
      ...(coachNotes ? { coachNotes } : {}),
      sessionsCount: 1,
      ...(availableEquipmentItems.length ? { equipment: availableEquipmentItems } : {}),
      ...(confirmedProfile ? { confirmedProfile } : {}),
      ...(teamName ? { teamName } : {}),
      ...(teamAgeBand ? { teamAgeBand } : {}),
      ...(teamProgramType ? { programType: teamProgramType } : {})
    });

    return {
      values,
      pack
    };
  } catch (error) {
    return {
      values,
      error: getErrorMessage(
        error,
        "The session could not be generated because the selected team or equipment is not compatible yet. Try choosing a specific age band or adjusting the equipment selection."
      )
    };
  }
}
