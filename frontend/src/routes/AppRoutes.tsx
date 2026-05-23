import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { TenantsPage } from "../pages/TenantsPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { WarehousesPage } from "../pages/WarehousesPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/tenants" element={<TenantsPage />} />

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}