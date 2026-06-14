import { tenantApiClient } from "../../api/tenantClient";
import {
  type PaginatedResponse,
  unwrapPaginatedResponse,
} from "../../api/pagination";

export type TenantMembership = {
  id: number;
  user: number;
  username: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  is_active: boolean;
  created_at: string;
};

export type UpdateTenantMembershipPayload = {
  id: number;
  role?: "owner" | "admin" | "member" | "viewer";
  is_active?: boolean;
};

export async function getTenantMemberships() {
  const response = await tenantApiClient.get<
    TenantMembership[] | PaginatedResponse<TenantMembership>
  >("/api/tenant-memberships/");

  return unwrapPaginatedResponse(response.data);
}

export async function updateTenantMembership(
  payload: UpdateTenantMembershipPayload
) {
  const { id, ...data } = payload;

  const response = await tenantApiClient.patch<TenantMembership>(
    `/api/tenant-memberships/${id}/`,
    data
  );

  return response.data;
}
