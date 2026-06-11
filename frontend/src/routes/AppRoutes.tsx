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

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/tenants" element={<TenantsPage />} />

          <Route element={<RequireTenant />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/stock-entries" element={<StockEntriesPage />} />
              <Route path="/stock-exits" element={<StockExitsPage />} />
              <Route path="/current-stock" element={<CurrentStockPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}