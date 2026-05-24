import { tenantApiClient } from "./tenantClient";

export type StockEntry = {
  id: number;
  warehouse: number;
  warehouse_name: string;
  item: number;
  item_code: string;
  item_name: string;
  quantity: string;
  unit_cost: string;
  reference: string;
  entry_date: string;
  notes: string;
};

export type CreateStockEntryPayload = {
  warehouse: number;
  item: number;
  quantity: string;
  unit_cost: string;
  reference?: string;
  entry_date: string;
  notes?: string;
};

export async function getStockEntries() {
  const response = await tenantApiClient.get<StockEntry[]>("/api/stock-entries/");
  return response.data;
}

export async function createStockEntry(payload: CreateStockEntryPayload) {
  const response = await tenantApiClient.post<StockEntry>(
    "/api/stock-entries/",
    payload
  );

  return response.data;
}