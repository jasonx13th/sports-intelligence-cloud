"use client";

import { useEffect, useState, useTransition } from "react";

import {
  COACH_TEAM_AGE_BAND_OPTIONS,
  formatCoachTeamAgeBand,
  type CoachTeamSetup,
  type CoachTeamType
} from "../../lib/coach-team-hints";

type SaveTeamsResult = {
  teams: CoachTeamSetup[];
  error?: string;
  message?: string;
};

type SaveTeamsAction = (teams: CoachTeamSetup[]) => Promise<SaveTeamsResult>;

type TeamDraft = {
  id?: string;
  teamName: string;
  ageBand: string;
  teamType: CoachTeamType;
  playerCount: string;
};

function createEmptyDraft(): TeamDraft {
  return {
    teamName: "",
    ageBand: "u14",
    teamType: "travel",
    playerCount: "16"
  };
}

function buildDraftFromTeam(team: CoachTeamSetup): TeamDraft {
  return {
    id: team.id,
    teamName: team.teamName,
    ageBand: COACH_TEAM_AGE_BAND_OPTIONS.includes(team.ageBand as (typeof COACH_TEAM_AGE_BAND_OPTIONS)[number])
      ? team.ageBand
      : "mixed_age",
    teamType: team.teamType,
    playerCount: String(team.playerCount)
  };
}

export function TeamsSetupManager({
  initialTeams,
  saveTeamsAction
}: {
  initialTeams: CoachTeamSetup[];
  saveTeamsAction: SaveTeamsAction;
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [draft, setDraft] = useState<TeamDraft>(createEmptyDraft());
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => setMessage(undefined), 2200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  function updateDraft<K extends keyof TeamDraft>(key: K, value: TeamDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleAddTeam() {
    setEditingTeamId("new");
    setDraft(createEmptyDraft());
    setError(undefined);
    setMessage(undefined);
  }

  function handleEditTeam(team: CoachTeamSetup) {
    setEditingTeamId(team.id);
    setDraft(buildDraftFromTeam(team));
    setError(undefined);
    setMessage(undefined);
  }

  function handleCancel() {
    setEditingTeamId(null);
    setDraft(createEmptyDraft());
    setError(undefined);
  }

  function submitDraft() {
    const normalizedName = draft.teamName.replace(/\s+/g, " ").trim();
    const normalizedAgeBand = draft.ageBand.trim().toLowerCase();
    const playerCount = Number.parseInt(draft.playerCount, 10);

    if (!normalizedName || !normalizedAgeBand || !Number.isInteger(playerCount) || playerCount < 1) {
      setError("Complete all team fields before saving.");
      return;
    }

    const nextTeam: CoachTeamSetup = {
      id:
        editingTeamId && editingTeamId !== "new"
          ? editingTeamId
          : `team-${Date.now().toString(36)}`,
      teamName: normalizedName,
      ageBand: normalizedAgeBand,
      teamType: draft.teamType,
      playerCount
    };

    const nextTeams =
      editingTeamId && editingTeamId !== "new"
        ? teams.map((team) => (team.id === editingTeamId ? nextTeam : team))
        : [...teams, nextTeam];

    startTransition(async () => {
      const result = await saveTeamsAction(nextTeams);

      if (result.error) {
        setError(result.error);
        return;
      }

      setTeams(result.teams);
      setEditingTeamId(null);
      setDraft(createEmptyDraft());
      setError(undefined);
      setMessage(result.message);
    });
  }

  const isEditing = editingTeamId !== null;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Teams in this slice save in this browser for now so you can shape the coach workspace
          without claiming durable backend persistence yet.
        </p>
        <button
          type="button"
          onClick={handleAddTeam}
          className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          Add team
        </button>
      </div>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {isEditing ? (
        <section className="club-vivo-shell rounded-3xl border p-5 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {editingTeamId === "new" ? "Add team" : "Edit team"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep the setup lightweight for now with the core team details coaches use most.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Team name</span>
              <input
                type="text"
                value={draft.teamName}
                onChange={(event) => updateDraft("teamName", event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                placeholder="KSC Travel U14"
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Age band</span>
              <select
                value={draft.ageBand}
                onChange={(event) => updateDraft("ageBand", event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              >
                {COACH_TEAM_AGE_BAND_OPTIONS.map((ageBand) => (
                  <option key={ageBand} value={ageBand}>
                    {formatCoachTeamAgeBand(ageBand)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Team type</span>
              <select
                value={draft.teamType}
                onChange={(event) => updateDraft("teamType", event.target.value as CoachTeamType)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              >
                <option value="travel">Travel</option>
                <option value="ost">OST</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Number of players</span>
              <input
                type="number"
                min={1}
                max={60}
                value={draft.playerCount}
                onChange={(event) => updateDraft("playerCount", event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submitDraft}
              disabled={isPending}
              className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : editingTeamId === "new" ? "Save team" : "Update team"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <article key={team.id} className="club-vivo-shell rounded-3xl border p-5 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{team.teamName}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {formatCoachTeamAgeBand(team.ageBand)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {team.teamType === "travel" ? "Travel" : "OST"}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {team.playerCount} players
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEditTeam(team)}
                className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Edit
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
