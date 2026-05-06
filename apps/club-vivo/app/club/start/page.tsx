import Link from "next/link";

export default function ClubStartPage() {
  return (
    <main className="px-6 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-4xl">
        <section className="club-vivo-shell rounded-[2rem] border p-8 backdrop-blur sm:p-12">
          <div className="club-vivo-badge mb-8 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
            Club Vivo
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Start your Club Vivo space
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Start a free club workspace for your team, academy, school, nonprofit, or sports
              organization. Coach planning tools are included, so your club can organize teams,
              equipment, methodology, sessions, and saved coaching work in one shared place.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white/75 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Free club workspace</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Create a home for your club&apos;s coaching work, teams, equipment, methodology,
                  and saved sessions.
                </p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white/75 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Verified setup</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Clubs that want official structure, custom methodology, hands-on setup,
                  coach/admin management, and future advanced features can move into a verified or
                  supported setup.
                </p>
              </article>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/login/start"
                prefetch={false}
                className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
              >
                Start club workspace
              </Link>

              <Link
                href="/login/start"
                prefetch={false}
                className="inline-flex rounded-full border border-slate-300 bg-white/80 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                Use coach workspace
              </Link>
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">
              If your club wants verified setup and hands-on support, contact the Club Vivo
              operator at{" "}
              <a
                href="mailto:ja.cloud.son@gmail.com"
                className="font-medium text-teal-800 transition hover:text-teal-900 hover:underline"
              >
                ja.cloud.son@gmail.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
