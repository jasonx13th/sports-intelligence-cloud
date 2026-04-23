import { redirect } from "next/navigation";

import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { getCurrentUser } from "../../../lib/get-current-user";
import { clearSelectedTeamId, readSelectedTeamId, setSelectedTeamId } from "../../../lib/selected-team";
import { getTeam, listTeams, TeamApiError } from "../../../lib/team-api";

export default async function TeamsPage() {
  const currentUser = await getCurrentUser();
  const teams = await listTeams();
  const selectedTeamId = await readSelectedTeamId(currentUser.tenantId);
  const selectedTeam =
    selectedTeamId !== null ? teams.find((team) => team.teamId === selectedTeamId) || null : null;

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

  function formatSportLabel(value: string) {
    return value === "soccer" ? "Soccer" : value;
  }

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Teams"
        title="Select your team"
        description="Choose one durable backend team to keep as the current server-owned team context for this workspace. This selection is validated in tenant scope before it is stored."
      />

      <section className="club-vivo-shell rounded-[2rem] border p-6 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Current selection</h2>
            {selectedTeam ? (
              <div className="mt-3">
                <p className="text-base font-medium text-slate-900">{selectedTeam.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {formatSportLabel(selectedTeam.sport)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {selectedTeam.ageBand}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {selectedTeam.status}
                  </span>
                </div>
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
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">No durable backend teams yet</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Team selection stays tied to tenant-scoped backend teams only. Once teams exist in
              the Team API, you will be able to select one here.
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const isSelected = team.teamId === selectedTeam?.teamId;

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
                        {team.status}
                      </span>
                    </div>

                    {team.level ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">Level: {team.level}</p>
                    ) : null}

                    {team.notes ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{team.notes}</p>
                    ) : null}
                  </div>

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
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
