import { Buffer } from "node:buffer";

import { CoachPageHeader } from "../../../../components/coach/CoachPageHeader";
import {
  NewSessionFlow,
  type AnalyzeFormState,
  type GenerateFormState,
  type SaveFormState
} from "./session-new-flow";
import {
  analyzeSessionImage,
  generateSessionPack,
  type ConfirmedImageAnalysisProfile,
  type ImageAnalysisMode,
  type SessionBuilderApiError
} from "../../../../lib/session-builder-api";
import { saveGeneratedSessionAction } from "../session-actions";

type WorkspaceTeamOption = {
  id: string;
  label: string;
  sport: "soccer" | "fut-soccer";
  ageBand: string;
  programType?: "travel" | "ost";
  methodologyLabel?: string;
  defaultDurationMin?: number;
};

const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const INITIAL_ANALYZE_STATE: AnalyzeFormState = {
  values: {
    mode: "environment_profile"
  }
};

const INITIAL_GENERATE_STATE: GenerateFormState = {
  values: {
    sport: "soccer",
    ageBand: "u14",
    durationMin: "60",
    theme: "",
    equipment: ""
  }
};

const INITIAL_SAVE_STATE: SaveFormState = {};

const WORKSPACE_TEAM_OPTIONS: WorkspaceTeamOption[] = [
  {
    id: "team-ksc-travel-u14",
    label: "KSC Travel U14",
    sport: "soccer",
    ageBand: "u14",
    programType: "travel",
    methodologyLabel: "KSC Travel",
    defaultDurationMin: 60
  },
  {
    id: "team-ksc-travel-u12",
    label: "KSC Travel U12",
    sport: "soccer",
    ageBand: "u12",
    programType: "travel",
    methodologyLabel: "KSC Travel",
    defaultDurationMin: 60
  },
  {
    id: "team-ksc-ost-u10",
    label: "KSC OST U10",
    sport: "soccer",
    ageBand: "u10",
    programType: "ost",
    methodologyLabel: "OST / US Soccer",
    defaultDurationMin: 45
  }
];

function parseEquipment(rawValue: string) {
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
  const theme = String(formData.get("theme") || "").trim();
  const equipment = String(formData.get("equipment") || "").trim();
  const confirmedProfileJson = String(formData.get("confirmedProfileJson") || "").trim();

  const sport = selectedSport === "fut-soccer" ? "soccer" : selectedSport;
  const sportPackId = selectedSport === "fut-soccer" ? "fut-soccer" : undefined;

  const values = {
    sport: selectedSport,
    ageBand,
    durationMin,
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

    const pack = await generateSessionPack({
      sport,
      ...(sportPackId ? { sportPackId } : {}),
      ageBand,
      durationMin: durationValue,
      theme,
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

function parseSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewSessionPage({
  searchParams
}: {
  searchParams?: Promise<{
    notes?: string | string[];
    theme?: string | string[];
    durationMin?: string | string[];
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedTheme = parseSearchParam(resolvedSearchParams?.theme)?.trim() || "";
  const requestedDurationMin = parseSearchParam(resolvedSearchParams?.durationMin)?.trim() || "";
  const requestedNotes = parseSearchParam(resolvedSearchParams?.notes)?.trim() || "";
  const initialConstraints = requestedNotes || undefined;

  const initialGenerateState: GenerateFormState = {
    values: {
      ...INITIAL_GENERATE_STATE.values,
      theme: requestedTheme || INITIAL_GENERATE_STATE.values.theme,
      durationMin:
        requestedDurationMin && Number.isInteger(Number.parseInt(requestedDurationMin, 10))
          ? requestedDurationMin
          : INITIAL_GENERATE_STATE.values.durationMin
    }
  };

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Session Builder"
        title="Session Builder"
        description="Use the detailed setup flow here when you want more control than Home Quick session."
      />

      <NewSessionFlow
        initialAnalyzeState={INITIAL_ANALYZE_STATE}
        initialGenerateState={initialGenerateState}
        initialSaveState={INITIAL_SAVE_STATE}
        teamOptions={WORKSPACE_TEAM_OPTIONS}
        initialConstraints={initialConstraints}
        analyzeAction={analyzeSessionImageAction}
        generateAction={generateSessionPackAction}
        saveAction={saveGeneratedSessionAction}
      />
    </div>
  );
}
