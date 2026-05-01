import { cookies } from "next/headers";

import { CoachPageHeader } from "../../../../components/coach/CoachPageHeader";
import {
  NewSessionFlow,
  type AnalyzeFormState,
  type GenerateFormState,
  type SaveFormState
} from "./session-new-flow";
import {
  analyzeSessionImageAction,
  generateSessionPackAction
} from "./session-new-actions";
import { COACH_TEAM_HINTS_COOKIE, getCoachTeams } from "../../../../lib/coach-team-hints";
import {
  EQUIPMENT_HINTS_COOKIE,
  getEquipmentItems,
  serializeEquipmentHints
} from "../../../../lib/equipment-hints";
import { listTeams, type TeamRecord } from "../../../../lib/team-api";
import { saveGeneratedSessionAction } from "../session-actions";
import { type WorkspaceTeamOption } from "../../../../components/coach/TeamSelector";

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

function parseSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isNextRedirectError(error: unknown): error is { digest: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function getDefaultDurationMin(programType?: "travel" | "ost") {
  return programType === "ost" ? 45 : 60;
}

function mapBackendTeamToOption(team: TeamRecord): WorkspaceTeamOption {
  return {
    id: team.teamId,
    label: team.name,
    sport: team.sport,
    ageBand: team.ageBand,
    programType: team.programType,
    playerCount: team.playerCount,
    defaultDurationMin: getDefaultDurationMin(team.programType)
  };
}

function getFallbackTeamOptions(rawCookieValue: string | undefined): WorkspaceTeamOption[] {
  return getCoachTeams(rawCookieValue).map((team) => ({
    id: team.id,
    label: team.teamName,
    sport: "soccer",
    ageBand: team.ageBand,
    programType: team.teamType,
    playerCount: team.playerCount,
    defaultDurationMin: getDefaultDurationMin(team.teamType)
  }));
}

async function getTeamOptions(rawCookieValue: string | undefined) {
  try {
    const backendTeams = await listTeams();

    if (backendTeams.length > 0) {
      return backendTeams.map(mapBackendTeamToOption);
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
  }

  return getFallbackTeamOptions(rawCookieValue);
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
  const cookieStore = await cookies();
  const teamOptions = await getTeamOptions(cookieStore.get(COACH_TEAM_HINTS_COOKIE)?.value);
  const initialEquipmentOptions = getEquipmentItems(cookieStore.get(EQUIPMENT_HINTS_COOKIE)?.value);

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
        description="Specify the team and build mode you want to work with, then set up your session."
      />

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
