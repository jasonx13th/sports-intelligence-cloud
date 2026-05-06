import { cookies } from "next/headers";

import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { HomeSessionStartCard } from "../../../components/coach/HomeSessionStartCard";
import { RecentSessionsPanel } from "../../../components/coach/RecentSessionsPanel";
import { getCurrentUser } from "../../../lib/get-current-user";
import {
  QUICK_SESSION_TITLE_HINTS_COOKIE,
  parseQuickSessionTitleHints
} from "../../../lib/quick-session-title-hints";
import {
  SESSION_BUILDER_CONTEXT_HINTS_COOKIE,
  parseSessionBuilderContextHints
} from "../../../lib/session-builder-context-hints";
import {
  SESSION_ORIGIN_HINTS_COOKIE,
  parseSessionOriginHints
} from "../../../lib/session-origin-hints";
import { getSessions } from "../../../lib/session-builder-api";
import { getWorkspaceCookieName } from "../../../lib/workspace-local-cookies";
import { createQuickSessionAction } from "../sessions/quick-session-actions";

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  const { items } = await getSessions();
  const recentSessions = items.slice(0, 3);
  const cookieStore = await cookies();
  const sessionOriginHintsCookieName = getWorkspaceCookieName(
    SESSION_ORIGIN_HINTS_COOKIE,
    currentUser
  );
  const quickSessionTitleHintsCookieName = getWorkspaceCookieName(
    QUICK_SESSION_TITLE_HINTS_COOKIE,
    currentUser
  );
  const sessionBuilderContextHintsCookieName = getWorkspaceCookieName(
    SESSION_BUILDER_CONTEXT_HINTS_COOKIE,
    currentUser
  );
  const sessionOrigins = parseSessionOriginHints(
    cookieStore.get(sessionOriginHintsCookieName)?.value
  );
  const quickSessionTitles = parseQuickSessionTitleHints(
    cookieStore.get(quickSessionTitleHintsCookieName)?.value
  );
  const sessionBuilderContexts = parseSessionBuilderContextHints(
    cookieStore.get(sessionBuilderContextHintsCookieName)?.value
  );

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Home"
        title="Coach workspace"
        description="Brainstorm fast, turn the idea into a session, or use the top navigation when you want to go deeper on planning, teams, methodology, equipment, and saved sessions."
      />

      <HomeSessionStartCard
        createQuickSessionAction={createQuickSessionAction}
        showPromptHelper={false}
      />

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
