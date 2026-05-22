import axios from "axios";

function getTenantBaseUrl() {
  const tenantSlug = localStorage.getItem("tenant_slug");

  if (!tenantSlug) {
    throw new Error("Tenant not selected");
  }

  return `https://${tenantSlug}.exventory.com`;
}

export const tenantApiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

tenantApiClient.interceptors.request.use((config) => {
  config.baseURL = getTenantBaseUrl();

  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});