import { unwrapPaginatedResponse, type PaginatedResponse } from "@/api/pagination";
import { tenantApiClient } from "@/api/tenantClient";

export type StockMovement = {
  type:
    | "ENTRY"
    | "EXIT"
    | "ADJUSTMENT_POSITIVE"
    | "ADJUSTMENT_NEGATIVE"
    | "TRANSFER"
    | "ENTRY_DOCUMENT"
    | "EXIT_DOCUMENT";
  date: string;
  warehouse_name: string;
  item_code: string;
  item_name: string;
  quantity: string;
  unit_cost: string | null;
  total_cost: string;
  reference: string;
  notes: string;
};

export async function getStockMovements() {
  const response = await tenantApiClient.get<
    StockMovement[] | PaginatedResponse<StockMovement>
  >("/api/stock-movements/");

  return unwrapPaginatedResponse(response.data);
}