import Link from "next/link";

export type ReusableSessionSummary = {
  sessionId: string;
  createdAt: string;
  sport: string;
  ageBand: string;
  durationMin: number;
  objectiveTags: string[];
  activityCount: number;
};

export function getSessionDisplayLabel(session: Pick<ReusableSessionSummary, "sport" | "ageBand">) {
  return `${session.sport} / ${session.ageBand}`;
}

export function buildReuseSessionHref(session: ReusableSessionSummary) {
  const params = new URLSearchParams({
    sourceSessionId: session.sessionId,
    sourceLabel: getSessionDisplayLabel(session),
    durationMin: String(session.durationMin)
  });

  if (session.objectiveTags.length > 0) {
    params.set("theme", session.objectiveTags.join(", "));
  }

  return `/sessions/new?${params.toString()}`;
}

type ReuseFromLibraryEntryProps = {
  sourceSessionLabel?: string;
};

export function ReuseFromLibraryEntry({ sourceSessionLabel }: ReuseFromLibraryEntryProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/70 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reuse from library</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Start from a saved session when you want a faster first draft. Week 21 reuse stays
            shallow and only prefills the current form where it is safe.
          </p>
        </div>

        <Link
          href="/sessions"
          className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Open library
        </Link>
      </div>

      {sourceSessionLabel ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-medium text-slate-900">Current starting point</p>
          <p className="mt-2 text-sm text-slate-600">{sourceSessionLabel}</p>
          <Link
            href="/sessions/new"
            className="mt-3 inline-flex text-sm font-medium text-teal-700 transition hover:text-teal-800"
          >
            Clear reuse
          </Link>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No saved session is currently being used as a starting point.
        </p>
      )}
    </article>
  );
}
