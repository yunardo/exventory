import { tenantApiClient } from "./tenantClient";

export type TenantMeResponse = {
  user: {
    id: number;
    username: string;
    email: string;
  };
  tenant: {
    id: number;
    slug: string;
    name: string;
  };
  membership: {
    role: string;
    is_active: boolean;
  };
  is_member: boolean;
};

export async function getTenantMe() {
  const response = await tenantApiClient.get<TenantMeResponse>("/api/me/");
  return response.data;
}