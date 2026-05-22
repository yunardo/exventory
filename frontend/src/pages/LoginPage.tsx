import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const data = await login({ username, password });

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      navigate("/tenants", { replace: true });
    } catch {
      setError("Invalid username or password.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white/10 p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Sign in</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
            placeholder="Username"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
            placeholder="Password"
          />

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}