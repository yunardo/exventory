import { tenantApiClient } from "../../api/tenantClient";

export type TenantSettings = {
  id: number;
  name: string;
  slug: string;
  company_name: string;
  company_logo: string | null;
  tax_id: string;
  phone: string;
  address: string;
  currency_code: string;
  timezone: string;
  is_active: boolean;
};

export type UpdateTenantSettingsPayload = {
  name?: string;
  company_name?: string;
  tax_id?: string;
  phone?: string;
  address?: string;
  currency_code?: string;
  timezone?: string;
};

export async function getTenantSettings() {
  const response = await tenantApiClient.get<TenantSettings>(
    "/api/tenant-settings/"
  );

  return response.data;
}

export async function updateTenantSettings(
  payload: UpdateTenantSettingsPayload | FormData
) {
  const response = await tenantApiClient.patch<TenantSettings>(
    "/api/tenant-settings/",
    payload,
    payload instanceof FormData
      ? {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      : undefined
  );

  return response.data;
}
