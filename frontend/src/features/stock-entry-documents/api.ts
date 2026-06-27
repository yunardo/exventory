import { tenantApiClient } from "../../api/tenantClient";
import {
  type PaginatedResponse,
  unwrapPaginatedResponse,
} from "../../api/pagination";

export type StockEntryDocumentStatus = "draft" | "confirmed" | "cancelled";

export type StockEntryDocumentLine = {
  id: number;
  warehouse: number;
  warehouse_name: string;
  item: number;
  item_code: string;
  item_name: string;
  quantity: string;
  unit_cost: string;
  total_cost: string;
  ufv_rate: number | null;
  ufv_value: string | null;
  notes: string;
};

export type StockEntryDocument = {
  id: number;
  document_type: string;
  document_number: string;
  supplier_name: string;
  supplier_tax_id: string;
  entry_date: string;
  reason: string;
  notes: string;
  status: StockEntryDocumentStatus;
  total_amount: string;
  document_pdf: string | null;
  cancelled_at: string | null;
  cancellation_reason: string;
  lines_detail: StockEntryDocumentLine[];
  document_type_ref: number | null;
  document_type_ref_code: string | null;
  document_type_ref_name: string | null;
};

export type CreateStockEntryDocumentPayload = {
  document_type_ref: number;
  supplier_name: string;
  supplier_tax_id?: string;
  entry_date: string;
  reason?: string;
  notes?: string;
  lines: Array<{
    warehouse: number;
    item: number;
    quantity: string;
    unit_cost: string;
    notes?: string;
  }>;
};

export type StockEntryDocumentFilters = {
  status?: string;
  supplier?: string;
  document_number?: string;
  date_from?: string;
  date_to?: string;
};

export async function getStockEntryDocuments(
  filters: StockEntryDocumentFilters = {}
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const query = params.toString();

  const response = await tenantApiClient.get<
    StockEntryDocument[] | PaginatedResponse<StockEntryDocument>
  >(query ? `/api/stock-entry-documents/?${query}` : "/api/stock-entry-documents/");

  return unwrapPaginatedResponse(response.data);
}

export async function createStockEntryDocument(
  payload: CreateStockEntryDocumentPayload | FormData
) {
  const response = await tenantApiClient.post<StockEntryDocument>(
    "/api/stock-entry-documents/",
    payload
  );

  return response.data;
}

export async function confirmStockEntryDocument(id: number) {
  const response = await tenantApiClient.post<StockEntryDocument>(
    `/api/stock-entry-documents/${id}/confirm/`
  );

  return response.data;
}

export async function cancelStockEntryDocument(payload: {
  id: number;
  reason: string;
}) {
  const response = await tenantApiClient.post<StockEntryDocument>(
    `/api/stock-entry-documents/${payload.id}/cancel/`,
    {
      reason: payload.reason,
    }
  );

  return response.data;
}

export async function openStockEntryDocumentPdf(id: number) {
  const response = await tenantApiClient.get(
    `/api/stock-entry-documents/${id}/download-pdf/`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(response.data);
  window.open(url, "_blank");
}

export async function getStockEntryDocument(id: number) {
  const response = await tenantApiClient.get<StockEntryDocument>(
    `/api/stock-entry-documents/${id}/`
  );

  return response.data;
}

export async function openGeneratedStockEntryPdf(id: number) {
  const response = await tenantApiClient.get(
    `/api/stock-entry-documents/${id}/pdf/`,
    {
      responseType: "blob",
    }
  );

  const url = URL.createObjectURL(response.data);
  window.open(url, "_blank");
}
