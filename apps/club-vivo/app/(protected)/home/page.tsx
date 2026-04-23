import { cookies } from "next/headers";
import Link from "next/link";

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

const WORKSPACE_LAUNCHERS = [
  {
    href: "/sessions/quick",
    title: "Quick Session",
    description: "Start from one prompt, review the result, and save it into the shared session library.",
    cta: "Open Quick Session"
  },
  {
    href: "/sessions/new",
    title: "Session Builder",
    description: "Use the detailed planning flow when you want more control over today's setup and context.",
    cta: "Open Session Builder"
  },
  {
    href: "/teams",
    title: "Teams",
    description: "Manage teams and the current selected team context used across the coach workspace.",
    cta: "Open Teams"
  },
  {
    href: "/methodology",
    title: "Methodology",
    description: "Review the current methodology workspace and, if you have access, update or publish guidance.",
    cta: "Open Methodology"
  },
  {
    href: "/sessions",
    title: "Sessions",
    description: "Return to saved sessions, review detail pages, and export coach-ready PDFs.",
    cta: "Open Sessions"
  }
] as const;

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
        description="Start a quick prompt, move into the detailed Session Builder flow, manage team context, review methodology, or jump back into saved sessions from one shared workspace."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sessions/quick"
              className="inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
            >
              Quick Session
            </Link>
            <Link
              href="/sessions/new"
              className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              Session Builder
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {WORKSPACE_LAUNCHERS.map((item) => (
          <article
            key={item.href}
            className="rounded-3xl border border-slate-200 bg-white/70 p-5"
          >
            <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            <Link
              href={item.href}
              className="mt-5 inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {item.cta}
            </Link>
          </article>
        ))}
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
