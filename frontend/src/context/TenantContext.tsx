import { createContext, useContext, useMemo, useState } from "react";
import {
  clearTenantSlug,
  getTenantSlug,
  setTenantSlug,
} from "../api/tenantStorage";

type TenantContextValue = {
  tenantSlug: string | null;
  selectTenant: (slug: string) => void;
  clearTenant: () => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlugState] = useState<string | null>(() =>
    getTenantSlug()
  );

  const value = useMemo<TenantContextValue>(
    () => ({
      tenantSlug,
      selectTenant: (slug: string) => {
        setTenantSlug(slug);
        setTenantSlugState(slug);
      },
      clearTenant: () => {
        clearTenantSlug();
        setTenantSlugState(null);
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