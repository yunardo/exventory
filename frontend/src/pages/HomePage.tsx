import { useEffect, useState } from "react";
import { apiClient } from "../api/client";

export function HomePage() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    apiClient
      .get("/health/")
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <section className="max-w-xl text-center">
        <h1 className="text-4xl font-bold">Exventory</h1>
        <p className="mt-4 text-slate-300">
          Powered by Examine S.R.L.
        </p>
        <p className="mt-6 rounded-xl bg-white/10 px-4 py-3">
          API status: <strong>{status}</strong>
        </p>
      </section>
    </main>
  );
}