import { tenantApiClient } from "../../api/tenantClient";
import {
  type PaginatedResponse,
  unwrapPaginatedResponse,
} from "../../api/pagination";

export type StockExitDocumentStatus = "draft" | "confirmed" | "cancelled";

export type StockExitDocumentLine = {
  id: number;
  warehouse: number;
  warehouse_name: string;
  item: number;
  item_code: string;
  item_name: string;
  quantity: string;
  total_cost: string;
  notes: string;
};

export type StockExitDocument = {
  id: number;
  document_type: string;
  document_number: string;
  requester_name: string;
  requesting_unit: string;
  responsible_name: string;
  exit_date: string;
  reason: string;
  notes: string;
  status: StockExitDocumentStatus;
  total_amount: string;
  document_pdf: string | null;
  cancelled_at: string | null;
  cancellation_reason: string;
  lines_detail: StockExitDocumentLine[];
  document_type_ref: number | null;
  document_type_ref_code: string | null;
  document_type_ref_name: string | null;
};

export type CreateStockExitDocumentPayload = {
  document_type_ref: number;
  requester_name: string;
  requesting_unit: string;
  responsible_name?: string;
  exit_date: string;
  reason?: string;
  notes?: string;
  lines: Array<{
    warehouse: number;
    item: number;
    quantity: string;
    notes?: string;
  }>;
};

export type StockExitDocumentFilters = {
  status?: string;
  requester?: string;
  requesting_unit?: string;
  document_number?: string;
  date_from?: string;
  date_to?: string;
};

export async function getStockExitDocuments(
  filters: StockExitDocumentFilters = {}
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const query = params.toString();

  const response = await tenantApiClient.get<
    StockExitDocument[] | PaginatedResponse<StockExitDocument>
  >(query ? `/api/stock-exit-documents/?${query}` : "/api/stock-entry-documents/");

  return unwrapPaginatedResponse(response.data);
}

export async function createStockExitDocument(
  payload: CreateStockExitDocumentPayload | FormData
) {
  const response = await tenantApiClient.post<StockExitDocument>(
    "/api/stock-exit-documents/",
    payload
  );

  return response.data;
}

export async function confirmStockExitDocument(id: number) {
  const response = await tenantApiClient.post<StockExitDocument>(
    `/api/stock-exit-documents/${id}/confirm/`
  );

  return response.data;
}

export async function cancelStockExitDocument(payload: {
  id: number;
  reason: string;
}) {
  const response = await tenantApiClient.post<StockExitDocument>(
    `/api/stock-exit-documents/${payload.id}/cancel/`,
    {
      reason: payload.reason,
    }
  );

  return response.data;
}

export async function openStockExitDocumentPdf(id: number) {
  const response = await tenantApiClient.get(
    `/api/stock-exit-documents/${id}/download-pdf/`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(response.data);
  window.open(url, "_blank");
}

export async function getStockExitDocument(id: number) {
  const response = await tenantApiClient.get<StockExitDocument>(
    `/api/stock-exit-documents/${id}/`
  );

  return response.data;
}

export async function openGeneratedStockExitPdf(id: number) {
  const response = await tenantApiClient.get(
    `/api/stock-exit-documents/${id}/pdf/`,
    { responseType: "blob" }
  );

  const url = URL.createObjectURL(response.data);
  window.open(url, "_blank");
}
