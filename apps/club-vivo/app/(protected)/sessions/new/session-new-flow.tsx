"use client";

import { type ReactNode, useActionState, useEffect, useRef, useState } from "react";
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

function buildSessionContextTitle({
  teamName,
  ageBand,
  durationMin
}: {
  teamName: string;
  ageBand: string;
  durationMin: number;
}) {
  const durationLabel = Number.isFinite(durationMin) ? `${durationMin} min` : "";
  const parts = [teamName.trim(), ageBand.trim().toUpperCase(), durationLabel].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Generated session";
}

function normalizeComparisonText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sentenceRepeatsObjective(sentence: string, objective: string, objectiveTags: string[]) {
  const match = sentence.match(/^today(?:'|\u2019)?s\s+(?:focus|objective)\s*:\s*(.+)$/i);

  if (!match) {
    return false;
  }

  const sentenceObjective = normalizeComparisonText(match[1]);
  const coachObjective = normalizeComparisonText(objective);
  const tagObjectives = objectiveTags.map(normalizeComparisonText).filter(Boolean);

  if (!sentenceObjective) {
    return true;
  }

  if (
    coachObjective &&
    (coachObjective.includes(sentenceObjective) || sentenceObjective.includes(coachObjective))
  ) {
    return true;
  }

  return tagObjectives.some(
    (tag) => tag.includes(sentenceObjective) || sentenceObjective.includes(tag)
  );
}

function splitActivityDescription(
  description: string,
  objective: string,
  objectiveTags: string[]
) {
  const normalizedDescription = description.replace(/\s+/g, " ").trim();

  if (!normalizedDescription) {
    return [];
  }

  const sentenceMatches = normalizedDescription.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);

  if (!sentenceMatches || sentenceMatches.length < 2) {
    return sentenceRepeatsObjective(normalizedDescription, objective, objectiveTags)
      ? []
      : [normalizedDescription];
  }

  return sentenceMatches
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !sentenceRepeatsObjective(sentence, objective, objectiveTags));
}

function LegendSymbol({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 ${className}`}
    >
      {children}
    </span>
  );
}

function DiagramLegendItem({
  symbol,
  label
}: {
  symbol: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      {symbol}
      <span className="text-xs leading-5 text-slate-700">{label}</span>
    </div>
  );
}

function DiagramCanvas({ size = "compact" }: { size?: "compact" | "large" }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white",
        size === "large" ? "min-h-72" : "min-h-44"
      ].join(" ")}
    >
      <div className="absolute inset-4 rounded-lg border border-slate-100" />
      <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] border-l border-slate-100" />
      <div className="absolute left-6 top-1/2 h-2 w-2 rounded-full bg-blue-500" />
      <div className="absolute left-1/3 top-1/3 h-2 w-2 rounded-full bg-blue-500" />
      <div className="absolute right-8 top-1/3 h-2 w-2 rounded-full bg-red-500" />
      <div className="absolute bottom-8 left-1/4 h-2 w-2 rounded-full bg-yellow-400" />
      <div className="absolute bottom-8 right-1/3 h-2 w-2 rounded-full bg-yellow-400" />
      <div className="absolute left-[30%] top-[42%] h-px w-24 rotate-[-12deg] bg-slate-400" />
      <div className="absolute left-[52%] top-[32%] h-px w-16 rotate-[24deg] border-t border-dotted border-slate-400" />
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
        <div className="rounded-full border border-slate-200 bg-white/95 px-4 py-2 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Diagram coming next
          </p>
        </div>
      </div>
    </div>
  );
}

function DiagramPlaceholder() {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    if (!isZoomOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsZoomOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setIsZoomOpen(true)}
        className="group block w-full rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-teal-600"
        aria-label="Open larger diagram preview"
      >
        <div className="transition group-hover:border-teal-300 group-hover:bg-teal-50/20">
          <DiagramCanvas />
        </div>
      </button>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Click to enlarge this future diagram preview.
      </p>

      {isZoomOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:p-6"
          role="presentation"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Larger diagram preview"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h5 className="text-base font-semibold text-slate-900">Diagram coming next</h5>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                aria-label="Close larger diagram preview"
              >
                &times;
              </button>
            </div>

            <DiagramCanvas size="large" />
            <p className="mt-4 text-xs leading-5 text-slate-600">
              Full diagrams will use the Club Vivo diagram standard in a later version. Read arrows
              for movement, blue as the team being coached, red as opposition, and yellow as cones or
              equipment.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActivityCoachGuide({
  description,
  objective,
  objectiveTags
}: {
  description?: string;
  objective: string;
  objectiveTags: string[];
}) {
  const descriptionLines = splitActivityDescription(description ?? "", objective, objectiveTags);

  if (descriptionLines.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
      <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        How to run it
      </h6>

      {descriptionLines.length > 1 ? (
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
          {descriptionLines.map((line) => (
            <li key={line} className="rounded-xl bg-slate-50/80 px-3 py-2">
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-700">{descriptionLines[0]}</p>
      )}
    </section>
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
  const objectiveTags = Array.isArray(candidate.objectiveTags) ? candidate.objectiveTags : [];
  const sessionLabel = buildBuilderSessionLabelFromSession({
    objective: sessionTitleContext.objective,
    session: candidate
  });
  const contextTitle = buildSessionContextTitle({
    teamName: sessionTitleContext.teamName,
    ageBand: candidate.ageBand,
    durationMin: candidate.durationMin
  });
  const coachObjective = sessionTitleContext.objective.trim();
  const objectiveDisplay = coachObjective || objectiveTags.join(", ");

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Generated session
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {sessionLabel}
          </h3>
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

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <section className="rounded-3xl border border-slate-200 bg-white/70 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h4 className="text-base font-semibold text-slate-900">{contextTitle}</h4>
            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              At a glance
            </span>
          </div>

          <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Objective
            </h5>
            {objectiveDisplay ? (
              <p className="mt-2 text-sm leading-6 text-slate-800">{objectiveDisplay}</p>
            ) : null}
          </section>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold text-slate-900">Diagram legend</h4>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <DiagramLegendItem symbol={<LegendSymbol>→</LegendSymbol>} label="Pass or shot" />
          <DiagramLegendItem
            symbol={<LegendSymbol>⋯→</LegendSymbol>}
            label="Movement without the ball"
          />
          <DiagramLegendItem symbol={<LegendSymbol>~~~→</LegendSymbol>} label="Dribble or carry" />
          <DiagramLegendItem
            symbol={<LegendSymbol>⤴</LegendSymbol>}
            label="Curved run or rotation"
          />
          <DiagramLegendItem
            symbol={
              <LegendSymbol className="border-blue-200 bg-blue-50">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
              </LegendSymbol>
            }
            label="Team coached"
          />
          <DiagramLegendItem
            symbol={
              <LegendSymbol className="border-red-200 bg-red-50">
                <span className="h-3 w-3 rounded-full bg-red-500" />
              </LegendSymbol>
            }
            label="Opposition"
          />
          <DiagramLegendItem
            symbol={
              <LegendSymbol className="border-yellow-200 bg-yellow-50">
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
              </LegendSymbol>
            }
            label="Cones or equipment"
          />
        </div>
        </section>
      </div>

      <section className="mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h4 className="text-lg font-semibold text-slate-900">Activities</h4>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {candidate.activities.length} activities
          </span>
        </div>

        <div className="mt-4 grid gap-4">
          {candidate.activities.map((activity, activityIndex) => (
            <section
              key={`${activity.name}-${activityIndex}`}
              className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
                <div className="min-w-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
                        {activityIndex + 1}
                      </span>
                      <h5 className="min-w-0 text-lg font-semibold text-slate-900">
                        {activity.name}
                      </h5>
                    </div>

                    <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                      {activity.minutes} minutes
                    </span>
                  </div>

                  <ActivityCoachGuide
                    description={activity.description}
                    objective={coachObjective}
                    objectiveTags={objectiveTags}
                  />
                </div>

                <DiagramPlaceholder />
              </div>
            </section>
          ))}
        </div>
      </section>
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
          <h2 className="text-lg font-semibold text-slate-900">Review before saving</h2>

          {workspaceMode === "quick_drill" ? (
            <p className="max-w-sm rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              Drill still uses the shared generation path. It is a lighter planning frame,
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
