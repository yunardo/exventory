import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { logout } from "../api/auth";
import { useTenant } from "../context/TenantContext";
import { canManageAdjustments, canViewAuditLogs } from "@/auth/roles";

export function DashboardLayout() {
  const { tenantSlug, tenantRole, clearTenant } = useTenant();

  const navGroups = [
    {
      title: "Overview",
      links: [{ label: "Dashboard", to: "/dashboard" }],
    },
    {
      title: "Inventory",
      links: [
        { label: "Current Stock", to: "/current-stock" },
        { label: "Stock Movements", to: "/stock-movements" },
        { label: "Stock Entries", to: "/stock-entries" },
        { label: "Stock Exits", to: "/stock-exits" },
        { label: "Stock Transfers", to: "/stock-transfers" },
        ...(canManageAdjustments(tenantRole)
          ? [{ label: "Inventory Adjustments", to: "/inventory-adjustments" }]
          : []),
        { label: "Kardex", to: "/kardex" },
        { label: "Inventory Valuation", to: "/inventory-valuation" },
      ],
    },
    {
      title: "Catalog",
      links: [
        { label: "Warehouses", to: "/warehouses" },
        { label: "Items", to: "/items" },
      ],
    },
    ...(canViewAuditLogs(tenantRole)
      ? [
          {
            title: "System",
            links: [{ label: "Audit Logs", to: "/audit-logs" }],
          },
        ]
      : []),
  ];
  const navigate = useNavigate();

  useEffect(() => {
    if (!tenantSlug) {
      navigate("/tenants", { replace: true });
    }
  }, [tenantSlug, navigate]);

  function handleLogout() {
    logout();
    clearTenant();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-950 text-white">
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold">Exventory</h1>
          <p className="mt-1 text-sm text-slate-400">
            {tenantSlug ?? "No workspace"}
          </p>
        </div>

        <nav className="mt-4 space-y-6 px-3">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-sm ${
                        isActive
                          ? "bg-white text-slate-950"
                          : "text-slate-300 hover:bg-white/10"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="pl-64">
        <header className="flex h-16 items-center justify-between border-b bg-white px-8">
          <span className="text-sm text-slate-500">
            SaaS Inventory Platform by Examine S.R.L.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/tenants")}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Change workspace
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}