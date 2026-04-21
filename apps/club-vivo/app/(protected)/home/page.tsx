import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { HomeSessionStartCard } from "../../../components/coach/HomeSessionStartCard";
import { RecentSessionsPanel } from "../../../components/coach/RecentSessionsPanel";
import { getSessions } from "../../../lib/session-builder-api";
import { createQuickSessionAction } from "../sessions/quick-session-actions";

export default async function HomePage() {
  const { items } = await getSessions();
  const recentSessions = items.slice(0, 3);

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Home"
        title="Welcome back"
        description="Use Quick session for the fast prompt path, or move into Session Builder when you want the more detailed setup flow."
      />

      <HomeSessionStartCard createQuickSessionAction={createQuickSessionAction} />

      <RecentSessionsPanel
        sessions={recentSessions}
        showLibraryLink={false}
        showReuseAction={false}
      />
    </div>
  );
}
