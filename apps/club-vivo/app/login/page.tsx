import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-2xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
          Login
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Club Vivo sign-in entry
        </h1>

        <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
          Hosted UI sign-in wiring will be added next. This step only establishes the
          route structure for the Week 12 app shell.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <span className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm text-slate-600">
            Cognito flow pending
          </span>
          <Link
            href="/"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/70"
          >
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
