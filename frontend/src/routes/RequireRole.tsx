import { Navigate, Outlet } from "react-router-dom";
import { useTenant } from "../context/TenantContext";

type RequireRoleProps = {
  allowedRoles: string[];
};

export function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { tenantRole } = useTenant();

  if (!tenantRole || !allowedRoles.includes(tenantRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}