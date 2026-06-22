import { tenantApiClient } from "../../api/tenantClient";

export type UFVRevaluationRow = {
  warehouse_id: number;
  warehouse_name: string;
  item_id: number;
  item_code: string;
  item_name: string;
  entry_date: string;
  quantity: string;
  original_unit_cost: string;
  purchase_ufv: string;
  closing_ufv: string;
  updated_unit_cost: string;
  original_total: string;
  updated_total: string;
  revaluation_amount: string;
};

export type UFVRevaluationPreview = {
  closing_date: string;
  closing_ufv: string;
  total_original_value: string;
  total_updated_value: string;
  total_revaluation: string;
  rows: UFVRevaluationRow[];
};

export async function getUFVRevaluationPreview(closingDate: string) {
  const response = await tenantApiClient.get<UFVRevaluationPreview>(
    `/api/ufv-revaluation/preview/?closing_date=${closingDate}`
  );

  return response.data;
}
