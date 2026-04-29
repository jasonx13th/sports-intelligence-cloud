"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { DurationSelector } from "./DurationSelector";
import { ModeSelector, type SessionBuilderMode } from "./ModeSelector";
import { ObjectiveConstraintsInputs } from "./ObjectiveConstraintsInputs";
import { TeamSelector, type WorkspaceTeamOption } from "./TeamSelector";

type SessionEnvironmentOption = {
  value: string;
  label: string;
};

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
  environment: string;
  environmentOptions: SessionEnvironmentOption[];
  onEnvironmentChange: (value: string) => void;
  onAddEnvironment: (value: string) => void;
  objective: string;
  onObjectiveChange: (value: string) => void;
  constraints: string;
  onConstraintsChange: (value: string) => void;
  equipment: string;
  onEquipmentChange: (value: string) => void;
  equipmentOptions: string[];
  onSaveEquipmentOption: (
    value: string
  ) => Promise<{ items: string[]; error?: string; message?: string }>;
  selectedTeamName: string;
  actions: ReactNode;
};

function normalizeCustomEnvironment(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 48).trim();
}

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
  environment,
  environmentOptions,
  onEnvironmentChange,
  onAddEnvironment,
  objective,
  onObjectiveChange,
  constraints,
  onConstraintsChange,
  equipment,
  onEquipmentChange,
  equipmentOptions,
  onSaveEquipmentOption,
  selectedTeamName,
  actions
}: SessionBuilderTopBlockProps) {
  const [isAddingEnvironment, setIsAddingEnvironment] = useState(false);
  const [environmentDraft, setEnvironmentDraft] = useState("");

  function handleAddEnvironment() {
    const normalizedDraft = normalizeCustomEnvironment(environmentDraft);

    if (!normalizedDraft) {
      setEnvironmentDraft("");
      setIsAddingEnvironment(false);
      return;
    }

    onAddEnvironment(normalizedDraft);
    setEnvironmentDraft("");
    setIsAddingEnvironment(false);
  }

  return (
    <form action={formAction} className="club-vivo-shell rounded-[2rem] border p-6 backdrop-blur">
      <input type="hidden" name="sport" value={sport} />
      <input type="hidden" name="ageBand" value={ageBand} />
      <input type="hidden" name="teamId" value={selectedTeamId} />
      <input type="hidden" name="teamName" value={selectedTeamName} />
      <input type="hidden" name="confirmedProfileJson" value={confirmedProfileJson} />

      <div className="mt-6 grid gap-6">
        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Team</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Choose the team you are planning for today.
            </p>
          </div>
          <TeamSelector teams={teams} value={selectedTeamId} onChange={onTeamChange} />
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Build mode</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Pick the planning frame that fits what you want to build.
            </p>
          </div>
          <ModeSelector value={mode} onChange={onModeChange} />
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-medium">Objective</span>
            <input
              name="theme"
              value={objective}
              onChange={(event) => onObjectiveChange(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              placeholder="Pressing in midfield, first touch under pressure, finishing from cutbacks"
              required
            />
            <span className="text-xs leading-5 text-slate-500">
              Keep the session goal short and specific so the generated plan is easier to use.
            </span>
          </label>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <DurationSelector
            value={durationMin}
            onChange={onDurationMinChange}
            minimumDuration={minimumDuration}
            mode={mode}
          />
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <div className="grid gap-4">
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <label className="grid flex-1 gap-2 text-sm text-slate-700">
                  <span className="font-medium">Environment</span>
                  <select
                    name="environment"
                    value={environment}
                    onChange={(event) => onEnvironmentChange(event.target.value)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  >
                    {environmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => setIsAddingEnvironment(true)}
                  className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Add environment
                </button>
              </div>

              {isAddingEnvironment ? (
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="font-medium">Custom environment</span>
                    <input
                      type="text"
                      value={environmentDraft}
                      onChange={(event) => setEnvironmentDraft(event.target.value)}
                      placeholder="Parking lot"
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddEnvironment}
                    className="inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEnvironmentDraft("");
                      setIsAddingEnvironment(false);
                    }}
                    className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}

              <span className="text-xs leading-5 text-slate-500">
                Environment helps the builder reflect the real training surface and space. Added
                environments stay in this builder page for now.
              </span>
            </div>
          </div>

          <ObjectiveConstraintsInputs
            constraints={constraints}
            onConstraintsChange={onConstraintsChange}
            equipment={equipment}
            onEquipmentChange={onEquipmentChange}
            equipmentOptions={equipmentOptions}
            onSaveEquipmentOption={onSaveEquipmentOption}
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
          Generate one session option, then save it when it fits today.
        </p>
        <div>{actions}</div>
      </div>
    </form>
  );
}

export type { SessionEnvironmentOption };
