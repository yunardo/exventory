import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { TenantsPage } from "../pages/TenantsPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { WarehousesPage } from "../pages/WarehousesPage";
import { ItemsPage } from "@/pages/ItemsPage";
import { StockEntriesPage } from "@/pages/StockEntriesPage";
import { StockExitsPage } from "@/pages/StockExitsPage";
import { CurrentStockPage } from "../pages/CurrentStockPage";
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