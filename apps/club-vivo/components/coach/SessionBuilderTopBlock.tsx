"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

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
  selectedTeamAgeBand?: string;
  selectedTeamProgramType?: "travel" | "ost";
  selectedTeamPlayerCount?: number;
  actions: ReactNode;
};

function normalizeCustomEnvironment(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 48).trim();
}

const OBJECTIVE_FOCUS_OPTIONS: Record<string, string[]> = {
  Attacking: [
    "Create chances",
    "Play forward",
    "Combination play",
    "Wide play",
    "Finishing from cutbacks"
  ],
  Defending: [
    "Pressure and cover",
    "Delay and recover",
    "Defend wide areas",
    "Protect the box",
    "Win the ball back"
  ],
  "Transition to attack": [
    "First pass after regain",
    "Escape pressure after winning the ball",
    "Counter attack quickly",
    "Secure possession after regain",
    "Play out from own box after regain"
  ],
  "Transition to defend": [
    "Counterpress after losing the ball",
    "Recovery runs",
    "Protect central space",
    "Delay the counter attack"
  ],
  "Possession / build up": [
    "Build from the back",
    "Support angles",
    "Switch play",
    "Play through pressure"
  ],
  Finishing: [
    "Finish from cutbacks",
    "Shoot early",
    "Rebounds",
    "Combinations to finish"
  ],
  Pressing: [
    "Pressing triggers",
    "Force play wide",
    "Win the ball high",
    "Press and cover balance"
  ],
  "1v1 / small-sided duels": [
    "Beat the defender",
    "Defend 1v1",
    "Shield and escape",
    "Small-sided decision-making"
  ],
  "Team shape": [
    "Compact defending",
    "Attacking width",
    "Support underneath",
    "Balance around the ball"
  ],
  "Game understanding": [
    "Scan before receiving",
    "Recognize pressure",
    "Choose when to pass or dribble",
    "Use space"
  ],
  "Physical / reaction / speed": [
    "Reaction speed",
    "Acceleration",
    "Change of direction",
    "Recover quickly"
  ],
  Custom: []
};

const PRIMARY_OBJECTIVE_OPTIONS = Object.keys(OBJECTIVE_FOCUS_OPTIONS);

function buildGuidedObjective({
  primary,
  focus,
  detail
}: {
  primary: string;
  focus: string;
  detail: string;
}) {
  const normalizedDetail = detail.replace(/\s+/g, " ").trim();

  if (!primary || primary === "Custom") {
    return normalizedDetail;
  }

  const focusText = focus ? `${primary}: ${focus.toLowerCase()}.` : `${primary}.`;
  return normalizedDetail ? `${focusText} Coach note: ${normalizedDetail}.` : focusText;
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
  selectedTeamAgeBand,
  selectedTeamProgramType,
  selectedTeamPlayerCount,
  actions
}: SessionBuilderTopBlockProps) {
  const [isAddingEnvironment, setIsAddingEnvironment] = useState(false);
  const [environmentDraft, setEnvironmentDraft] = useState("");
  const [primaryObjective, setPrimaryObjective] = useState("");
  const [specificFocus, setSpecificFocus] = useState("");
  const [objectiveDetail, setObjectiveDetail] = useState(objective);
  const focusOptions = primaryObjective ? OBJECTIVE_FOCUS_OPTIONS[primaryObjective] || [] : [];

  useEffect(() => {
    if (!primaryObjective && objective !== objectiveDetail) {
      setObjectiveDetail(objective);
    }
  }, [objective, objectiveDetail, primaryObjective]);

  function updateObjective(nextValues: {
    primary?: string;
    focus?: string;
    detail?: string;
  }) {
    const nextPrimary = nextValues.primary ?? primaryObjective;
    const allowedFocusOptions = nextPrimary ? OBJECTIVE_FOCUS_OPTIONS[nextPrimary] || [] : [];
    const nextFocus =
      nextValues.focus !== undefined
        ? nextValues.focus
        : allowedFocusOptions.includes(specificFocus)
          ? specificFocus
          : "";
    const nextDetail = nextValues.detail ?? objectiveDetail;

    setPrimaryObjective(nextPrimary);
    setSpecificFocus(nextFocus);
    setObjectiveDetail(nextDetail);
    onObjectiveChange(
      buildGuidedObjective({
        primary: nextPrimary,
        focus: nextFocus,
        detail: nextDetail
      })
    );
  }

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
      <input type="hidden" name="teamAgeBand" value={selectedTeamAgeBand || ""} />
      <input type="hidden" name="teamProgramType" value={selectedTeamProgramType || ""} />
      <input
        type="hidden"
        name="teamPlayerCount"
        value={selectedTeamPlayerCount ? String(selectedTeamPlayerCount) : ""}
      />
      <input
        type="hidden"
        name="sessionMode"
        value={mode === "quick_drill" ? "drill" : "full_session"}
      />
      <input type="hidden" name="confirmedProfileJson" value={confirmedProfileJson} />

      <div className="grid gap-5">
        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Build mode</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Pick the planning frame that fits what you want to build.
            </p>
          </div>
          <ModeSelector value={mode} onChange={onModeChange} />
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
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
            <DurationSelector
              value={durationMin}
              onChange={onDurationMinChange}
              minimumDuration={minimumDuration}
              mode={mode}
            />
          </section>
        </div>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <input type="hidden" name="theme" value={objective} />
          <div>
            <h3 className="text-base font-semibold text-slate-900">Objective</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Choose a guide, then add your own detail. You can also leave the guides blank and type
              a custom objective.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Primary objective</span>
              <select
                value={primaryObjective}
                onChange={(event) => updateObjective({ primary: event.target.value, focus: "" })}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              >
                <option value="">Use custom text only</option>
                {PRIMARY_OBJECTIVE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Specific focus</span>
              <select
                value={specificFocus}
                onChange={(event) => updateObjective({ focus: event.target.value })}
                disabled={focusOptions.length === 0}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">Select focus</option>
                {focusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {focusOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {focusOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateObjective({ focus: option })}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    specificFocus === option
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-medium">
              {primaryObjective && primaryObjective !== "Custom"
                ? "Coach note / custom detail"
                : "Custom objective"}
            </span>
            <textarea
              value={objectiveDetail}
              onChange={(event) => updateObjective({ detail: event.target.value })}
              className="min-h-24 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              placeholder="Example: find the first pass forward after recovering in our own box"
              required={!objective}
            />
            <span className="text-xs leading-5 text-slate-500">
              Sent to the builder as: {objective || "Add an objective before generating."}
            </span>
          </label>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
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
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
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
        </section>

        <ObjectiveConstraintsInputs
          constraints={constraints}
          onConstraintsChange={onConstraintsChange}
          equipment={equipment}
          onEquipmentChange={onEquipmentChange}
          equipmentOptions={equipmentOptions}
          onSaveEquipmentOption={onSaveEquipmentOption}
        />
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
