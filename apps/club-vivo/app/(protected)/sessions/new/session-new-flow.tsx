"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  SessionBuilderTopBlock,
  type SessionEnvironmentOption
} from "../../../../components/coach/SessionBuilderTopBlock";
import { type SessionBuilderMode } from "../../../../components/coach/ModeSelector";
import { type WorkspaceTeamOption } from "../../../../components/coach/TeamSelector";
import type {
  GeneratedSession,
  ImageAnalysisMode,
  ImageAnalysisResult,
  SessionPack
} from "../../../../lib/session-builder-api";
import { buildBuilderSessionLabelFromSession } from "../../../../lib/builder-session-label";

export type AnalyzeFormState = {
  values: {
    mode: ImageAnalysisMode;
  };
  analysis?: ImageAnalysisResult;
  error?: string;
};

export type GenerateFormState = {
  values: {
    sport: string;
    ageBand: string;
    durationMin: string;
    environment: string;
    theme: string;
    equipment: string;
  };
  pack?: SessionPack;
  error?: string;
};

export type SaveFormState = {
  error?: string;
};

type GenerateAction = (
  state: GenerateFormState,
  formData: FormData
) => Promise<GenerateFormState>;

type AnalyzeAction = (state: AnalyzeFormState, formData: FormData) => Promise<AnalyzeFormState>;
type SaveAction = (state: SaveFormState, formData: FormData) => Promise<SaveFormState>;
type SaveFormDispatch = (formData: FormData) => void;
type SaveEquipmentOptionsAction = (
  items: string[]
) => Promise<{ items: string[]; error?: string; message?: string }>;

const FULL_SESSION_DEFAULT_DURATION = "60";
const FULL_SESSION_MIN_DURATION = 30;
const QUICK_DRILL_DEFAULT_DURATION = "20";
const QUICK_DRILL_MIN_DURATION = 10;
const DEFAULT_ENVIRONMENT_OPTIONS: SessionEnvironmentOption[] = [
  { value: "grass_field", label: "Grass field" },
  { value: "turf_field", label: "Turf field" },
  { value: "gym_floor", label: "Gym floor" },
  { value: "wood_floor", label: "Wood floor" },
  { value: "indoor_wood_floor", label: "Indoor wood floor" }
];

function normalizeCustomEnvironment(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 48).trim();
}

function buildEnvironmentOptions(values: string[]): SessionEnvironmentOption[] {
  const defaultValues = new Set(DEFAULT_ENVIRONMENT_OPTIONS.map((option) => option.value));
  const customOptions = values.reduce<SessionEnvironmentOption[]>((accumulator, value) => {
    const normalizedValue = normalizeCustomEnvironment(value);

    if (!normalizedValue || defaultValues.has(normalizedValue)) {
      return accumulator;
    }

    if (accumulator.some((option) => option.value === normalizedValue)) {
      return accumulator;
    }

    accumulator.push({
      value: normalizedValue,
      label: normalizedValue
    });
    return accumulator;
  }, []);

  return [...DEFAULT_ENVIRONMENT_OPTIONS, ...customOptions];
}

function AnalyzeButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex rounded-full border border-transparent bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Analyzing..." : "Analyze image"}
    </button>
  );
}

function GenerateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex rounded-full border border-transparent bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Generating..." : "Generate session"}
    </button>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex rounded-full border border-transparent bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Saving..." : "Save session"}
    </button>
  );
}

function CandidateCard({
  candidate,
  origin,
  saveFormAction,
  sessionTitleContext
}: {
  candidate: GeneratedSession;
  origin: "full_session" | "quick_drill";
  saveFormAction: SaveFormDispatch;
  sessionTitleContext: {
    objective: string;
    teamName: string;
    environment: string;
  };
}) {
  const equipment = Array.isArray(candidate.equipment) ? candidate.equipment : [];
  const sessionLabel = buildBuilderSessionLabelFromSession({
    objective: sessionTitleContext.objective,
    session: candidate
  });

  return (
    <article className="rounded-3xl border border-slate-200 bg-white/80 p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Generated session
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            {sessionLabel}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {candidate.ageBand.toUpperCase()}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {candidate.durationMin} minutes
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {candidate.activities.length} activities
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {candidate.sport}
            </span>
          </div>
        </div>

        <form action={saveFormAction} className="sm:shrink-0">
          <input type="hidden" name="candidate" value={JSON.stringify(candidate)} />
          <input type="hidden" name="origin" value={origin} />
          <input type="hidden" name="objective" value={sessionTitleContext.objective} />
          <input type="hidden" name="teamName" value={sessionTitleContext.teamName} />
          <input type="hidden" name="environment" value={sessionTitleContext.environment} />
          <SaveButton />
        </form>
      </div>

      <div className="mt-5 grid gap-5">
        <section className="grid gap-2">
          <h4 className="text-sm font-semibold text-slate-900">Focus</h4>
          <div className="flex flex-wrap gap-2">
            {candidate.objectiveTags.length > 0 ? (
              candidate.objectiveTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No objective tags listed</span>
            )}
          </div>
        </section>

        <section className="grid gap-2">
          <h4 className="text-sm font-semibold text-slate-900">Equipment</h4>
          <div className="flex flex-wrap gap-2">
            {equipment.length > 0 ? (
              equipment.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No equipment listed</span>
            )}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-3">
        {candidate.activities.map((activity, activityIndex) => (
          <section
            key={`${activity.name}-${activityIndex}`}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Activity {activityIndex + 1}
                </p>
                <h4 className="mt-1 text-base font-semibold text-slate-900">{activity.name}</h4>
              </div>
              <p className="text-sm font-medium text-slate-600">{activity.minutes} minutes</p>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              {activity.description?.trim() || "No description provided."}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}

export function NewSessionFlow({
  initialAnalyzeState,
  initialGenerateState,
  initialSaveState,
  teamOptions,
  initialEquipmentOptions,
  initialConstraints,
  analyzeAction,
  generateAction,
  saveAction,
  saveEquipmentOptionsAction
}: {
  initialAnalyzeState: AnalyzeFormState;
  initialGenerateState: GenerateFormState;
  initialSaveState: SaveFormState;
  teamOptions: WorkspaceTeamOption[];
  initialEquipmentOptions: string[];
  initialConstraints?: string;
  analyzeAction: AnalyzeAction;
  generateAction: GenerateAction;
  saveAction: SaveAction;
  saveEquipmentOptionsAction: SaveEquipmentOptionsAction;
}) {
  const [analyzeState, analyzeFormAction] = useActionState(analyzeAction, initialAnalyzeState);
  const [generateState, generateFormAction] = useActionState(generateAction, initialGenerateState);
  const [saveState, saveFormAction] = useActionState(saveAction, initialSaveState);
  const [selectedTeamId, setSelectedTeamId] = useState(teamOptions[0]?.id ?? "");
  const [workspaceMode, setWorkspaceMode] = useState<SessionBuilderMode>("full_session");
  const [sport, setSport] = useState(initialGenerateState.values.sport);
  const [ageBand, setAgeBand] = useState(initialGenerateState.values.ageBand);
  const [durationMin, setDurationMin] = useState(initialGenerateState.values.durationMin);
  const [environment, setEnvironment] = useState(initialGenerateState.values.environment);
  const [environmentOptions, setEnvironmentOptions] = useState<SessionEnvironmentOption[]>(() =>
    buildEnvironmentOptions([initialGenerateState.values.environment])
  );
  const [objective, setObjective] = useState(initialGenerateState.values.theme);
  const [constraints, setConstraints] = useState(initialConstraints ?? "");
  const [equipment, setEquipment] = useState(initialGenerateState.values.equipment);
  const [equipmentOptions, setEquipmentOptions] = useState(initialEquipmentOptions);
  const [profileEditorValue, setProfileEditorValue] = useState("");
  const [confirmedProfileJson, setConfirmedProfileJson] = useState("");
  const [profileNotice, setProfileNotice] = useState<string>();
  const reviewSectionRef = useRef<HTMLElement | null>(null);
  const lastScrolledPackIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!analyzeState.analysis?.profile) {
      return;
    }

    setProfileEditorValue(JSON.stringify(analyzeState.analysis.profile, null, 2));
    setConfirmedProfileJson("");
    setProfileNotice("Review and edit the draft profile, then confirm it before generation.");
  }, [analyzeState.analysis]);

  useEffect(() => {
    setSport(generateState.values.sport);
    setAgeBand(generateState.values.ageBand);
    setDurationMin(generateState.values.durationMin);
    setEnvironment(generateState.values.environment);
    setEnvironmentOptions((current) =>
      buildEnvironmentOptions([
        ...current.map((option) => option.value),
        generateState.values.environment
      ])
    );
    setObjective(generateState.values.theme);
    setEquipment(generateState.values.equipment);
  }, [
    generateState.values.ageBand,
    generateState.values.durationMin,
    generateState.values.equipment,
    generateState.values.environment,
    generateState.values.sport,
    generateState.values.theme
  ]);

  useEffect(() => {
    const packId = generateState.pack?.packId;

    if (!packId || lastScrolledPackIdRef.current === packId) {
      return;
    }

    lastScrolledPackIdRef.current = packId;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reviewSectionRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  }, [generateState.pack?.packId]);

  const minimumDuration = workspaceMode === "quick_drill" ? QUICK_DRILL_MIN_DURATION : FULL_SESSION_MIN_DURATION;
  const hasDraftProfile = Boolean(analyzeState.analysis?.profile);
  const selectedTeam = teamOptions.find((team) => team.id === selectedTeamId);

  function handleProfileEditorChange(nextValue: string) {
    setProfileEditorValue(nextValue);

    if (confirmedProfileJson) {
      setConfirmedProfileJson("");
      setProfileNotice("Profile changed. Confirm again before generating sessions.");
    }
  }

  function handleConfirmProfile() {
    try {
      const parsed = JSON.parse(profileEditorValue) as Record<string, unknown>;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        throw new Error("invalid");
      }

      const confirmed = {
        ...parsed,
        status: "confirmed"
      };
      const confirmedJson = JSON.stringify(confirmed);

      setProfileEditorValue(JSON.stringify(confirmed, null, 2));
      setConfirmedProfileJson(confirmedJson);
      setProfileNotice("Profile confirmed. Generation will now use the reviewed profile.");
    } catch {
      setConfirmedProfileJson("");
      setProfileNotice("Profile JSON is invalid. Fix it before confirming.");
    }
  }

  function handleModeChange(mode: SessionBuilderMode) {
    setWorkspaceMode(mode);
    setDurationMin(mode === "quick_drill" ? QUICK_DRILL_DEFAULT_DURATION : FULL_SESSION_DEFAULT_DURATION);
  }

  function handleTeamChange(teamId: string) {
    setSelectedTeamId(teamId);

    const selectedTeam = teamOptions.find((team) => team.id === teamId);
    if (!selectedTeam) {
      return;
    }

    setSport(selectedTeam.sport);

    if (selectedTeam.ageBand) {
      setAgeBand(selectedTeam.ageBand);
    }
  }

  function handleAddEnvironment(value: string) {
    setEnvironmentOptions((current) =>
      buildEnvironmentOptions([...current.map((option) => option.value), value])
    );
    setEnvironment(value);
  }

  async function handleSaveEquipmentOption(value: string) {
    const result = await saveEquipmentOptionsAction([...equipmentOptions, value]);

    if (!result.error) {
      setEquipmentOptions(result.items);
    }

    return result;
  }

  return (
    <div className="mt-8 grid gap-8">
      <SessionBuilderTopBlock
        formAction={generateFormAction}
        confirmedProfileJson={confirmedProfileJson}
        error={generateState.error}
        teams={teamOptions}
        selectedTeamId={selectedTeamId}
        onTeamChange={handleTeamChange}
        mode={workspaceMode}
        onModeChange={handleModeChange}
        sport={sport}
        ageBand={ageBand}
        durationMin={durationMin}
        onDurationMinChange={setDurationMin}
        minimumDuration={minimumDuration}
        environment={environment}
        environmentOptions={environmentOptions}
        onEnvironmentChange={setEnvironment}
        onAddEnvironment={handleAddEnvironment}
        objective={objective}
        onObjectiveChange={setObjective}
        constraints={constraints}
        onConstraintsChange={setConstraints}
        equipment={equipment}
        onEquipmentChange={setEquipment}
        equipmentOptions={equipmentOptions}
        onSaveEquipmentOption={handleSaveEquipmentOption}
        selectedTeamName={selectedTeam?.label || ""}
        actions={<GenerateButton />}
      />

      <details className="rounded-3xl border border-slate-200 bg-white/70 p-6">
        <summary className="cursor-pointer list-none">
          <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <span className="block">
              <h2 className="text-lg font-semibold text-slate-900">Image-assisted intake</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Optional support for coaches who want extra help from one field image.
              </p>
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
              Secondary
            </span>
          </span>
        </summary>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div className="grid gap-6">
            <form
              action={analyzeFormAction}
              className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900">Analyze one image</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Upload one image to draft an intake profile, then review it before using it in the
                main builder.
              </p>

              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm text-slate-700">
                  <span className="font-medium">Mode</span>
                  <select
                    name="mode"
                    defaultValue={analyzeState.values.mode}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                    required
                  >
                    <option value="environment_profile">Environment profile</option>
                    <option value="setup_to_drill">Setup to drill</option>
                  </select>
                  <span className="text-xs leading-5 text-slate-500">
                    Environment profile reads the space. Setup to drill drafts a starting drill
                    idea from the image.
                  </span>
                </label>

                <label className="grid gap-2 text-sm text-slate-700">
                  <span className="font-medium">Image</span>
                  <input
                    name="sourceImage"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-700"
                    required
                  />
                  <span className="text-xs leading-5 text-slate-500">
                    Upload one JPG, PNG, or WebP image per analysis request.
                  </span>
                </label>
              </div>

              {analyzeState.error ? (
                <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {analyzeState.error}
                </p>
              ) : null}

              <div className="mt-6">
                <AnalyzeButton />
              </div>
            </form>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Draft image profile</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confirm the reviewed profile only when you want the main builder to use it.
            </p>

            {hasDraftProfile ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Draft image profile</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Edit the draft JSON if needed. The builder only uses it after you confirm it.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmProfile}
                    className="inline-flex rounded-full border border-transparent bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
                  >
                    Confirm profile
                  </button>
                </div>

                <textarea
                  value={profileEditorValue}
                  onChange={(event) => handleProfileEditorChange(event.target.value)}
                  className="mt-4 min-h-80 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-700"
                  spellCheck={false}
                />

                {profileNotice ? (
                  <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {profileNotice}
                  </p>
                ) : null}
              </div>
            ) : null}

            {!hasDraftProfile ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
                <h3 className="text-base font-semibold text-slate-900">No analyzed profile yet</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Use image intake only when you want extra environment or setup guidance.
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </details>

      <section ref={reviewSectionRef} className="rounded-3xl border border-slate-200 bg-white/70 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Review your session</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review the generated session below, then save it to continue.
            </p>
          </div>

          {workspaceMode === "quick_drill" ? (
            <p className="max-w-sm rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              Quick Drill still uses the shared generation path. It is a lighter planning frame,
              not a separate backend mode.
            </p>
          ) : null}
        </div>

        {saveState.error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveState.error}
          </p>
        ) : null}

        {generateState.pack ? (
          <div className="mt-6 grid gap-5">
            {generateState.pack.sessions.slice(0, 1).map((candidate, index) => (
              <CandidateCard
                key={`${generateState.pack?.packId}-${index}`}
                candidate={candidate}
                origin={workspaceMode === "quick_drill" ? "quick_drill" : "full_session"}
                saveFormAction={saveFormAction}
                sessionTitleContext={{
                  objective,
                  teamName: selectedTeam?.label || "",
                  environment
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
            <h3 className="text-base font-semibold text-slate-900">No session options yet</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Generate a session above to see a coach-ready plan here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
