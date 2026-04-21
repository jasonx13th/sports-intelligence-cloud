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
  durationMin: string;
  onDurationMinChange: (value: string) => void;
  minimumDuration: number;
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
  durationMin,
  onDurationMinChange,
  minimumDuration,
  objective,
  onObjectiveChange,
  constraints,
  onConstraintsChange,
  equipment,
  onEquipmentChange,
  actions
}: SessionBuilderTopBlockProps) {
  return (
    <form action={formAction} className="club-vivo-shell rounded-[2rem] border p-6 backdrop-blur">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Set up</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Choose the team, set the session shape, and add the coaching context before you
          generate options.
        </p>
      </div>

      <input type="hidden" name="sport" value={sport} />
      <input type="hidden" name="ageBand" value={ageBand} />
      <input type="hidden" name="confirmedProfileJson" value={confirmedProfileJson} />

      <div className="mt-6 grid gap-6">
        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">1. Team</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Choose the team you want to work with for this session.
            </p>
          </div>
          <TeamSelector teams={teams} value={selectedTeamId} onChange={onTeamChange} />
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">2. Session mode</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Full Session is the current production path. Quick Drill stays visible as a lighter
              planning direction.
            </p>
          </div>
          <ModeSelector value={mode} onChange={onModeChange} />
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">3. Session details</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Set the timing, coaching goal, and practical details for today&apos;s group.
            </p>
          </div>

          <div className="grid gap-4">
            <DurationSelector
              value={durationMin}
              onChange={onDurationMinChange}
              minimumDuration={minimumDuration}
              mode={mode}
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
        </section>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-600">
          Generate session options, then save the one you want to keep.
        </p>
        <div>{actions}</div>
      </div>
    </form>
  );
}
