import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, type MeResponse } from "../api/me";
import { logout } from "../api/auth";
import { getTenantMe, type TenantMeResponse } from "../api/tenantMe";

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<MeResponse | null>(null);
  const tenantSlug = localStorage.getItem("tenant_slug");
  const [tenantError, setTenantError] = useState("");
  const [tenantContext, setTenantContext] = useState<TenantMeResponse | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => {
      logout();
      navigate("/login", { replace: true });
    });
    getTenantMe()
      .then(setTenantContext)
      .catch(() => setTenantError("Could not load tenant context."));
  }, [navigate]);

  return (
    <main className="min-h-screen bg-slate-100">

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
            <div className="mt-2 text-slate-600">
              <p>Tenant: {tenantContext?.tenant.name ?? "loading..."}</p>
              <p>User: {tenantContext?.user.username ?? "loading..."}</p>
              <p>Role: {tenantContext?.membership.role ?? "loading..."}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}