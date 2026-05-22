export function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white/10 p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-slate-300">
          Access your Exventory workspace.
        </p>

        <form className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-white/40"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-white/40"
              placeholder="••••••••"
            />
          </div>

          <button
            type="button"
            className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}