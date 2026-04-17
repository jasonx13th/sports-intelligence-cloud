import Link from "next/link";
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-2xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
          KSC Pilot
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          KSC Coach Pilot Access
        </h1>

        <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
          Use SIC Session Builder to create and review training sessions for the KSC pilot.
          Sign in to continue.
        </p>

        <div className="mt-8">
          <Link
            href="/login/start"
            className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Sign in
          </Link>

          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
            If you expected pilot access but cannot continue, contact the KSC pilot operator.
          </p>
        </div>
      </section>
    </main>
  );
}
