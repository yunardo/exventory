import { tenantApiClient } from "./tenantClient";

export type Warehouse = {
  id: number;
  name: string;
  code?: string;
  is_active?: boolean;
};

export async function getWarehouses() {
  const response = await tenantApiClient.get<Warehouse[]>("/api/warehouses/");
  return response.data;
}

export type CreateWarehousePayload = {
  name: string;
  code?: string;
};

export async function createWarehouse(payload: CreateWarehousePayload) {
  const response = await tenantApiClient.post<Warehouse>(
    "/api/warehouses/",
    payload
  );

  return response.data;
}