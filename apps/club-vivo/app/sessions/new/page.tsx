import Link from "next/link";
import { redirect } from "next/navigation";

import {
  analyzeSessionImage,
  type ConfirmedImageAnalysisProfile,
  type ImageAnalysisMode,
  SessionBuilderApiError,
  createSession,
  generateSessionPack,
  type GeneratedSession,
} from "../../../lib/session-builder-api";
import {
  NewSessionFlow,
  type AnalyzeFormState,
  type GenerateFormState,
  type SaveFormState
} from "./session-new-flow";

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

function parseEquipment(rawValue: string) {
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof SessionBuilderApiError) {
    if (error.status === 400) {
      return fallback;
    }

    return `Request failed with status ${error.status}.`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function parseConfirmedProfile(rawValue: string) {
  if (!rawValue) {
    return undefined;
  }

  const parsed = JSON.parse(rawValue) as ConfirmedImageAnalysisProfile;
  return parsed;
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
      error: "Use a JPG, PNG, or WebP image for Week 18 intake."
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
      error: getErrorMessage(error, "Image analysis failed. Try a different image or review the mode.")
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
    const confirmedProfile = confirmedProfileJson ? parseConfirmedProfile(confirmedProfileJson) : undefined;
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

export async function saveGeneratedSessionAction(
  _previousState: SaveFormState,
  formData: FormData
): Promise<SaveFormState> {
  "use server";

  const rawCandidate = String(formData.get("candidate") || "");

  if (!rawCandidate) {
    return {
      error: "Select a generated session before saving."
    };
  }

  let candidate: GeneratedSession;

  try {
    candidate = JSON.parse(rawCandidate) as GeneratedSession;
  } catch {
    return {
      error: "Generated session data was invalid. Generate again and retry."
    };
  }

  try {
    const session = await createSession(candidate);
    redirect(`/sessions/${session.sessionId}`);
  } catch (error) {
    return {
      error: getErrorMessage(error, "Saving failed. Generate again and retry.")
    };
  }
}

export default function NewSessionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-6xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
              New Session
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Generate a session pack
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              Generate candidate sessions first, then save one candidate as a session.
            </p>
          </div>

          <Link
            href="/sessions"
            className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Back to sessions
          </Link>
        </div>

        <NewSessionFlow
          initialAnalyzeState={INITIAL_ANALYZE_STATE}
          initialGenerateState={INITIAL_GENERATE_STATE}
          initialSaveState={INITIAL_SAVE_STATE}
          analyzeAction={analyzeSessionImageAction}
          generateAction={generateSessionPackAction}
          saveAction={saveGeneratedSessionAction}
        />
      </section>
    </main>
  );
}
