import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";

export function DashboardLayout() {
  const navigate = useNavigate();
  const tenantSlug = localStorage.getItem("tenant_slug");

  function handleLogout() {
    logout();
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

        <nav className="mt-4 space-y-1 px-3">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm ${
                isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/warehouses"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm ${
                isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
              }`
            }
          >
            Warehouses
          </NavLink>

          <NavLink
            to="/items"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm ${
                isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
              }`
            }
          >
            Items
          </NavLink>

          <NavLink
            to="/stock-entries"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm ${
                isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
              }`
            }
          >
            Stock Entries
          </NavLink>

          <NavLink
            to="/stock-exits"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm ${
                isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
              }`
            }
          >
            Stock Exits
          </NavLink>

          <NavLink
            to="/current-stock"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm ${
                isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
              }`
            }
          >
            Current Stock
          </NavLink>
        </nav>
      </aside>

      <div className="pl-64">
        <header className="flex h-16 items-center justify-between border-b bg-white px-8">
          <span className="text-sm text-slate-500">SaaS Inventory Platform</span>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Logout
          </button>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}