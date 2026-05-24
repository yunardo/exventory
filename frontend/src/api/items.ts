import { tenantApiClient } from "./tenantClient";

export type Item = {
  id: number;
  code: string;
  name: string;
  description: string;
  unit: string;
  is_active: boolean;
};

export type CreateItemPayload = {
  code: string;
  name: string;
  description?: string;
  unit: string;
  is_active?: boolean;
};

export type UpdateItemPayload = CreateItemPayload & {
  id: number;
};

export async function getItems() {
  const response = await tenantApiClient.get<Item[]>("/api/items/");
  return response.data;
}

export async function createItem(payload: CreateItemPayload) {
  const response = await tenantApiClient.post<Item>("/api/items/", payload);
  return response.data;
}

export async function updateItem(payload: UpdateItemPayload) {
  const { id, ...data } = payload;
  const response = await tenantApiClient.patch<Item>(`/api/items/${id}/`, data);
  return response.data;
}

export async function deleteItem(id: number) {
  await tenantApiClient.delete(`/api/items/${id}/`);
}