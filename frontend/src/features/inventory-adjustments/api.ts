import { unwrapPaginatedResponse, type PaginatedResponse } from "@/api/pagination";
import { tenantApiClient } from "@/api/tenantClient";

export type InventoryAdjustment = {
  id: number;
  warehouse: number;
  warehouse_name: string;
  item: number;
  item_code: string;
  item_name: string;
  adjustment_type: "POSITIVE" | "NEGATIVE";
  quantity: string;
  unit_cost: string | null;
  reference: string;
  adjustment_date: string;
  reason: string;
  total_cost: string;
};

export type CreateInventoryAdjustmentPayload = {
  warehouse: number;
  item: number;
  adjustment_type: "POSITIVE" | "NEGATIVE";
  quantity: string;
  unit_cost?: string | null;
  reference?: string;
  adjustment_date: string;
  reason?: string;
};

export async function getInventoryAdjustments() {
  const response = await tenantApiClient.get<
    InventoryAdjustment[] | PaginatedResponse<InventoryAdjustment>
  >("/api/inventory-adjustments/");

  return unwrapPaginatedResponse(response.data);
}

export async function createInventoryAdjustment(
  payload: CreateInventoryAdjustmentPayload
) {
  const response = await tenantApiClient.post<InventoryAdjustment>(
    "/api/inventory-adjustments/",
    payload
  );

  return response.data;
}
