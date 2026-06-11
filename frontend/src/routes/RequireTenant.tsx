import { Navigate, Outlet } from "react-router-dom";
import { useTenant } from "../context/TenantContext";

export function RequireTenant() {
  const { tenantSlug } = useTenant();

  if (!tenantSlug) {
    return <Navigate to="/tenants" replace />;
  }

  return <Outlet />;
}