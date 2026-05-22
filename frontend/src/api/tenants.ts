import { apiClient } from "./client";

export type Tenant = {
  id: number;
  name: string;
  slug: string;
  role: string;
};

export async function getTenants() {
  const response = await apiClient.get<Tenant[]>("/api/auth/tenants/");
  return response.data;
}