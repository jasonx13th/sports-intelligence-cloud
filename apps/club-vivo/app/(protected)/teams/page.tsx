import { redirect } from "next/navigation";

import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { getCurrentUser } from "../../../lib/get-current-user";
import {
  createTeam,
  listTeams,
  TeamApiError,
  updateTeam,
  type TeamMutationInput,
  type TeamProgramType,
  type TeamRecord
} from "../../../lib/team-api";

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

function normalizeRequiredText(formData: FormData, field: string) {
  return String(formData.get(field) || "").trim();
}

function normalizeOptionalText(formData: FormData, field: string) {
  const value = String(formData.get(field) || "").trim();
  return value ? value : undefined;
}

function normalizeProgramType(formData: FormData): TeamProgramType | undefined {
  const value = String(formData.get("programType") || "").trim().toLowerCase();
  if (!value) {
    return undefined;
  }

  if (value === "travel" || value === "ost") {
    return value;
  }

  throw new Error("Program type must be travel or ost.");
}

function normalizePlayerCount(formData: FormData) {
  const value = String(formData.get("playerCount") || "").trim();
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    throw new Error("Player count must be a whole number.");
  }

  if (parsed < 1 || parsed > 60) {
    throw new Error("Player count must be between 1 and 60.");
  }

  return parsed;
}

function normalizeTeamInput(formData: FormData): TeamMutationInput {
  const sport = normalizeRequiredText(formData, "sport");
  const level = normalizeOptionalText(formData, "level");
  const notes = normalizeOptionalText(formData, "notes");
  const status = normalizeOptionalText(formData, "status");
  const programType = normalizeProgramType(formData);
  const playerCount = normalizePlayerCount(formData);

  return {
    name: normalizeRequiredText(formData, "name"),
    sport,
    ageBand: normalizeRequiredText(formData, "ageBand"),
    ...(level ? { level } : {}),
    ...(notes ? { notes } : {}),
    ...(status ? { status } : {}),
    ...(programType ? { programType } : {}),
    ...(playerCount !== undefined ? { playerCount } : {})
  };
}

function buildRedirectPath(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `/teams?${query}` : "/teams";
}

function formatProgramTypeLabel(value?: TeamProgramType) {
  if (!value) {
    return "Not set";
  }

  return value === "travel" ? "Travel" : "OST";
}

function formatPlayerCountLabel(value?: number) {
  return value === undefined ? "Not set" : String(value);
}

const TEAM_AGE_BAND_OPTIONS = [
  "U5",
  "U6",
  "U7",
  "U8",
  "U9",
  "U10",
  "U11",
  "U12",
  "U13",
  "U14",
  "U15",
  "U16",
  "U17",
  "U18",
  "U19",
  "U20",
  "U21",
  "U22",
  "U23",
  "Adults",
  "Mixed age"
] as const;

function getAgeBandOptions(currentAgeBand?: string) {
  const normalizedCurrentAgeBand = String(currentAgeBand || "").trim().toLowerCase();
  const hasStandardMatch = TEAM_AGE_BAND_OPTIONS.some(
    (option) => option.toLowerCase() === normalizedCurrentAgeBand
  );

  if (!normalizedCurrentAgeBand || hasStandardMatch) {
    return TEAM_AGE_BAND_OPTIONS;
  }

  return [currentAgeBand!.trim(), ...TEAM_AGE_BAND_OPTIONS];
}

function TeamFormFields({
  team,
  submitLabel
}: {
  team?: Partial<TeamRecord>;
  submitLabel: string;
}) {
  const ageBandOptions = getAgeBandOptions(team?.ageBand);

  return (
    <div className="grid gap-4">
      <input name="sport" type="hidden" value={team?.sport || "soccer"} />
      <input name="status" type="hidden" value={team?.status || "active"} />
      <input name="level" type="hidden" value={team?.level || ""} />
      <input name="notes" type="hidden" value={team?.notes || ""} />

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Team name
        <input
          name="name"
          type="text"
          required
          defaultValue={team?.name || ""}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Age band
        <select
          name="ageBand"
          required
          defaultValue={team?.ageBand || ""}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600"
        >
          <option value="" disabled>
            Select age band
          </option>
          {ageBandOptions.map((ageBand) => (
            <option key={ageBand} value={ageBand}>
              {ageBand}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Program type
        <select
          name="programType"
          defaultValue={team?.programType || ""}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600"
        >
          <option value="">Not set</option>
          <option value="ost">OST</option>
          <option value="travel">Travel</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Player count
        <input
          name="playerCount"
          type="number"
          min={1}
          max={60}
          step={1}
          inputMode="numeric"
          defaultValue={team?.playerCount ?? ""}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600"
        />
      </label>

      <button
        type="submit"
        className="inline-flex justify-center rounded-full bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function TeamCard({
  team,
  isEditingThisTeam,
  updateAction
}: {
  team: TeamRecord;
  isEditingThisTeam: boolean;
  updateAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <article className="club-vivo-shell rounded-3xl border p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">{team.name}</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-800">Age band:</span> {team.ageBand}
            </p>
            <p>
              <span className="font-medium text-slate-800">Program type:</span>{" "}
              {formatProgramTypeLabel(team.programType)}
            </p>
            <p>
              <span className="font-medium text-slate-800">Player count:</span>{" "}
              {formatPlayerCountLabel(team.playerCount)}
            </p>
          </div>
        </div>

        <details open={isEditingThisTeam} className="shrink-0">
          <summary className="inline-flex cursor-pointer list-none rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
            Edit
          </summary>
          <div className="mt-4 w-full min-w-[16rem] rounded-3xl border border-slate-200 bg-white/80 p-4">
            <form action={updateAction} className="grid gap-4">
              <input type="hidden" name="teamId" value={team.teamId} />
              <TeamFormFields team={team} submitLabel="Save" />
            </form>
          </div>
        </details>
      </div>
    </article>
  );
}

export default async function TeamsPage({
  searchParams
}: {
  searchParams?: Promise<{
    teamStatus?: string | string[];
    teamError?: string | string[];
    teamMode?: string | string[];
    teamId?: string | string[];
  }>;
}) {
  const currentUser = await getCurrentUser();
  const teams = await listTeams();
  const isAdmin = currentUser.role === "admin";

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const teamStatus = parseSearchParam(resolvedSearchParams?.teamStatus);
  const teamError = parseSearchParam(resolvedSearchParams?.teamError);
  const teamMode = parseSearchParam(resolvedSearchParams?.teamMode);
  const teamIdFromSearch = parseSearchParam(resolvedSearchParams?.teamId);

  async function createTeamAction(formData: FormData) {
    "use server";

    try {
      await createTeam(normalizeTeamInput(formData));
    } catch (error) {
      if (isNextRedirectError(error)) {
        throw error;
      }

      if (error instanceof TeamApiError) {
        redirect(
          buildRedirectPath({
            teamError: error.message,
            teamMode: "create"
          })
        );
      }

      if (error instanceof Error) {
        redirect(
          buildRedirectPath({
            teamError: error.message,
            teamMode: "create"
          })
        );
      }

      throw error;
    }

    redirect(buildRedirectPath({ teamStatus: "created" }));
  }

  async function updateTeamAction(formData: FormData) {
    "use server";

    const teamId = String(formData.get("teamId") || "").trim();
    if (!teamId) {
      redirect(
        buildRedirectPath({
          teamError: "A team id is required to save edits."
        })
      );
    }

    try {
      await updateTeam(teamId, normalizeTeamInput(formData));
    } catch (error) {
      if (isNextRedirectError(error)) {
        throw error;
      }

      if (error instanceof TeamApiError) {
        redirect(
          buildRedirectPath({
            teamError: error.message,
            teamMode: "edit",
            teamId
          })
        );
      }

      if (error instanceof Error) {
        redirect(
          buildRedirectPath({
            teamError: error.message,
            teamMode: "edit",
            teamId
          })
        );
      }

      throw error;
    }

    redirect(
      buildRedirectPath({
        teamStatus: "updated",
        teamId
      })
    );
  }

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Teams"
        title="Teams"
        description={
          isAdmin
            ? "Tenant teams appear on the left. Create a new team or open an existing one to edit the core coach context."
            : "Your teams appear on the left. Create a team quickly here, then come back any time to edit the core coach context."
        }
      />

      {teamStatus === "created" ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Team created successfully.
        </section>
      ) : null}

      {teamStatus === "updated" ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Team updated successfully.
        </section>
      ) : null}

      {teamError ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {teamError}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {isAdmin ? "Tenant teams" : "Your teams"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {isAdmin
                  ? "All tenant teams returned by the backend."
                  : "Only teams you created are shown here."}
              </p>
            </div>
          </div>

          {teams.length === 0 ? (
            <div className="club-vivo-shell rounded-3xl border p-6 text-sm text-slate-600 backdrop-blur">
              No teams yet. Create your first team on the right.
            </div>
          ) : (
            <div className="grid gap-4">
              {teams.map((team) => (
                <TeamCard
                  key={team.teamId}
                  team={team}
                  isEditingThisTeam={teamMode === "edit" && teamIdFromSearch === team.teamId}
                  updateAction={updateTeamAction}
                />
              ))}
            </div>
          )}
        </div>

        <aside id="create-team" className="md:col-span-1">
          <section className="club-vivo-shell rounded-3xl border p-5 backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-900">Create team</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add the core team context coaches use most: name, age band, program type, and player
              count.
            </p>

            <form action={createTeamAction} className="mt-5">
              <TeamFormFields submitLabel="Create team" />
            </form>
          </section>
        </aside>
      </section>
    </div>
  );
}
