import { apiClient } from "./client";
import { clearTokens } from "./token";
import { clearTenantSlug } from "./tenantStorage";

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
};

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<LoginResponse>(
    "/api/auth/login/",
    payload
  );

  return response.data;
}

export function logout() {
  clearTokens();
  clearTenantSlug();
}

export type RefreshResponse = {
  access: string;
};

export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh_token");

  if (!refresh) {
    throw new Error("No refresh token");
  }

  const response = await apiClient.post<RefreshResponse>("/api/auth/refresh/", {
    refresh,
  });

  return response.data;
}