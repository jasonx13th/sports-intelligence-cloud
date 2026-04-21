"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type {
  SessionFeedbackFlowMode,
  SessionFeedbackImageAnalysisAccuracy,
} from "../../../../lib/session-builder-api";

type FeedbackPanelStatus = "idle" | "error" | "success" | "already-submitted";

type FeedbackPanelValues = {
  sessionQuality: string;
  drillUsefulness: string;
  imageAnalysisAccuracy: SessionFeedbackImageAnalysisAccuracy;
  missingFeatures: string;
  flowMode: SessionFeedbackFlowMode | "";
};

export type FeedbackPanelState = {
  status: FeedbackPanelStatus;
  message?: string;
  values: FeedbackPanelValues;
};

type FeedbackPanelAction = (
  state: FeedbackPanelState,
  formData: FormData
) => Promise<FeedbackPanelState>;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex rounded-full border border-transparent bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Submitting..." : "Submit feedback"}
    </button>
  );
}

export function SessionFeedbackPanel({
  initialState,
  submitAction,
}: {
  initialState: FeedbackPanelState;
  submitAction: FeedbackPanelAction;
}) {
  const [state, formAction] = useActionState(submitAction, initialState);
  const isLocked = state.status === "success" || state.status === "already-submitted";

  return (
    <article className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-5">
      <h2 className="text-lg font-semibold text-slate-900">Feedback</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Share one short round of pilot feedback for this saved session.
      </p>

      {isLocked ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {state.message}
        </div>
      ) : (
        <form action={formAction} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Session quality</span>
              <select
                name="sessionQuality"
                defaultValue={state.values.sessionQuality}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                required
              >
                <option value="">Select rating</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Drill usefulness</span>
              <select
                name="drillUsefulness"
                defaultValue={state.values.drillUsefulness}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                required
              >
                <option value="">Select rating</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Image analysis accuracy</span>
              <select
                name="imageAnalysisAccuracy"
                defaultValue={state.values.imageAnalysisAccuracy}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                required
              >
                <option value="not_used">Not used</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Flow mode</span>
              <select
                name="flowMode"
                defaultValue={state.values.flowMode}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              >
                <option value="">Not specified</option>
                <option value="session_builder">Session Builder</option>
                <option value="environment_profile">Environment profile</option>
                <option value="setup_to_drill">Setup to drill</option>
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-medium">Missing features</span>
            <textarea
              name="missingFeatures"
              defaultValue={state.values.missingFeatures}
              maxLength={280}
              rows={4}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              required
            />
          </label>

          {state.status === "error" && state.message ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.message}
            </p>
          ) : null}

          <div>
            <SubmitButton />
          </div>
        </form>
      )}
    </article>
  );
}
