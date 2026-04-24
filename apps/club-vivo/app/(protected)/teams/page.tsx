import { redirect } from "next/navigation";

import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { getCurrentUser } from "../../../lib/get-current-user";
import { clearSelectedTeamId, readSelectedTeamId, setSelectedTeamId } from "../../../lib/selected-team";
import {
  createTeam,
  getTeam,
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
  const level = normalizeOptionalText(formData, "level");
  const notes = normalizeOptionalText(formData, "notes");
  const status = normalizeOptionalText(formData, "status");
  const programType = normalizeProgramType(formData);
  const playerCount = normalizePlayerCount(formData);

  return {
    name: normalizeRequiredText(formData, "name"),
    sport: normalizeRequiredText(formData, "sport"),
    ageBand: normalizeRequiredText(formData, "ageBand"),
    ...(level ? { level } : {}),
    ...(notes ? { notes } : {}),
    ...(status ? { status } : {}),
    ...(programType ? { programType } : {}),
    ...(playerCount !== undefined ? { playerCount } : {}),
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

function formatSportLabel(value: string) {
  return value === "soccer" ? "Soccer" : value;
}

function formatStatusLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

function renderSelectionMeta(selectedTeam: TeamRecord) {
  const chips = [
    formatSportLabel(selectedTeam.sport),
    selectedTeam.ageBand,
    formatStatusLabel(selectedTeam.status),
    ...(selectedTeam.programType ? [formatProgramTypeLabel(selectedTeam.programType)] : []),
    ...(selectedTeam.playerCount !== undefined ? [`${selectedTeam.playerCount} players`] : []),
  ];

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

function TeamMetadata({ team }: { team: TeamRecord }) {
  return (
    <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Program type</dt>
        <dd className="mt-1 text-sm text-slate-700">{formatProgramTypeLabel(team.programType)}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Player count</dt>
        <dd className="mt-1 text-sm text-slate-700">{formatPlayerCountLabel(team.playerCount)}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Level</dt>
        <dd className="mt-1 text-sm text-slate-700">{team.level || "Not set"}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
        <dd className="mt-1 text-sm text-slate-700">{formatStatusLabel(team.status)}</dd>
      </div>
    </dl>
  );
}

function TeamFormFields({
  team,
  submitLabel,
}: {
  team?: Partial<TeamRecord>;
  submitLabel: string;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
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
          Sport
          <input
            name="sport"
            type="text"
            required
            defaultValue={team?.sport || "soccer"}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Age band
          <input
            name="ageBand"
            type="text"
            required
            defaultValue={team?.ageBand || ""}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Program type
          <select
            name="programType"
            defaultValue={team?.programType || ""}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600"
          >
            <option value="">Not set</option>
            <option value="travel">Travel</option>
            <option value="ost">OST</option>
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

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Status
          <select
            name="status"
            defaultValue={team?.status || "active"}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Level
          <input
            name="level"
            type="text"
            defaultValue={team?.level || ""}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Notes
          <textarea
            name="notes"
            rows={4}
            defaultValue={team?.notes || ""}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          {submitLabel}
        </button>
        <p className="text-xs leading-5 text-slate-500">
          <code>durationMin</code> stays out of Team and is not editable here.
        </p>
      </div>
    </div>
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
  const selectedTeamId = await readSelectedTeamId(currentUser.tenantId);
  const selectedTeam =
    selectedTeamId !== null ? teams.find((team) => team.teamId === selectedTeamId) || null : null;
  const isAdmin = currentUser.role === "admin";

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const teamStatus = parseSearchParam(resolvedSearchParams?.teamStatus);
  const teamError = parseSearchParam(resolvedSearchParams?.teamError);
  const teamMode = parseSearchParam(resolvedSearchParams?.teamMode);
  const teamIdFromSearch = parseSearchParam(resolvedSearchParams?.teamId);

  async function selectTeamAction(formData: FormData) {
    "use server";

    const requestedTeamId = String(formData.get("teamId") || "").trim();
    if (!requestedTeamId) {
      await clearSelectedTeamId();
      redirect("/teams");
    }

    const nextUser = await getCurrentUser();

    try {
      const validatedTeam = await getTeam(requestedTeamId);
      await setSelectedTeamId({
        teamId: validatedTeam.teamId,
        tenantId: nextUser.tenantId
      });
    } catch (error) {
      if (error instanceof TeamApiError && error.status === 404) {
        await clearSelectedTeamId();
        redirect("/teams");
      }

      throw error;
    }

    redirect("/teams");
  }

  async function clearSelectedTeamAction() {
    "use server";

    await clearSelectedTeamId();
    redirect("/teams");
  }

  async function createTeamAction(formData: FormData) {
    "use server";

    try {
      await createTeam(normalizeTeamInput(formData));
      redirect(buildRedirectPath({ teamStatus: "created" }));
    } catch (error) {
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
      redirect(
        buildRedirectPath({
          teamStatus: "updated",
          teamId
        })
      );
    } catch (error) {
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
  }

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Teams"
        title="Teams"
        description="Teams are durable backend context for Session Builder and generation hints. Travel vs OST program type changes the planning bias, and age band plus player count help the planner stay grounded while today’s request still owns session details."
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

      <section
        id="create-team"
        className="club-vivo-shell rounded-[2rem] border p-6 backdrop-blur scroll-mt-24"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Team Manager
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Create and manage durable teams here
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Coaches create and manage their own teams on this page for the shared coach
              workspace. Teams can carry a name, sport, age band, travel or OST program type,
              player count, and the current level, notes, and status fields.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isAdmin
                ? "As an admin, you can also see and edit every tenant team returned by the backend."
                : "You will only see and edit the teams you created here."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:max-w-sm">
            {[
              "Team name",
              "Sport",
              "Age band",
              "Program type",
              "Player count",
              "Level",
              "Notes",
              "Status"
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Create a team</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add durable team context for your planning flow. Program type and player count stay
            optional so older teams remain valid, and <code>durationMin</code> still stays out of
            Team.
          </p>

          <form action={createTeamAction} className="mt-6">
            <TeamFormFields submitLabel="Create team" />
          </form>
        </div>
      </section>

      <section className="club-vivo-shell rounded-[2rem] border p-6 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Current selection</h2>
            {selectedTeam ? (
              <div className="mt-3">
                <p className="text-base font-medium text-slate-900">{selectedTeam.name}</p>
                {renderSelectionMeta(selectedTeam)}
              </div>
            ) : (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                No validated team is currently selected. Session Builder will continue without a
                team context until you choose one here.
              </p>
            )}
          </div>

          {selectedTeam ? (
            <form action={clearSelectedTeamAction}>
              <button
                type="submit"
                className="inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Clear selection
              </button>
            </form>
          ) : null}
        </div>
      </section>

      {teams.length === 0 ? (
        <section className="club-vivo-shell rounded-[2rem] border p-8 backdrop-blur">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8">
            <h2 className="text-lg font-semibold text-slate-900">No teams exist for your current view yet</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              This page only shows Team records returned by the backend for your current visibility.
              There is no fake demo team layer here, so this state means there are not any saved
              teams in view for you yet.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Teams matter because Session Builder and generation hints can use durable age band,
              player count, and travel vs OST program context when a team is selected.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#create-team"
                className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
              >
                Create your first team
              </a>
              <p className="text-sm text-slate-600">
                Use the create form above, then come back here to select the active team context.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const isSelected = team.teamId === selectedTeam?.teamId;
            const isEditingThisTeam = teamMode === "edit" && teamIdFromSearch === team.teamId;

            return (
              <article
                key={team.teamId}
                className="club-vivo-shell rounded-3xl border p-5 backdrop-blur"
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">{team.name}</h2>
                      {isSelected ? (
                        <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white">
                          Selected
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        {formatSportLabel(team.sport)}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        {team.ageBand}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        {formatStatusLabel(team.status)}
                      </span>
                    </div>

                    <TeamMetadata team={team} />

                    {team.notes ? (
                      <p className="mt-4 text-sm leading-6 text-slate-600">{team.notes}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <form action={selectTeamAction}>
                      <input type="hidden" name="teamId" value={team.teamId} />
                      <button
                        type="submit"
                        className={
                          isSelected
                            ? "inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            : "inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
                        }
                      >
                        {isSelected ? "Keep selected" : "Select team"}
                      </button>
                    </form>
                  </div>

                  <details
                    open={isEditingThisTeam}
                    className="rounded-3xl border border-slate-200 bg-white/70 p-4"
                  >
                    <summary className="cursor-pointer list-none text-sm font-medium text-slate-700">
                      Edit team
                    </summary>
                    <form action={updateTeamAction} className="mt-4">
                      <input type="hidden" name="teamId" value={team.teamId} />
                      <TeamFormFields team={team} submitLabel="Save changes" />
                    </form>
                  </details>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
