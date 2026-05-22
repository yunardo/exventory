import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTenants, type Tenant } from "../api/tenants";

export function TenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getTenants()
      .then(setTenants)
      .catch(() => setError("Could not load workspaces."));
  }, []);

  function selectTenant(slug: string) {
    localStorage.setItem("tenant_slug", slug);
    navigate("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-2xl font-bold text-slate-900">Select workspace</h1>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {tenants.map((tenant) => (
          <button
            key={tenant.id}
            onClick={() => selectTenant(tenant.slug)}
            className="rounded-2xl bg-white p-6 text-left shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {tenant.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {tenant.slug}.exventory.com
            </p>
            <p className="mt-3 text-xs font-semibold uppercase text-slate-400">
              {tenant.role}
            </p>
          </button>
        ))}
      </div>
    </main>
  );
}