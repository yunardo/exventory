import { tenantApiClient } from "../../api/tenantClient";

export type InventoryValuationWarehouse = {
  warehouse_id: number;
  warehouse_name: string;
  inventory_value: string;
};

export type InventoryValuation = {
  total_inventory_value: string;
  warehouses: InventoryValuationWarehouse[];
};

export async function getInventoryValuation() {
  const response = await tenantApiClient.get<InventoryValuation>(
    "/api/inventory-valuation/"
  );

  return response.data;
}

export async function exportInventoryValuation() {
  const response = await tenantApiClient.get(
    "/api/inventory-valuation/export/",
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = "inventory_valuation.xlsx";
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
}