import { apiClient } from "./client";

export type MeResponse = {
  id: number;
  username: string;
  email: string;
};

export async function getMe() {
  const response = await apiClient.get<MeResponse>("/api/auth/me/");
  return response.data;
}