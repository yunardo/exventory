import { tenantApiClient } from "../../api/tenantClient";
import {
  type PaginatedResponse,
  unwrapPaginatedResponse,
} from "../../api/pagination";

export type DocumentMovementType = "entry" | "exit" | "both";

export type DocumentType = {
  id: number;
  code: string;
  name: string;
  movement_type: DocumentMovementType;
  requires_supplier: boolean;
  requires_supplier_tax_id: boolean;
  requires_requester: boolean;
  requires_requesting_unit: boolean;
  requires_pdf: boolean;
  is_active: boolean;
};

export type CreateDocumentTypePayload = Omit<DocumentType, "id">;

export async function getDocumentTypes(filters?: {
  movement_type?: DocumentMovementType;
  is_active?: boolean;
}) {
  const params = new URLSearchParams();

  if (filters?.movement_type) {
    params.append("movement_type", filters.movement_type);
  }

  if (filters?.is_active !== undefined) {
    params.append("is_active", String(filters.is_active));
  }

  const query = params.toString();

  const response = await tenantApiClient.get<
    DocumentType[] | PaginatedResponse<DocumentType>
  >(query ? `/api/document-types/?${query}` : "/api/document-types/");

  return unwrapPaginatedResponse(response.data);
}

export async function createDocumentType(payload: CreateDocumentTypePayload) {
  const response = await tenantApiClient.post<DocumentType>(
    "/api/document-types/",
    payload
  );

  return response.data;
}

export async function updateDocumentType(
  payload: Partial<CreateDocumentTypePayload> & { id: number }
) {
  const { id, ...data } = payload;

  const response = await tenantApiClient.patch<DocumentType>(
    `/api/document-types/${id}/`,
    data
  );

  return response.data;
}
