import { tenantApiClient } from "./tenantClient";

export type TenantMeResponse = {
  id: number;
  username: string;
  email: string;
};

export async function getTenantMe() {
  const response = await tenantApiClient.get<TenantMeResponse>("/api/me/");
  return response.data;
}