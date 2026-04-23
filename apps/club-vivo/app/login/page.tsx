import Link from "next/link";

function parseSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ loggedOut?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isLoggedOut = parseSearchParam(resolvedSearchParams?.loggedOut) === "1";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-2xl rounded-[2rem] border p-8 backdrop-blur">
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

        <p className="mt-6 max-w-xl text-sm leading-6 text-slate-600">
          Sign in opens the current hosted auth flow. Starting access uses the same path and lands
          in the same coach workspace after auth completes.
        </p>

        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
          If you expected access but cannot continue, contact your Club Vivo pilot operator.
        </p>
      </section>
    </main>
  );
}
