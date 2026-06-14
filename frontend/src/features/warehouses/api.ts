import { unwrapPaginatedResponse, type PaginatedResponse } from "@/api/pagination";
import { tenantApiClient } from "@/api/tenantClient";

export type Warehouse = {
  id: number;
  name: string;
  location?: string;
  is_active?: boolean;
};

export async function getWarehouses() {
  const response = await tenantApiClient.get<
    Warehouse[] | PaginatedResponse<Warehouse>
  >("/api/warehouses/");

  return unwrapPaginatedResponse(response.data);
}

export type CreateWarehousePayload = {
  name: string;
  location?: string;
};

export async function createWarehouse(payload: CreateWarehousePayload) {
  const response = await tenantApiClient.post<Warehouse>(
    "/api/warehouses/",
    payload
  );

  return response.data;
}

export async function deleteWarehouse(id: number) {
  await tenantApiClient.delete(`/api/warehouses/${id}/`);
}

export type UpdateWarehousePayload = {
  id: number;
  name: string;
  location?: string;
};

export async function updateWarehouse(payload: UpdateWarehousePayload) {
  const { id, ...data } = payload;

  const response = await tenantApiClient.patch<Warehouse>(
    `/api/warehouses/${id}/`,
    data
  );

  return response.data;
}