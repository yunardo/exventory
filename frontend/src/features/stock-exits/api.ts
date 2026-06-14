import { unwrapPaginatedResponse, type PaginatedResponse } from "@/api/pagination";
import { tenantApiClient } from "@/api/tenantClient";

export type StockExit = {
  id: number;
  warehouse: number;
  warehouse_name: string;
  item: number;
  item_code: string;
  item_name: string;
  quantity: string;
  reference: string;
  exit_date: string;
  notes: string;
  total_cost: string;
};

export type CreateStockExitPayload = {
  warehouse: number;
  item: number;
  quantity: string;
  reference?: string;
  exit_date: string;
  notes?: string;
};

export async function getStockExits() {
  const response = await tenantApiClient.get<
    StockExit[] | PaginatedResponse<StockExit>
  >("/api/stock-exits/");

  return unwrapPaginatedResponse(response.data);
}

export async function createStockExit(payload: CreateStockExitPayload) {
  const response = await tenantApiClient.post<StockExit>(
    "/api/stock-exits/",
    payload
  );

  return response.data;
}