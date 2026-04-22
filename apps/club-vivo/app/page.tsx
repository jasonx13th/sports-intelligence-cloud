export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-3xl rounded-[2rem] border p-8 backdrop-blur sm:p-10">
        <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
          SIC / Club Vivo
        </div>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Coach planning starts here.
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
          Club Vivo is the coach-facing SIC workspace for planning sessions, returning to saved
          work, and getting straight into the day.
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

        <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">
          Sign in to return to your coach workspace, or sign up to start planning with the current
          Club Vivo coach flow.
        </p>
      </section>
    </main>
  );
}
