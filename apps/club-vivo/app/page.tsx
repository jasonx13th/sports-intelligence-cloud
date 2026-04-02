export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-3xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
          SIC Week 12
        </div>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Club Vivo web scaffold is ready for the first coach-facing slice.
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
          This starter app keeps the Week 12 foundation deliberately small: app router,
          TypeScript, Tailwind, and a clean entry page. Auth, backend integration, and
          session flows are intentionally left for later steps.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Stack
            </h2>
            <p className="mt-2 text-sm text-slate-700">Next.js, React, TypeScript, Tailwind</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Scope
            </h2>
            <p className="mt-2 text-sm text-slate-700">Scaffold only, no auth or API wiring yet</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Next
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              Protected routes and coach flows in later steps
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
