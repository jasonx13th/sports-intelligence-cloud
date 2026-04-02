"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { GeneratedSession, SessionPack } from "../../../lib/session-builder-api";

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

type SaveAction = (state: SaveFormState, formData: FormData) => Promise<SaveFormState>;
type SaveFormDispatch = (formData: FormData) => void;

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
  initialGenerateState,
  initialSaveState,
  generateAction,
  saveAction
}: {
  initialGenerateState: GenerateFormState;
  initialSaveState: SaveFormState;
  generateAction: GenerateAction;
  saveAction: SaveAction;
}) {
  const [generateState, generateFormAction] = useActionState(generateAction, initialGenerateState);
  const [saveState, saveFormAction] = useActionState(saveAction, initialSaveState);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form
        action={generateFormAction}
        className="rounded-3xl border border-slate-200 bg-white/70 p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900">Generation inputs</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter the minimum Week 12 inputs, then generate candidate sessions.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-medium">Sport</span>
            <input
              name="sport"
              defaultValue={generateState.values.sport}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              required
            />
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

      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Generated candidates</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Save one generated candidate to create a session.
        </p>

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
