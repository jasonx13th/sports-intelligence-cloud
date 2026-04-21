import Link from "next/link";

import {
  buildReuseSessionHref,
  getSessionDisplayLabel,
  type ReusableSessionSummary
} from "./ReuseFromLibraryEntry";

type RecentSessionsPanelProps = {
  sessions: ReusableSessionSummary[];
  activeSourceSessionId?: string;
  showLibraryLink?: boolean;
  showReuseAction?: boolean;
};

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function RecentSessionsPanel({
  sessions,
  activeSourceSessionId,
  showLibraryLink = true,
  showReuseAction = true
}: RecentSessionsPanelProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/70 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent sessions</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Review your latest saved sessions and open any one for full detail.
          </p>
        </div>

        {showLibraryLink ? (
          <Link
            href="/sessions"
            className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            View library
          </Link>
        ) : null}
      </div>

      {sessions.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
          <p className="text-sm leading-6 text-slate-600">
            Save a generated session to see recent coach workspace reuse options here.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {sessions.map((session) => {
            const isActiveSource = session.sessionId === activeSourceSessionId;

            return (
              <section
                key={session.sessionId}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {getSessionDisplayLabel(session)}
                      </h3>

                      {isActiveSource ? (
                        <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                          Current source
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {session.durationMin} minutes / {session.activityCount} activities
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatCreatedAt(session.createdAt)}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {session.objectiveTags.length > 0 ? (
                        session.objectiveTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No objective tags</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {showReuseAction ? (
                      <Link
                        href={buildReuseSessionHref(session)}
                        className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                      >
                        Reuse here
                      </Link>
                    ) : null}
                    <Link
                      href={`/sessions/${session.sessionId}`}
                      className="inline-flex rounded-full border border-slate-300 bg-transparent px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/70"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}
