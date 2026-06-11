const TENANT_SLUG_KEY = "tenant_slug";

export function getTenantSlug() {
  return localStorage.getItem(TENANT_SLUG_KEY);
}

export function setTenantSlug(slug: string) {
  localStorage.setItem(TENANT_SLUG_KEY, slug);
}

export function clearTenantSlug() {
  localStorage.removeItem(TENANT_SLUG_KEY);
}