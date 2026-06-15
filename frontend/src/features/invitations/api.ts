import { apiClient } from "../../api/client";

export type AcceptInvitationResponse = {
  detail: string;
  tenant: {
    id: number;
    slug: string;
    name: string;
  };
  membership: {
    role: string;
    is_active: boolean;
  };
};

export async function acceptInvitation(token: string) {
  const response = await apiClient.post<AcceptInvitationResponse>(
    "/api/auth/invitations/accept/",
    { token }
  );

  return response.data;
}
