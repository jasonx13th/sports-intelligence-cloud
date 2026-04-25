import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { getCurrentUser } from "../../../lib/get-current-user";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Dashboard"
        title="Protected dashboard placeholder"
        description={
          <>
            This secondary page is still server-rendered from the current <code>GET /me</code>
            response.
          </>
        }
      />

      <section className="club-vivo-shell rounded-[2rem] border p-8 backdrop-blur">
        <dl className="grid gap-4 sm:grid-cols-2">
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
    </div>
  );
}
