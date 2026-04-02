export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-3xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
          Dashboard
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Protected dashboard placeholder
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          This page is behind the coarse Week 12 session-cookie check. Current-user
          hydration and backend integration will be added in the next step.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
          Route status: protected by middleware when the <code>sic_access_token</code>{" "}
          cookie is absent.
        </div>
      </section>
    </main>
  );
}
