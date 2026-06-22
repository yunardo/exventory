import { tenantApiClient } from "../../api/tenantClient";
import {
  type PaginatedResponse,
  unwrapPaginatedResponse,
} from "../../api/pagination";

export type UFVRate = {
  id: number;
  date: string;
  value: string;
};

export type CreateUFVRatePayload = {
  date: string;
  value: string;
};

export type UpdateUFVRatePayload = {
  id: number;
  date?: string;
  value?: string;
};

export async function getUFVRates() {
  const response = await tenantApiClient.get<
    UFVRate[] | PaginatedResponse<UFVRate>
  >("/api/ufv-rates/");

  return unwrapPaginatedResponse(response.data);
}

export async function createUFVRate(payload: CreateUFVRatePayload) {
  const response = await tenantApiClient.post<UFVRate>(
    "/api/ufv-rates/",
    payload
  );

  return response.data;
}

export async function updateUFVRate(payload: UpdateUFVRatePayload) {
  const { id, ...data } = payload;

  const response = await tenantApiClient.patch<UFVRate>(
    `/api/ufv-rates/${id}/`,
    data
  );

  return response.data;
}
