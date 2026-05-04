import Link from "next/link";

export default function Home() {
  return (
    <main className="px-6 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-4xl">
        <section className="club-vivo-shell rounded-[2rem] border p-8 backdrop-blur sm:p-12">
          <div className="club-vivo-badge mb-8 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
            Club Vivo
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Where sports organizations start.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Club Vivo helps coaches and sports organizations plan sessions, organize teams,
              manage equipment, shape methodology, and keep coaching work in one clean place.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white/75 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Coach</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Create game-like sessions, manage your teams, and keep your practice ideas
                  organized.
                </p>
                <Link
                  href="/login/start?mode=signup"
                  prefetch={false}
                  className="mt-5 inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
                >
                  Start coach workspace
                </Link>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white/75 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Club</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Take control of your sports organization, coaches, teams, methodology, and
                  session planning.
                </p>
                <Link
                  href="/club/start"
                  prefetch={false}
                  className="mt-5 inline-flex rounded-full border border-slate-300 bg-white/80 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  Start club setup
                </Link>
              </article>
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login/start"
                prefetch={false}
                className="font-medium text-teal-800 transition hover:text-teal-900 hover:underline"
              >
                Sign in
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
