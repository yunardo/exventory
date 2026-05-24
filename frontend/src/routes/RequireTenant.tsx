import { Navigate, Outlet } from "react-router-dom";

export function RequireTenant() {
  const tenantSlug = localStorage.getItem("tenant_slug");

  if (!tenantSlug) {
    return <Navigate to="/tenants" replace />;
  }

  return <Outlet />;
}