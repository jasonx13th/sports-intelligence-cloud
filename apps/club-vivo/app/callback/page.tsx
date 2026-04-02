export default function CallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-2xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
          Callback
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Callback handling placeholder
        </h1>

        <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
          Auth callback processing will be implemented in the next step. No token exchange
          or backend call happens on this page yet.
        </p>
      </section>
    </main>
  );
}
