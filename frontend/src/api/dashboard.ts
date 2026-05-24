import { tenantApiClient } from "./tenantClient";

export type DashboardSummary = {
  total_warehouses: number;
  total_items: number;
  total_stock_entries: number;
  total_stock_exits: number;
  current_quantity: string;
};

export async function getDashboardSummary() {
  const response = await tenantApiClient.get<DashboardSummary>(
    "/api/dashboard/summary/"
  );

  return response.data;
}