"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { GeneratedSession, SessionPack } from "../../../../lib/session-builder-api";
import {
  buildQuickSessionIntent,
  buildQuickSessionPromptSummary,
  buildQuickSessionTitle
} from "../../../../lib/quick-session-intent";

type SaveFormState = {
  error?: string;
};

type SaveAction = (state: SaveFormState, formData: FormData) => Promise<SaveFormState>;
type SaveFormDispatch = (formData: FormData) => void;

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

function QuickReviewCandidateCard({
  candidate,
  prompt,
  editHref,
  saveFormAction
}: {
  candidate: GeneratedSession;
  prompt: string;
  editHref: string;
  saveFormAction: SaveFormDispatch;
}) {
  const quickSessionTitle = buildQuickSessionTitle({
    prompt,
    session: candidate
  });
  const promptSummary = buildQuickSessionPromptSummary(prompt);
  const quickIntent = buildQuickSessionIntent(prompt);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white/80 p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Quick activity
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{quickSessionTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {promptSummary || "No quick-activity prompt summary saved."}
          </p>
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
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {quickIntent.durationSource === "prompt"
              ? `Using ${quickIntent.durationMin} minutes from your prompt.`
              : `Using the standard ${quickIntent.durationMin}-minute quick-activity duration.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <Link
            href={editHref}
            className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Edit
          </Link>
          <form action={saveFormAction}>
            <input type="hidden" name="candidate" value={JSON.stringify(candidate)} />
            <input type="hidden" name="origin" value="quick_session" />
            <input type="hidden" name="quickSessionTitle" value={quickSessionTitle} />
            <SaveButton />
          </form>
        </div>
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
                <h3 className="mt-1 text-base font-semibold text-slate-900">{activity.name}</h3>
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

export function QuickSessionReview({
  pack,
  prompt,
  editHref,
  saveAction
}: {
  pack: SessionPack;
  prompt: string;
  editHref: string;
  saveAction: SaveAction;
}) {
  const [saveState, saveFormAction] = useActionState(saveAction, {});
  const quickCandidate = pack.sessions[0];

  if (!quickCandidate) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
        <h2 className="text-base font-semibold text-slate-900">No quick activity available</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Create another quick activity or move into Session Builder for the detailed setup flow.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6">
      {saveState.error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveState.error}
        </p>
      ) : null}

      <section className="grid gap-5">
        <QuickReviewCandidateCard
          key={`${pack.packId}-0`}
          candidate={quickCandidate}
          prompt={prompt}
          editHref={editHref}
          saveFormAction={saveFormAction}
        />
      </section>
    </div>
  );
}
