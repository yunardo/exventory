import { tenantApiClient } from "../../api/tenantClient";

export type KardexRow = {
  date: string;
  type:
    | "ENTRY"
    | "EXIT"
    | "ADJUSTMENT_POSITIVE"
    | "ADJUSTMENT_NEGATIVE"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "ENTRY_DOCUMENT"
    | "EXIT_DOCUMENT";
  reference: string;
  entry_quantity: string;
  exit_quantity: string;
  balance_quantity: string;
  unit_cost: string;
  total_cost: string;
  balance_value: string;
  average_balance_cost: string;
};

export async function getKardex(warehouseId: number, itemId: number) {
  const response = await tenantApiClient.get<KardexRow[]>(
    `/api/kardex/?warehouse=${warehouseId}&item=${itemId}`
  );

  return response.data;
}

export async function exportKardex(warehouseId: number, itemId: number) {
  const response = await tenantApiClient.get(
    `/api/kardex/export/?warehouse=${warehouseId}&item=${itemId}`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = `kardex_${warehouseId}_${itemId}.xlsx`;
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportKardexPdf(warehouseId: number, itemId: number) {
  const response = await tenantApiClient.get(
    `/api/kardex/pdf/?warehouse=${warehouseId}&item=${itemId}`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = `kardex_${warehouseId}_${itemId}.pdf`;
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
}
