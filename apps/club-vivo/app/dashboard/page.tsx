import { getCurrentUser } from "../../lib/get-current-user";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

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
          This page is server-rendered from the current <code>GET /me</code> response.
        </p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">ok</dt>
            <dd className="mt-2 text-sm text-slate-800">{String(currentUser.ok)}</dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">userId</dt>
            <dd className="mt-2 break-all text-sm text-slate-800">{currentUser.userId}</dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">tenantId</dt>
            <dd className="mt-2 break-all text-sm text-slate-800">{currentUser.tenantId}</dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">role</dt>
            <dd className="mt-2 text-sm text-slate-800">{currentUser.role}</dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">tier</dt>
            <dd className="mt-2 text-sm text-slate-800">{currentUser.tier}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
