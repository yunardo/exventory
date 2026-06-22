import { tenantApiClient } from "../../api/tenantClient";
import {
  type PaginatedResponse,
  unwrapPaginatedResponse,
} from "../../api/pagination";

export type UFVRevaluationPreviewRow = {
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
  rows: UFVRevaluationPreviewRow[];
};

export type UFVRevaluationRunLine = {
  id: number;
  stock_layer: number;
  warehouse: number;
  warehouse_name: string;
  item: number;
  item_code: string;
  item_name: string;
  quantity: string;
  original_unit_cost: string;
  updated_unit_cost: string;
  purchase_ufv: string;
  closing_ufv: string;
  original_total: string;
  updated_total: string;
  revaluation_amount: string;
};

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
  lines: UFVRevaluationRunLine[];
};

export async function getUFVRevaluationPreview(closingDate: string) {
  const response = await tenantApiClient.get<UFVRevaluationPreview>(
    `/api/ufv-revaluation/preview/?closing_date=${closingDate}`
  );

  return response.data;
}

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

export async function getUFVRevaluationRuns() {
  const response = await tenantApiClient.get<
    UFVRevaluationRun[] | PaginatedResponse<UFVRevaluationRun>
  >("/api/ufv-revaluation-runs/");

  return unwrapPaginatedResponse(response.data);
}

export async function getUFVRevaluationRun(id: number) {
  const response = await tenantApiClient.get<UFVRevaluationRun>(
    `/api/ufv-revaluation-runs/${id}/`
  );

  return response.data;
}

export async function exportUFVRevaluationRunExcel(id: number) {
  const response = await tenantApiClient.get(
    `/api/ufv-revaluation-runs/${id}/export/`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = `ufv_revaluation_run_${id}.xlsx`;
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
}
