import "server-only";

import { Buffer } from "node:buffer";

import {
  analyzeSessionImage,
  generateSessionPack,
  type ConfirmedImageAnalysisProfile,
  type ImageAnalysisMode,
  type SessionBuilderApiError
} from "../../../../lib/session-builder-api";
import { formatEnvironmentLabel } from "../../../../lib/session-builder-context-hints";
import type { AnalyzeFormState, GenerateFormState } from "./session-new-flow";

const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_GENERATION_THEME_LENGTH = 60;

function parseEquipment(rawValue: string) {
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
  const objectivePart = clampPromptPart(objective, 32);
  const environmentPart =
    environment && environment !== "grass_field"
      ? clampPromptPart(formatEnvironmentLabel(environment).toLowerCase(), 14)
      : "";
  const notesPart = clampPromptPart(constraints, 26);
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
    console.error("SessionBuilderApiError", {
      status: apiError.status,
      message: apiError.message,
      details: apiError.details
    });

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
  const durationMin = String(formData.get("durationMin") || "").trim();
  const environment = String(formData.get("environment") || "").trim();
  const theme = String(formData.get("theme") || "").trim();
  const constraints = String(formData.get("constraints") || "").trim();
  const equipment = String(formData.get("equipment") || "").trim();
  const confirmedProfileJson = String(formData.get("confirmedProfileJson") || "").trim();

  const sport = selectedSport === "fut-soccer" ? "soccer" : selectedSport;
  const sportPackId = selectedSport === "fut-soccer" ? "fut-soccer" : undefined;

  const values = {
    sport: selectedSport,
    ageBand,
    durationMin,
    environment,
    theme,
    equipment
  };

  if (!sport || !ageBand || !durationMin || !theme) {
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
      ageBand,
      durationMin: durationValue,
      theme: buildGenerationTheme({
        objective: theme,
        environment,
        constraints
      }),
      sessionsCount: 1,
      ...(equipment ? { equipment: parseEquipment(equipment) } : {}),
      ...(confirmedProfile ? { confirmedProfile } : {})
    });

    return {
      values,
      pack
    };
  } catch (error) {
    return {
      values,
      error: getErrorMessage(error, "Generation failed. Check the form values and try again.")
    };
  }
}
