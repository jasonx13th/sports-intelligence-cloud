import Link from "next/link";

export default function Home() {
  return (
    <main className="px-6 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-4xl">
        <section className="club-vivo-shell rounded-[2rem] border p-8 backdrop-blur sm:p-12">
          <div className="club-vivo-badge mb-8 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
            SIC / Club Vivo
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Club Vivo
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              The SIC Coach Workspace inside Club Vivo helps coaches plan Quick Activities,
              build sessions, manage teams and equipment, and return to saved work in one place.
              Club and organization setup is coming as the admin side of the same platform.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/login/start"
                prefetch={false}
                className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
              >
                Coach workspace
              </Link>

              <Link
                href="/login/start?mode=signup"
                prefetch={false}
                className="inline-flex rounded-full border border-slate-300 bg-white/80 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                Club / organization setup
              </Link>
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">
              These start paths capture onboarding intent only. Real workspace access continues
              to come from the secure Club Vivo account and club permissions behind sign-in.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
