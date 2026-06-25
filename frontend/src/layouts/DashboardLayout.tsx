import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { useTenant } from "../context/TenantContext";
import {
  canManageAdjustments,
  canViewAuditLogs,
} from "../auth/roles";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileBarChart,
  FileClock,
  Home,
  Package,
  PackageMinus,
  PackagePlus,
  Repeat,
  Settings,
  Users,
  Warehouse,
  Mail,
  Calculator,
  TrendingUp,
  History,
} from "lucide-react";

type NavLinkItem = {
  label: string;
  to: string;
  icon: React.ElementType;
};

type NavGroup = {
  title: string;
  links: NavLinkItem[];
};

export function DashboardLayout() {
  const navigate = useNavigate();
  const { tenantSlug, tenantRole, clearTenant } = useTenant();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

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

  function toggleGroup(title: string) {
    setCollapsedGroups((current) => ({
      ...current,
      [title]: !current[title],
    }));
  }

  const navGroups: NavGroup[] = [
    {
      title: "Overview",
      links: [{ label: "Dashboard", to: "/dashboard", icon: Home }],
    },
    {
      title: "Inventory",
      links: [
        { label: "Current Stock", to: "/current-stock", icon: Boxes },
        { label: "Stock Movements", to: "/stock-movements", icon: FileClock },
        // { label: "Stock Entries", to: "/stock-entries", icon: PackagePlus },
        // { label: "Stock Exits", to: "/stock-exits", icon: PackageMinus },
        { label: "Entry Documents", to: "/stock-entry-documents", icon: PackagePlus },
        { label: "Exit Documents", to: "/stock-exit-documents", icon: PackageMinus },
        { label: "Stock Transfers", to: "/stock-transfers", icon: Repeat },
        ...(canManageAdjustments(tenantRole)
          ? [{ label: "Inventory Adjustments", to: "/inventory-adjustments", icon: ClipboardList }]
          : []),
        { label: "Kardex", to: "/kardex", icon: FileBarChart },
        { label: "Inventory Valuation", to: "/inventory-valuation", icon: BarChart3 },
      ],
    },
    {
      title: "Catalog",
      links: [
        { label: "Warehouses", to: "/warehouses", icon: Warehouse },
        { label: "Items", to: "/items", icon: Package },
      ],
    },
    {
      title: "Financial",
      links: [
        { label: "UFV Rates", to: "/ufv-rates", icon: Calculator },
        { label: "UFV Revaluation", to: "/ufv-revaluation", icon: TrendingUp },
        {
          label: "UFV Runs",
          to: "/ufv-revaluation-runs",
          icon: History,
        }
      ],
    },
    {
      title: "Settings",
      links: [
        { label: "Tenant Users", to: "/tenant-memberships", icon: Users },
        { label: "Invitations", to: "/tenant-invitations", icon: Mail },
        { label: "Company Settings", to: "/tenant-settings", icon: Settings },
        ...(canViewAuditLogs(tenantRole)
          ? [{ label: "Audit Logs", to: "/audit-logs", icon: FileClock },]
          : []),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 flex flex-col bg-slate-950 text-white transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-bold">Exventory</h1>
              <p className="mt-1 max-w-40 truncate text-sm text-slate-400">
                {tenantSlug ?? "No workspace"}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
            title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
          >
            {sidebarCollapsed ? "☰" : "‹"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-4">
            {navGroups.map((group) => {
              const isGroupCollapsed = collapsedGroups[group.title];

              return (
                <div key={group.title}>
                  {!sidebarCollapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      className="mb-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-white/5"
                    >
                      <span>{group.title}</span>
                      <span>{isGroupCollapsed ? "+" : "−"}</span>
                    </button>
                  )}

                  {(!isGroupCollapsed || sidebarCollapsed) && (
                    <div className="space-y-1">
                      {group.links.map((link) => {
                        const Icon = link.icon;

                        return (
                          <NavLink
                            key={link.to}
                            to={link.to}
                            title={sidebarCollapsed ? link.label : undefined}
                            className={({ isActive }) =>
                              `flex items-center rounded-xl px-4 py-3 text-sm ${
                                isActive
                                  ? "bg-white text-slate-950"
                                  : "text-slate-300 hover:bg-white/10"
                              } ${sidebarCollapsed ? "justify-center" : "gap-3"}`
                            }
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!sidebarCollapsed && <span>{link.label}</span>}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </aside>

      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "pl-20" : "pl-64"
        }`}
      >
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-8">
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
