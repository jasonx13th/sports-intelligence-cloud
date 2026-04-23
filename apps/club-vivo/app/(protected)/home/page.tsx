import { cookies } from "next/headers";

import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { HomeSessionStartCard } from "../../../components/coach/HomeSessionStartCard";
import { RecentSessionsPanel } from "../../../components/coach/RecentSessionsPanel";
import {
  QUICK_SESSION_TITLE_HINTS_COOKIE,
  parseQuickSessionTitleHints
} from "../../../lib/quick-session-title-hints";
import {
  SESSION_BUILDER_CONTEXT_HINTS_COOKIE,
  parseSessionBuilderContextHints
} from "../../../lib/session-builder-context-hints";
import { SESSION_ORIGIN_HINTS_COOKIE, parseSessionOriginHints } from "../../../lib/session-origin-hints";
import { getSessions } from "../../../lib/session-builder-api";
import { createQuickSessionAction } from "../sessions/quick-session-actions";

export default async function HomePage() {
  const { items } = await getSessions();
  const recentSessions = items.slice(0, 3);
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
        badge="Home"
        title="Coach workspace"
        description="Use the top workspace navigation to move between Session Builder, Teams, Methodology, equipment, and saved sessions. Start the fastest coach flow right here with Quick Session."
      />

      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">SIC Coach Workspace</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Home is the coach starting point for the current shared workflow. Use Quick Session here
          when you want the fastest prompt-to-plan path, then rely on the top navigation when you
          want to move into detailed planning, team context, methodology, equipment, or saved
          session follow-through.
        </p>
      </section>

      <HomeSessionStartCard createQuickSessionAction={createQuickSessionAction} />

      <RecentSessionsPanel
        sessions={recentSessions}
        showLibraryLink={false}
        showReuseAction={false}
        sessionOrigins={sessionOrigins}
        quickSessionTitles={quickSessionTitles}
        sessionBuilderContexts={sessionBuilderContexts}
      />
    </div>
  );
}
