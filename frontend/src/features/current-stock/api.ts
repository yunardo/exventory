import { tenantApiClient } from "../../api/tenantClient";

export type CurrentStock = {
  warehouse_id: number;
  warehouse_name: string;
  item_id: number;
  item_code: string;
  item_name: string;
  quantity: string;
};

export async function getCurrentStock() {
  const response = await tenantApiClient.get<CurrentStock[]>("/api/current-stock/");
  return response.data;
}