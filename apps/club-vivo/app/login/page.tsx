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
          Coach access starts here
        </h1>

        <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
          {isLoggedOut
            ? "You signed out of the coach workspace. Sign back in or create your account to keep planning."
            : "Sign in or sign up to open the Club Vivo coach workspace with the current hosted coach flow."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/login/start"
            className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            Sign in
          </a>

          <a
            href="/login/start?mode=signup"
            className="inline-flex rounded-full border border-slate-300 bg-white/80 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Sign up
          </a>
        </div>

        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
          Sign in opens the current hosted auth flow right away. Sign up opens the hosted signup
          flow and keeps the same callback and Home landing behavior after auth completes.
        </p>

        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
          If you expected coach access but cannot continue, contact your Club Vivo pilot operator.
        </p>
      </section>
    </main>
  );
}
