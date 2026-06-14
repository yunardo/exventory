const TENANT_SLUG_KEY = "tenant_slug";
const TENANT_ROLE_KEY = "tenant_role";

export function getTenantSlug() {
  return localStorage.getItem(TENANT_SLUG_KEY);
}

export function setTenantSlug(slug: string) {
  localStorage.setItem(TENANT_SLUG_KEY, slug);
}

export function clearTenantSlug() {
  localStorage.removeItem(TENANT_SLUG_KEY);
}

export function getTenantRole() {
  return localStorage.getItem(TENANT_ROLE_KEY);
}

export function setTenantRole(role: string) {
  localStorage.setItem(TENANT_ROLE_KEY, role);
}

export function clearTenantRole() {
  localStorage.removeItem(TENANT_ROLE_KEY);
}