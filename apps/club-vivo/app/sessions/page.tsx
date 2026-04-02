import Link from "next/link";

import { getSessions } from "../../lib/session-builder-api";

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function SessionsPage() {
  const { items } = await getSessions();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-5xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
              Sessions
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Saved sessions
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              This page shows the current Week 12 session summaries returned by{" "}
              <code>GET /sessions</code>.
            </p>
          </div>

          <Link
            href="/sessions/new"
            className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            New session
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">No saved sessions yet</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Generate a session pack and save one session to populate this list.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {items.map((session) => (
              <Link
                key={session.sessionId}
                href={`/sessions/${session.sessionId}`}
                className="rounded-3xl border border-slate-200 bg-white/70 p-5 transition hover:bg-white"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {session.sport} · {session.ageBand}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {session.durationMin} minutes · {session.activityCount} activities
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
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
