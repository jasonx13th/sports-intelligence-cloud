import type { ReactNode } from "react";

import { DurationSelector } from "./DurationSelector";
import { ModeSelector, type SessionBuilderMode } from "./ModeSelector";
import { ObjectiveConstraintsInputs } from "./ObjectiveConstraintsInputs";
import { TeamSelector, type WorkspaceTeamOption } from "./TeamSelector";

type SessionBuilderTopBlockProps = {
  formAction: (formData: FormData) => void;
  confirmedProfileJson: string;
  error?: string;
  teams: WorkspaceTeamOption[];
  selectedTeamId: string;
  onTeamChange: (teamId: string) => void;
  mode: SessionBuilderMode;
  onModeChange: (mode: SessionBuilderMode) => void;
  sport: string;
  ageBand: string;
  onAgeBandChange: (value: string) => void;
  durationMin: string;
  onDurationMinChange: (value: string) => void;
  objective: string;
  onObjectiveChange: (value: string) => void;
  constraints: string;
  onConstraintsChange: (value: string) => void;
  equipment: string;
  onEquipmentChange: (value: string) => void;
  actions: ReactNode;
};

export function SessionBuilderTopBlock({
  formAction,
  confirmedProfileJson,
  error,
  teams,
  selectedTeamId,
  onTeamChange,
  mode,
  onModeChange,
  sport,
  ageBand,
  onAgeBandChange,
  durationMin,
  onDurationMinChange,
  objective,
  onObjectiveChange,
  constraints,
  onConstraintsChange,
  equipment,
  onEquipmentChange,
  actions
}: SessionBuilderTopBlockProps) {
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  return (
    <form action={formAction} className="rounded-3xl border border-slate-200 bg-white/70 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Session Builder</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Keep the everyday coach flow focused: choose team context, pick a mode, set the session
          details, and generate through the shared path.
        </p>
      </div>

      <input type="hidden" name="sport" value={sport} />
      <input type="hidden" name="confirmedProfileJson" value={confirmedProfileJson} />

      <div className="mt-6 grid gap-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <TeamSelector teams={teams} value={selectedTeamId} onChange={onTeamChange} />
          <ModeSelector value={mode} onChange={onModeChange} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-medium">Age band</span>
            <select
              name="ageBand"
              value={ageBand}
              onChange={(event) => onAgeBandChange(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              required
            >
              <option value="u6">u6</option>
              <option value="u8">u8</option>
              <option value="u10">u10</option>
              <option value="u12">u12</option>
              <option value="u14">u14</option>
              <option value="u16">u16</option>
              <option value="u18">u18</option>
              <option value="adult">adult</option>
            </select>
          </label>

          <DurationSelector
            value={durationMin}
            onChange={onDurationMinChange}
            suggestedDurationMin={selectedTeam?.defaultDurationMin}
          />
        </div>

        <ObjectiveConstraintsInputs
          objective={objective}
          onObjectiveChange={onObjectiveChange}
          constraints={constraints}
          onConstraintsChange={onConstraintsChange}
          equipment={equipment}
          onEquipmentChange={onEquipmentChange}
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">{actions}</div>
    </form>
  );
}
