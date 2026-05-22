import { apiClient } from "./client";

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
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}