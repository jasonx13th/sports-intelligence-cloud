import Link from "next/link";

const ENTRY_HIGHLIGHTS = [
  {
    title: "Quick Session",
    description: "Start with one coach prompt, review the generated session, then save it into the shared session library."
  },
  {
    title: "Session Builder",
    description: "Use the detailed planning flow when you want stronger control over today's focus, duration, team context, and setup."
  },
  {
    title: "Teams and Methodology",
    description: "Keep one shared coach app while using selected team context and the current methodology workspace where available."
  },
  {
    title: "Saved Sessions",
    description: "Return to saved sessions, review details, and export a coach-ready PDF from the same workspace."
  }
];

export default function Home() {
  return (
    <main className="px-6 py-16 sm:py-20">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <section className="club-vivo-shell rounded-[2rem] border p-8 backdrop-blur sm:p-10">
          <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
            SIC / Club Vivo
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                One coach workspace for the current planning flow.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
                Club Vivo is the current coach-facing SIC workspace for fast prompts, deeper session
                planning, team-aware context, methodology guidance, and saved-session follow-through.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login/start"
                  className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
                >
                  Open coach workspace
                </Link>

                <Link
                  href="/login/start?mode=signup"
                  className="inline-flex rounded-full border border-slate-300 bg-white/80 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  Start access
                </Link>
              </div>

              <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">
                Sign in to return to the current coach workspace, or start access through the same
                hosted flow used for the pilot login path.
              </p>
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-white/70 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Current coach workflow</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The current product keeps one shared coach app. Quick Session and Session Builder
                both feed the same saved-session path, while Teams and Methodology support the
                broader planning workflow.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Quick Session
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Session Builder
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Teams
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Methodology
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Saved Sessions
                </span>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ENTRY_HIGHLIGHTS.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
