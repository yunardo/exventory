import axios from "axios";
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from "./token";

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

  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

tenantApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh/`,
          {
            refresh: getRefreshToken(),
          }
        );

        const newAccess = response.data.access;
        setAccessToken(newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return tenantApiClient(originalRequest);
      } catch {
        clearTokens();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);