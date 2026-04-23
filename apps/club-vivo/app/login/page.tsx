import Link from "next/link";

function parseSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const LOGIN_PATH_HIGHLIGHTS = [
  "Quick Session for the fastest prompt-to-review flow",
  "Session Builder for the detailed planning path",
  "Teams and Methodology inside the same shared coach workspace",
  "Saved sessions, detail views, and PDF export continuity"
];

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ loggedOut?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isLoggedOut = parseSearchParam(resolvedSearchParams?.loggedOut) === "1";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-3xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
          SIC / Club Vivo
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Open the coach workspace
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          {isLoggedOut
            ? "You signed out of the coach workspace. Sign back in or start access again to continue planning."
            : "Sign in or start access to enter the current Club Vivo coach workspace through the hosted auth flow."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login/start"
            className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            Sign in
          </Link>

          <Link
            href="/login/start?mode=signup"
            className="inline-flex rounded-full border border-slate-300 bg-white/80 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Start access
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
            <h2 className="text-lg font-semibold text-slate-900">What opens after login</h2>
            <div className="mt-4 grid gap-3">
              {LOGIN_PATH_HIGHLIGHTS.map((item) => (
                <p
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Current access path</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sign in opens the current hosted auth flow right away. Starting access uses the same
              callback and lands in the same Home workspace after auth completes.
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              If you expected coach access but cannot continue, contact your Club Vivo pilot
              operator.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
