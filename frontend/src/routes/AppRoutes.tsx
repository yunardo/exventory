import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { TenantsPage } from "@/pages/TenantsPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { WarehousesPage } from "@/features/warehouses/WarehousesPage";
import { ItemsPage } from "@/features/items/ItemsPage";
import { StockEntriesPage } from "@/features/stock-entries/StockEntriesPage";
import { StockExitsPage } from "@/features/stock-exits/StockExitsPage";
import { CurrentStockPage } from "@/features/current-stock/CurrentStockPage";
import { RequireTenant } from "./RequireTenant";
import { StockMovementsPage } from "@/features/stock-movements/StockMovementsPage";
import { KardexPage } from "@/features/kardex/KardexPage";
import { InventoryAdjustmentsPage } from "@/features/inventory-adjustments/InventoryAdjustmentsPage";
import { StockTransfersPage } from "@/features/stock-transfers/StockTransfersPage";
import { InventoryValuationPage } from "@/features/inventory-valuation/InventoryValuationPage";
import { AuditLogsPage } from "@/features/audit-logs/AuditLogsPage";
import { RequireRole } from "./RequireRole";
import { TenantMembershipsPage } from "@/features/tenant-memberships/TenantMembershipsPage";
import { AcceptInvitationPage } from "@/features/invitations/AcceptInvitationPage";
import { TenantInvitationsPage } from "@/features/tenant-memberships/TenantInvitationsPage";
import { TenantSettingsPage } from "@/features/tenant-settings/TenantSettingsPage";
import { UFVRatesPage } from "@/features/ufv-rates/UFVRatesPage";
import { UFVRevaluationPreviewPage } from "@/features/ufv-revaluation/UFVRevaluationPreviewPage";
import { UFVRevaluationRunsPage } from "@/features/ufv-revaluation/UFVRevaluationRunsPage";
import { UFVRevaluationRunDetailPage } from "@/features/ufv-revaluation/UFVRevaluationRunDetailPage";
import { StockEntryDocumentsPage } from "@/features/stock-entry-documents/StockEntryDocumentsPage";
import { StockExitDocumentsPage } from "@/features/stock-exit-documents/StockExitDocumentsPage";
import { StockEntryDocumentDetailPage } from "@/features/stock-entry-documents/StockEntryDocumentDetailPage";
import { StockExitDocumentDetailPage } from "@/features/stock-exit-documents/StockExitDocumentDetailPage";
import { DocumentTypesPage } from "@/features/document-types/DocumentTypesPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
          <Route path="/tenants" element={<TenantsPage />} />

          <Route element={<RequireTenant />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/stock-entries" element={<StockEntriesPage />} />
              <Route path="/stock-entry-documents" element={<StockEntryDocumentsPage />} />
              <Route
                path="/stock-entry-documents/:id"
                element={<StockEntryDocumentDetailPage />}
              />
              <Route path="/stock-exits" element={<StockExitsPage />} />
              <Route path="/stock-exit-documents" element={<StockExitDocumentsPage />} />
              <Route
                path="/stock-exit-documents/:id"
                element={<StockExitDocumentDetailPage />}
              />
              <Route path="/stock-transfers" element={<StockTransfersPage />} />
              <Route path="/current-stock" element={<CurrentStockPage />} />
              <Route path="/stock-movements" element={<StockMovementsPage />} />
              <Route path="/kardex" element={<KardexPage />} />
              <Route path="/inventory-valuation" element={<InventoryValuationPage />} />

              <Route element={<RequireRole allowedRoles={["owner", "admin"]} />}>
                <Route path="/tenant-memberships" element={<TenantMembershipsPage />} />
                <Route path="/inventory-adjustments" element={<InventoryAdjustmentsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/tenant-invitations" element={<TenantInvitationsPage />} />
                <Route path="/tenant-settings" element={<TenantSettingsPage />} />
                <Route path="/ufv-rates" element={<UFVRatesPage />} />
                <Route
                  path="/ufv-revaluation"
                  element={<UFVRevaluationPreviewPage />}
                />
                <Route
                  path="/ufv-revaluation-runs"
                  element={<UFVRevaluationRunsPage />}
                />
                <Route
                  path="/ufv-revaluation-runs/:id"
                  element={<UFVRevaluationRunDetailPage />}
                />
              </Route>
              <Route path="/document-types" element={<DocumentTypesPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}