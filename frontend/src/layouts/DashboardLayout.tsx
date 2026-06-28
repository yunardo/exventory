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
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();

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
      title: t("sidebar.overview"),
      links: [
        { label: t("sidebar.dashboard"), to: "/dashboard", icon: Home },
      ],
    },
    {
      title: t("sidebar.inventory"),
      links: [
        { label: t("sidebar.currentStock"), to: "/current-stock", icon: Boxes },
        { label: t("sidebar.stockMovements"), to: "/stock-movements", icon: FileClock },
        { label: t("sidebar.entryDocuments"), to: "/stock-entry-documents", icon: PackagePlus },
        { label: t("sidebar.exitDocuments"), to: "/stock-exit-documents", icon: PackageMinus },
        { label: t("sidebar.stockTransfers"), to: "/stock-transfers", icon: Repeat },
        ...(canManageAdjustments(tenantRole)
          ? [{ label: t("sidebar.inventoryAdjustments"), to: "/inventory-adjustments", icon: ClipboardList }]
          : []),
        { label: t("sidebar.kardex"), to: "/kardex", icon: FileBarChart },
        { label: t("sidebar.inventoryValuation"), to: "/inventory-valuation", icon: BarChart3 },
      ],
    },
    {
      title: t("sidebar.catalog"),
      links: [
        { label: t("sidebar.warehouses"), to: "/warehouses", icon: Warehouse },
        { label: t("sidebar.items"), to: "/items", icon: Package },
      ],
    },
    {
      title: t("sidebar.financial"),
      links: [
        { label: t("sidebar.ufvRates"), to: "/ufv-rates", icon: Calculator },
        { label: t("sidebar.ufvRevaluation"), to: "/ufv-revaluation", icon: TrendingUp },
        { label: t("sidebar.ufvRuns"), to: "/ufv-revaluation-runs", icon: History },
      ],
    },
    {
      title: t("sidebar.settings"),
      links: [
        { label: t("sidebar.tenantUsers"), to: "/tenant-memberships", icon: Users },
        { label: t("sidebar.invitations"), to: "/tenant-invitations", icon: Mail },
        { label: t("sidebar.companySettings"), to: "/tenant-settings", icon: Settings },
        { label: t("sidebar.documentTypes"), to: "/document-types", icon: FileText },
        ...(canViewAuditLogs(tenantRole)
          ? [{ label: t("sidebar.auditLogs"), to: "/audit-logs", icon: FileClock }]
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
            {t("app.description")}
          </span>

          <div className="flex items-center gap-2">
            <select
              value={i18n.language}
              onChange={(event) => i18n.changeLanguage(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="qu-BO">Quechua</option>
            </select>

            <button
              onClick={() => navigate("/tenants")}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t("layout.changeWorkspace")}
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              {t("layout.logout")}
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
