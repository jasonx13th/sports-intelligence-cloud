import Link from "next/link";

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
          Club Vivo is the coach-facing SIC workspace for planning sessions and returning to saved
          work.
        </p>

        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">
          Sign in to open the protected coach workspace and start from Home.
        </p>
      </section>
    </main>
  );
}
