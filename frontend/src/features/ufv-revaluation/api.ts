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

export type UFVRevaluationRun = {
  id: number;
  closing_date: string;
  closing_ufv: string;
  total_original_value: string;
  total_updated_value: string;
  total_revaluation: string;
  notes: string;
  applied_by: number | null;
  applied_by_username: string | null;
  created_at: string;
  lines: UFVRevaluationRow[];
};

export async function applyUFVRevaluation(payload: {
  closing_date: string;
  notes?: string;
}) {
  const response = await tenantApiClient.post<UFVRevaluationRun>(
    "/api/ufv-revaluation/apply/",
    payload
  );

  return response.data;
}
