import { unwrapPaginatedResponse, type PaginatedResponse } from "@/api/pagination";
import { tenantApiClient } from "@/api/tenantClient";

export type CurrentStock = {
  warehouse_id: number;
  warehouse_name: string;
  item_id: number;
  item_code: string;
  item_name: string;
  quantity: string;
  average_cost: string;
  total_cost: string;
};

export async function getCurrentStock() {
  const response = await tenantApiClient.get<
    CurrentStock[] | PaginatedResponse<CurrentStock>
  >("/api/current-stock/");

  return unwrapPaginatedResponse(response.data);
}


export async function exportCurrentStock() {
  const response = await tenantApiClient.get("/api/current-stock/export/", {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = "current_stock.xlsx";
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
}
