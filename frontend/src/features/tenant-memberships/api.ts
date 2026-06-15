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

export type TenantInvitation = {
  id: number;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  token: string;
  invited_by: number | null;
  invited_by_username: string | null;
  accepted_at: string | null;
  expires_at: string;
  is_active: boolean;
  is_expired: boolean;
  created_at: string;
};

export type CreateTenantInvitationPayload = {
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
};

export async function getTenantInvitations() {
  const response = await tenantApiClient.get<
    TenantInvitation[] | PaginatedResponse<TenantInvitation>
  >("/api/tenant-invitations/");

  return unwrapPaginatedResponse(response.data);
}

export async function createTenantInvitation(
  payload: CreateTenantInvitationPayload
) {
  const response = await tenantApiClient.post<TenantInvitation>(
    "/api/tenant-invitations/",
    payload
  );

  return response.data;
}

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

export async function revokeInvitation(id: number) {
  const response = await tenantApiClient.post(
    `/api/tenant-invitations/${id}/revoke/`
  );

  return response.data;
}

export async function resendInvitation(id: number) {
  const response = await tenantApiClient.post(
    `/api/tenant-invitations/${id}/resend/`
  );

  return response.data;
}
