import { unwrapPaginatedResponse, type PaginatedResponse } from "@/api/pagination";
import { tenantApiClient } from "@/api/tenantClient";

export type StockTransfer = {
  id: number;
  source_warehouse: number;
  source_warehouse_name: string;
  destination_warehouse: number;
  destination_warehouse_name: string;
  item: number;
  item_code: string;
  item_name: string;
  quantity: string;
  transfer_date: string;
  reference: string;
  notes: string;
  total_cost: string;
};

export type CreateStockTransferPayload = {
  source_warehouse: number;
  destination_warehouse: number;
  item: number;
  quantity: string;
  transfer_date: string;
  reference?: string;
  notes?: string;
};

export async function getStockTransfers() {
  const response = await tenantApiClient.get<
    StockTransfer[] | PaginatedResponse<StockTransfer>
  >("/api/stock-transfers/");

  return unwrapPaginatedResponse(response.data);
}

export async function createStockTransfer(payload: CreateStockTransferPayload) {
  const response = await tenantApiClient.post<StockTransfer>(
    "/api/stock-transfers/",
    payload
  );

  return response.data;
}