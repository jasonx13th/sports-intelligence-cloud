import { cookies } from "next/headers";
import Link from "next/link";

import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import {
  QUICK_SESSION_TITLE_HINTS_COOKIE,
  parseQuickSessionTitleHints
} from "../../../lib/quick-session-title-hints";
import {
  SESSION_BUILDER_CONTEXT_HINTS_COOKIE,
  buildBuilderSessionCardTitle,
  parseSessionBuilderContextHints
} from "../../../lib/session-builder-context-hints";
import {
  SESSION_ORIGIN_HINTS_COOKIE,
  getSessionCardTitle,
  getSessionOriginLabel,
  parseSessionOriginHints,
  shouldShowObjectiveTagsForOrigin
} from "../../../lib/session-origin-hints";
import { getSessions } from "../../../lib/session-builder-api";

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function SessionsPage() {
  const { items } = await getSessions();
  const cookieStore = await cookies();
  const sessionOrigins = parseSessionOriginHints(
    cookieStore.get(SESSION_ORIGIN_HINTS_COOKIE)?.value
  );
  const quickSessionTitles = parseQuickSessionTitleHints(
    cookieStore.get(QUICK_SESSION_TITLE_HINTS_COOKIE)?.value
  );
  const sessionBuilderContexts = parseSessionBuilderContextHints(
    cookieStore.get(SESSION_BUILDER_CONTEXT_HINTS_COOKIE)?.value
  );

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Sessions"
        title="Saved sessions"
        description={
          "Open saved sessions, review the key details, and start a new session through Session Builder or the faster Quick Session path."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sessions/new"
              className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              New Session Builder
            </Link>
            <Link
              href="/sessions/quick"
              className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              Quick Session
            </Link>
          </div>
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
          {items.map((session) => {
            const origin = sessionOrigins[session.sessionId];
            const shouldShowObjectiveTags = shouldShowObjectiveTagsForOrigin(origin);
            const quickSessionTitle = origin === "quick_session"
              ? quickSessionTitles[session.sessionId]
              : undefined;
            const builderSessionContext = sessionBuilderContexts[session.sessionId];
            const builderSessionTitle =
              origin === "full_session" || origin === "quick_drill"
                ? buildBuilderSessionCardTitle({
                    buildModeLabel: getSessionOriginLabel(origin),
                    teamName: builderSessionContext?.teamName,
                    ageBand: session.ageBand
                  })
                : null;
            const cardTitle = getSessionCardTitle(
              session,
              origin,
              quickSessionTitle,
              builderSessionTitle
            );

            return (
              <section
                key={session.sessionId}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {cardTitle ? (
                        <h2 className="text-base font-semibold text-slate-900">{cardTitle}</h2>
                      ) : null}
                      {origin ? (
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                          {getSessionOriginLabel(origin)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {session.durationMin} minutes / {session.activityCount} activities
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatCreatedAt(session.createdAt)}</p>

                    {shouldShowObjectiveTags ? (
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
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 lg:mt-0 lg:shrink-0">
                    <Link
                      href={`/sessions/${session.sessionId}`}
                      className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
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
    </div>
  );
}
