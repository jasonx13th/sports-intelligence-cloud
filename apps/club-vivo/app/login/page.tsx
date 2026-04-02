import Link from "next/link";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<{
    loggedOut?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (resolvedSearchParams?.loggedOut !== "1") {
    redirect("/login/start");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-2xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
          Logged out
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          You have been signed out
        </h1>

        <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
          Your local Club Vivo session cookies were cleared. Start a new sign-in flow when
          you are ready.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login/start"
            className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Sign in again
          </Link>

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
