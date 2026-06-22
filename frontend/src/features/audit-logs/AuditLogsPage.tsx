import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "../../context/TenantContext";
import { getAuditLogOptions, getAuditLogs } from "./api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AuditLogsPage() {
  const { tenantSlug } = useTenant();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const {
    data: auditLogs,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "audit-logs",
      tenantSlug,
      actionFilter,
      entityFilter,
      methodFilter,
      dateFrom,
      dateTo,
      page,
    ],
    queryFn: () =>
      getAuditLogs({
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        method: methodFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
      }),
  });

  const logs = auditLogs?.results ?? [];
  const count = auditLogs?.count ?? 0;
  const hasNext = Boolean(auditLogs?.next);
  const hasPrevious = Boolean(auditLogs?.previous);

  const { data: options } = useQuery({
    queryKey: ["audit-log-options", tenantSlug],
    queryFn: getAuditLogOptions,
  });

  const actions = options?.actions ?? [];
  const entities = options?.entities ?? [];
  const methods = options?.methods ?? [];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">
          Review activity and changes in this workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>

        <CardContent>
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <select
                  value={actionFilter}
                  onChange={(e) => {setActionFilter(e.target.value); setPage(1);}}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>

                <select
                  value={entityFilter}
                  onChange={(e) => {setEntityFilter(e.target.value); setPage(1);}}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All entities</option>
                  {entities.map((entity) => (
                    <option key={entity} value={entity}>
                      {entity}
                    </option>
                  ))}
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) => {setMethodFilter(e.target.value); setPage(1);}}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All methods</option>
                  {methods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>

                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {setDateFrom(e.target.value); setPage(1);}}
                />

                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {setDateTo(e.target.value); setPage(1);}}
                />

                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
                  onClick={() => {
                    setActionFilter("");
                    setEntityFilter("");
                    setMethodFilter("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                >
                  Clear filters
                </button>
              </div>
            </CardContent>
          </Card>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load audit logs.
            </p>
          )}

          {!isLoading && !isError && logs.length === 0 && (
            <p className="text-muted-foreground">No audit logs found.</p>
          )}

          {!isLoading && !isError && logs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const metaData = log.meta?.data;

                  return (
                    <>
                      <TableRow
                        key={log.id}
                        className="cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.user ?? "-"}</TableCell>
                        <TableCell>{log.entity}</TableCell>
                        <TableCell>{log.entity_id}</TableCell>
                        <TableCell>{log.method}</TableCell>
                        <TableCell>{log.status_code}</TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow key={`${log.id}-details`}>
                          <TableCell colSpan={7}>
                            <div className="rounded-xl bg-slate-50 p-4">
                              <div className="grid gap-2 text-sm md:grid-cols-2">
                                <p>
                                  <span className="font-semibold">Path:</span> {log.path}
                                </p>
                                <p>
                                  <span className="font-semibold">Request ID:</span>{" "}
                                  {log.request_id}
                                </p>
                              </div>

                              <div className="mt-4">
                                <p className="mb-2 text-sm font-semibold">Data</p>
                                
                                {log.action === "export" && (
                                  <div className="mb-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                                    <p className="font-semibold">Report export</p>
                                    <p>Report: {log.entity}</p>
                                    <p>Format: {(log.meta?.format as string) ?? "-"}</p>
                                  </div>
                                )}
                                {log.action === "export" && log.meta?.params && (
                                  <pre className="mt-2 rounded-lg bg-blue-100 p-3 text-xs">
                                    {JSON.stringify(log.meta.params, null, 2)}
                                  </pre>
                                )}

                                {metaData ? (
                                  <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-white">
                                    {JSON.stringify(metaData, null, 2)}
                                  </pre>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No metadata available.
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total records: {count}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!hasPrevious}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                disabled={!hasNext}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
