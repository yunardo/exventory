import { tenantApiClient } from "../../api/tenantClient";

export type StockMovement = {
  type: "ENTRY" | "EXIT";
  date: string;
  warehouse_name: string;
  item_code: string;
  item_name: string;
  quantity: string;
  unit_cost: string | null;
  reference: string;
  notes: string;
};

export async function getStockMovements() {
  const response = await tenantApiClient.get<StockMovement[]>(
    "/api/stock-movements/"
  );

  return response.data;
}