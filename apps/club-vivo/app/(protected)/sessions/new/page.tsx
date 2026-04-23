import { Buffer } from "node:buffer";
import { cookies } from "next/headers";
import Link from "next/link";

import { CoachPageHeader } from "../../../../components/coach/CoachPageHeader";
import {
  NewSessionFlow,
  type AnalyzeFormState,
  type GenerateFormState,
  type SaveFormState
} from "./session-new-flow";
import {
  analyzeSessionImage,
  type ConfirmedImageAnalysisProfile,
  type ImageAnalysisMode,
  type SessionBuilderApiError
} from "../../../../lib/session-builder-api";
import { COACH_TEAM_HINTS_COOKIE, getCoachTeams } from "../../../../lib/coach-team-hints";
import {
  EQUIPMENT_HINTS_COOKIE,
  getEquipmentItems,
  serializeEquipmentHints
} from "../../../../lib/equipment-hints";
import {
  generateSessionPackForWorkspace,
  getActiveSelectedTeamForWorkspace,
  getSessionBuilderMethodologyDisplay
} from "../../../../lib/session-builder-server";
import { formatEnvironmentLabel } from "../../../../lib/session-builder-context-hints";
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
    environment: "grass_field",
    theme: "",
    equipment: ""
  }
};

const INITIAL_SAVE_STATE: SaveFormState = {};

function formatSelectedTeamDetails({
  ageBand,
  level,
  status
}: {
  ageBand?: string;
  level?: string;
  status?: string;
}) {
  return [ageBand, level, status].filter(Boolean).join(" - ");
}

function parseEquipment(rawValue: string) {
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildGenerationTheme({
  objective,
  teamName,
  environment,
  constraints
}: {
  objective: string;
  teamName: string;
  environment: string;
  constraints: string;
}) {
  const normalizedObjective = objective.trim();
  const normalizedTeamName = teamName.trim();
  const normalizedConstraints = constraints.trim();

  const parts = [
    `Primary session objective: ${normalizedObjective}.`,
    normalizedTeamName ? `Team context: ${normalizedTeamName}.` : "",
    environment ? `Environment context: ${formatEnvironmentLabel(environment)}.` : "",
    normalizedConstraints
      ? `Coach brainstorming and extra details for today: ${normalizedConstraints}. Use these notes directly when shaping the session activities.`
      : ""
  ].filter(Boolean);

  return parts.join(" ");
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
  const teamName = String(formData.get("teamName") || "").trim();
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

    const pack = await generateSessionPackForWorkspace({
      sport,
      ...(sportPackId ? { sportPackId } : {}),
      ageBand,
      durationMin: durationValue,
      theme: buildGenerationTheme({
        objective: theme,
        teamName,
        environment,
        constraints
      }),
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

function formatMethodologyScopes(scopes: string[]) {
  return scopes.map((scope) => scope.toUpperCase()).join(", ");
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
  const activeSelectedTeam = await getActiveSelectedTeamForWorkspace();
  const methodologyDisplay = await getSessionBuilderMethodologyDisplay();
  const cookieStore = await cookies();
  const coachTeams = getCoachTeams(cookieStore.get(COACH_TEAM_HINTS_COOKIE)?.value);
  const initialEquipmentOptions = getEquipmentItems(cookieStore.get(EQUIPMENT_HINTS_COOKIE)?.value);
  const teamOptions: WorkspaceTeamOption[] = coachTeams.map((team) => ({
    id: team.id,
    label: team.teamName,
    sport: "soccer",
    ageBand: team.ageBand,
    programType: team.teamType,
    defaultDurationMin: team.teamType === "travel" ? 60 : 45
  }));

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

  async function saveEquipmentOptionsAction(items: string[]) {
    "use server";

    const serializedItems = serializeEquipmentHints(items);
    const nextItems = getEquipmentItems(serializedItems);

    const responseCookieStore = await cookies();
    responseCookieStore.set(EQUIPMENT_HINTS_COOKIE, serializedItems, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax"
    });

    return {
      items: nextItems,
      message: "Equipment saved in this browser."
    };
  }

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Session Builder"
        title="Build your session"
        description="Use the detailed setup flow here when you want more control than Home Quick session."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Active Team Context
            </p>
            {activeSelectedTeam ? (
              <>
                <h2 className="text-lg font-semibold text-slate-900">{activeSelectedTeam.name}</h2>
                <p className="text-sm text-slate-600">
                  {formatSelectedTeamDetails({
                    ageBand: activeSelectedTeam.ageBand,
                    level: activeSelectedTeam.level,
                    status: activeSelectedTeam.status
                  })}
                </p>
                <p className="text-sm text-slate-600">
                  This selected backend team is available as server-owned context for Session
                  Builder.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-slate-900">No team selected</h2>
                <p className="text-sm text-slate-600">
                  Session Builder can still continue without a selected team.
                </p>
              </>
            )}
          </div>

          <Link
            href="/teams"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            {activeSelectedTeam ? "Change team" : "Select a team"}
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Methodology Context
          </p>
          {methodologyDisplay.methodologyApplied ? (
            <>
              <h2 className="text-lg font-semibold text-slate-900">Methodology is in use</h2>
              <p className="text-sm text-slate-600">
                Applied scopes: {formatMethodologyScopes(methodologyDisplay.appliedScopes)}.
              </p>
              {methodologyDisplay.activeSelectedTeam ? (
                <p className="text-sm text-slate-600">
                  Active selected team: {methodologyDisplay.activeSelectedTeam.name}.
                </p>
              ) : null}
              {methodologyDisplay.resolvedProgramDirection ? (
                <p className="text-sm text-slate-600">
                  Resolved program direction: {methodologyDisplay.resolvedProgramDirection.toUpperCase()}.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900">
                No methodology currently applied
              </h2>
              <p className="text-sm text-slate-600">
                Session Builder is using the standard generation path.
              </p>
            </>
          )}
        </div>
      </section>

      <NewSessionFlow
        initialAnalyzeState={INITIAL_ANALYZE_STATE}
        initialGenerateState={initialGenerateState}
        initialSaveState={INITIAL_SAVE_STATE}
        teamOptions={teamOptions}
        initialEquipmentOptions={initialEquipmentOptions}
        initialConstraints={initialConstraints}
        analyzeAction={analyzeSessionImageAction}
        generateAction={generateSessionPackAction}
        saveAction={saveGeneratedSessionAction}
        saveEquipmentOptionsAction={saveEquipmentOptionsAction}
      />
    </div>
  );
}
