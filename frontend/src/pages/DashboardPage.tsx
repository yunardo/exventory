import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, type MeResponse } from "../api/me";
import { logout } from "../api/auth";
import { getTenantMe, type TenantMeResponse } from "../api/tenantMe";

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<MeResponse | null>(null);
  const tenantSlug = localStorage.getItem("tenant_slug");
  const [tenantUser, setTenantUser] = useState<TenantMeResponse | null>(null);
  const [tenantError, setTenantError] = useState("");

  useEffect(() => {
    getMe().then(setUser).catch(() => {
      logout();
      navigate("/login", { replace: true });
    });
    getTenantMe()
      .then(setTenantUser)
      .catch(() => setTenantError("Could not load tenant context."));
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Exventory</h1>

        <button
          onClick={handleLogout}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Logout
        </button>
      </header>

      <section className="p-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="mt-2 text-slate-600">
          Welcome, {user?.username ?? "loading..."}.
        </p>
        <p className="mt-2 text-slate-600">
          Current workspace: {tenantSlug ?? "none selected"}
        </p>
        <div className="mt-6 rounded-xl bg-white p-4 shadow">
          <h3 className="font-semibold text-slate-900">Tenant context</h3>

          {tenantError ? (
            <p className="mt-2 text-red-600">{tenantError}</p>
          ) : (
            <p className="mt-2 text-slate-600">
              Tenant user: {tenantUser?.username ?? "loading..."}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}