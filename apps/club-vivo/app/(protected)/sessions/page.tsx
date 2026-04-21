import Link from "next/link";

import {
  buildReuseSessionHref,
  getSessionDisplayLabel
} from "../../../components/coach/ReuseFromLibraryEntry";
import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { getSessions } from "../../../lib/session-builder-api";

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function SessionsPage() {
  const { items } = await getSessions();

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Sessions"
        title="Saved sessions"
        description={
          <>
            This page shows the saved sessions currently available in the KSC pilot flow from{" "}
            <code>GET /sessions</code>.
          </>
        }
        actions={
          <Link
            href="/sessions/new"
            className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            New session
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="club-vivo-shell rounded-[2rem] border p-8 backdrop-blur">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">No saved sessions yet</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Generate a session pack and save one session to populate this list.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((session) => (
            <article
              key={session.sessionId}
              className="club-vivo-shell rounded-3xl border p-5 backdrop-blur"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {getSessionDisplayLabel(session)}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {session.durationMin} minutes / {session.activityCount} activities
                  </p>
                </div>

                <p className="text-sm text-slate-500">{formatCreatedAt(session.createdAt)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {session.objectiveTags.length > 0 ? (
                  session.objectiveTags.map((tag) => (
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

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/sessions/${session.sessionId}`}
                  className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  View details
                </Link>
                <Link
                  href={buildReuseSessionHref(session)}
                  className="inline-flex rounded-full border border-slate-300 bg-transparent px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
                >
                  Use as starting point
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
