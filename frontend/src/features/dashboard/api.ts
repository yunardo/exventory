import { tenantApiClient } from "../../api/tenantClient";

export type DashboardSummary = {
  total_warehouses: number;
  total_items: number;
  total_stock_entries: number;
  total_stock_exits: number;
  current_quantity: string;
  current_value: string;
};

export async function getDashboardSummary() {
  const response = await tenantApiClient.get<DashboardSummary>(
    "/api/dashboard/summary/"
  );

  return response.data;
}