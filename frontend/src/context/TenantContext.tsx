import { createContext, useContext, useMemo, useState } from "react";
import {
  clearTenantSlug,
  getTenantSlug,
  setTenantSlug,
  getTenantRole,
  setTenantRole,
  clearTenantRole,
} from "../api/tenantStorage";

type TenantContextValue = {
  tenantSlug: string | null;
  tenantRole: string | null;
  selectTenant: (slug: string, role: string) => void;
  clearTenant: () => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlugState] = useState<string | null>(() =>
    getTenantSlug()
  );
  const [tenantRole, setTenantRoleState] = useState<string | null>(() =>
    getTenantRole()
  );

  const value = useMemo<TenantContextValue>(
    () => ({
      tenantSlug,
      tenantRole,
      selectTenant: (slug: string, role: string) => {
        setTenantSlug(slug);
        setTenantRole(role);
        setTenantSlugState(slug);
        setTenantRoleState(role);
      },
      clearTenant: () => {
        clearTenantSlug();
        clearTenantRole();
        setTenantSlugState(null);
        setTenantRoleState(null);
      },
    }),
    [tenantSlug]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }

  return context;
}