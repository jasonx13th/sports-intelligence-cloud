import Link from "next/link";

import { SessionPackView } from "../../../components/coach/SessionPackView";
import { MOCK_COACH_LITE_SESSION_PACK } from "./mock-session-pack";

export default function CoachLitePreviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-7xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
              Local Preview
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Coach Lite Session Pack Preview
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              This standalone page renders typed mock Coach Lite data only. It does not call the
              API and does not affect the current Session Builder generation or save flow.
            </p>
          </div>

          <Link
            href="/sessions"
            className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Back to sessions
          </Link>
        </div>

        <div className="mt-8">
          <SessionPackView pack={MOCK_COACH_LITE_SESSION_PACK} />
        </div>
      </section>
    </main>
  );
}
