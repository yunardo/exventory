import { tenantApiClient } from "../../api/tenantClient";

export type KardexRow = {
  date: string;
  type: "ENTRY" | "EXIT";
  reference: string;
  entry_quantity: string;
  exit_quantity: string;
  balance_quantity: string;
  unit_cost: string;
  total_cost: string;
};

export async function getKardex(warehouseId: number, itemId: number) {
  const response = await tenantApiClient.get<KardexRow[]>(
    `/api/kardex/?warehouse=${warehouseId}&item=${itemId}`
  );

  return response.data;
}