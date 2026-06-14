import { tenantApiClient } from "../../api/tenantClient";

export type AuditLogMeta = {
  data?: Record<string, unknown>;
};

export type AuditLog = {
  id: number;
  created_at: string;
  action: string;
  entity: string;
  entity_id: string;
  user: number | null;
  path: string;
  method: string;
  status_code: number;
  request_id: string;
  meta?: AuditLogMeta;
};

export type AuditLogFilters = {
  action?: string;
  entity?: string;
  method?: string;
  date_from?: string;
  date_to?: string;
};

export type AuditLogOptions = {
  actions: string[];
  entities: string[];
  methods: string[];
};

export async function getAuditLogOptions() {
  const response = await tenantApiClient.get<AuditLogOptions>(
    "/api/audit-logs/options/"
  );

  return response.data;
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const params = new URLSearchParams();

  if (filters.action) params.set("action", filters.action);
  if (filters.entity) params.set("entity", filters.entity);
  if (filters.method) params.set("method", filters.method);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);

  const query = params.toString();

  const response = await tenantApiClient.get<AuditLog[]>(
    query ? `/api/audit-logs/?${query}` : "/api/audit-logs/"
  );

  return response.data;
}
