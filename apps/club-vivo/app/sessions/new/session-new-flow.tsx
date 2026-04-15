"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import type {
  GeneratedSession,
  ImageAnalysisMode,
  ImageAnalysisResult,
  SessionPack
} from "../../../lib/session-builder-api";

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
      className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Generating..." : "Generate sessions"}
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
  index,
  saveFormAction
}: {
  candidate: GeneratedSession;
  index: number;
  saveFormAction: SaveFormDispatch;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/70 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Candidate {index + 1}: {candidate.sport} · {candidate.ageBand}
          </h3>
          <p className="mt-2 text-sm text-slate-600">{candidate.durationMin} minutes</p>
        </div>

        <form action={saveFormAction}>
          <input type="hidden" name="candidate" value={JSON.stringify(candidate)} />
          <SaveButton />
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
          <span className="text-sm text-slate-500">No objective tags</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {candidate.equipment.length > 0 ? (
          candidate.equipment.map((item) => (
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

      <div className="mt-5 grid gap-3">
        {candidate.activities.map((activity, activityIndex) => (
          <section
            key={`${activity.name}-${activityIndex}`}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h4 className="text-base font-semibold text-slate-900">{activity.name}</h4>
              <p className="text-sm text-slate-600">{activity.minutes} minutes</p>
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
  analyzeAction,
  generateAction,
  saveAction
}: {
  initialAnalyzeState: AnalyzeFormState;
  initialGenerateState: GenerateFormState;
  initialSaveState: SaveFormState;
  analyzeAction: AnalyzeAction;
  generateAction: GenerateAction;
  saveAction: SaveAction;
}) {
  const [analyzeState, analyzeFormAction] = useActionState(analyzeAction, initialAnalyzeState);
  const [generateState, generateFormAction] = useActionState(generateAction, initialGenerateState);
  const [saveState, saveFormAction] = useActionState(saveAction, initialSaveState);
  const [profileEditorValue, setProfileEditorValue] = useState("");
  const [confirmedProfileJson, setConfirmedProfileJson] = useState("");
  const [profileNotice, setProfileNotice] = useState<string>();

  useEffect(() => {
    if (!analyzeState.analysis?.profile) {
      return;
    }

    setProfileEditorValue(JSON.stringify(analyzeState.analysis.profile, null, 2));
    setConfirmedProfileJson("");
    setProfileNotice("Review and edit the draft profile, then confirm it before generation.");
  }, [analyzeState.analysis]);

  const hasDraftProfile = Boolean(analyzeState.analysis?.profile);

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

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="grid gap-6">
        <form
          action={analyzeFormAction}
          className="rounded-3xl border border-slate-200 bg-white/70 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900">Image-assisted intake</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Upload one image to draft an intake profile. Review and confirm the draft before generation.
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
                environment_profile drafts space understanding. setup_to_drill seeds one drill activity only.
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
                Week 18 v1 accepts one JPG, PNG, or WebP image per analysis request.
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

        <form
          action={generateFormAction}
          className="rounded-3xl border border-slate-200 bg-white/70 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900">Generation inputs</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter the shared Session Builder inputs, then generate candidate sessions.
          </p>

          <input type="hidden" name="confirmedProfileJson" value={confirmedProfileJson} />

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Flow</span>
              <select
                name="sport"
                defaultValue={generateState.values.sport}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                required
              >
                <option value="soccer">Soccer</option>
                <option value="fut-soccer">Fut-Soccer</option>
              </select>
              <span className="text-xs leading-5 text-slate-500">
                Fut-Soccer uses the shared soccer generation path with a reduced-space coaching bias.
              </span>
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Age band</span>
              <select
                name="ageBand"
                defaultValue={generateState.values.ageBand}
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

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Duration (minutes)</span>
              <input
                name="durationMin"
                type="number"
                min="5"
                step="1"
                defaultValue={generateState.values.durationMin}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                required
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Theme</span>
              <input
                name="theme"
                defaultValue={generateState.values.theme}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                required
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Equipment</span>
              <input
                name="equipment"
                defaultValue={generateState.values.equipment}
                placeholder="cones, balls"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              />
            </label>
          </div>

          {generateState.error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {generateState.error}
            </p>
          ) : null}

          <div className="mt-6">
            <GenerateButton />
          </div>
        </form>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Review and candidates</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Confirm the reviewed image profile first when you want generation to use it. Save one generated candidate to create a session.
        </p>

        {hasDraftProfile ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Draft image profile</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Edit the draft JSON if needed. Generation only uses the profile after you confirm it.
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

        {saveState.error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveState.error}
          </p>
        ) : null}

        {generateState.pack ? (
          <div className="mt-6 grid gap-5">
            {generateState.pack.sessions.map((candidate, index) => (
              <CandidateCard
                key={`${generateState.pack?.packId}-${index}`}
                candidate={candidate}
                index={index}
                saveFormAction={saveFormAction}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
            <h3 className="text-base font-semibold text-slate-900">No generated sessions yet</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Submit the generation form to view candidate sessions here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
