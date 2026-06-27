import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";

import { getWarehouses } from "../warehouses/api";
import { getItems } from "../items/api";
import { useTenant } from "../../context/TenantContext";
import {
  cancelStockEntryDocument,
  confirmStockEntryDocument,
  createStockEntryDocument,
  getStockEntryDocuments,
  openStockEntryDocumentPdf,
  type CreateStockEntryDocumentPayload,
} from "./api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDocumentTypes } from "../document-types/api";

export function StockEntryDocumentsPage() {
  const { tenantSlug } = useTenant();
  const queryClient = useQueryClient();
  const [documentPdf, setDocumentPdf] = useState<File | null>(null);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [documentNumberFilter, setDocumentNumberFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: documentTypes = [] } = useQuery({
    queryKey: ["document-types", tenantSlug, "entry"],
    queryFn: () =>
      getDocumentTypes({
        movement_type: "entry",
        is_active: true,
      }),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateStockEntryDocumentPayload>({
    defaultValues: {
      document_type_ref: 0,
      supplier_name: "",
      supplier_tax_id: "",
      entry_date: new Date().toISOString().slice(0, 10),
      reason: "",
      notes: "",
      lines: [
        {
          warehouse: 0,
          item: 0,
          quantity: "",
          unit_cost: "",
          notes: "",
        },
      ],
    },
  });

  const selectedDocumentTypeId = watch("document_type_ref");

  const selectedDocumentType = documentTypes.find(
    (type) => type.id === Number(selectedDocumentTypeId)
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses", tenantSlug],
    queryFn: getWarehouses,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items", tenantSlug],
    queryFn: getItems,
  });

  const { data: documents = [], isLoading, isError } = useQuery({
    queryKey: [
      "stock-entry-documents",
      tenantSlug,
      statusFilter,
      supplierFilter,
      documentNumberFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      getStockEntryDocuments({
        status: statusFilter || undefined,
        supplier: supplierFilter || undefined,
        document_number: documentNumberFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createStockEntryDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stock-entry-documents", tenantSlug],
      });

      reset({
        document_type_ref: 0,
        supplier_name: "",
        supplier_tax_id: "",
        entry_date: new Date().toISOString().slice(0, 10),
        reason: "",
        notes: "",
        lines: [
          {
            warehouse: 0,
            item: 0,
            quantity: "",
            unit_cost: "",
            notes: "",
          },
        ],
      });
      setDocumentPdf(null);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: confirmStockEntryDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stock-entry-documents", tenantSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["current-stock", tenantSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-movements", tenantSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary", tenantSlug],
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelStockEntryDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stock-entry-documents", tenantSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["current-stock", tenantSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-movements", tenantSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary", tenantSlug],
      });
    },
  });

  function onSubmit(values: CreateStockEntryDocumentPayload) {
    const formData = new FormData();

    formData.append("document_type_ref", String(values.document_type_ref));
    formData.append("supplier_name", values.supplier_name);
    formData.append("supplier_tax_id", values.supplier_tax_id ?? "");
    formData.append("entry_date", values.entry_date);
    formData.append("reason", values.reason ?? "");
    formData.append("notes", values.notes ?? "");
    formData.append("lines", JSON.stringify(values.lines));

    if (documentPdf instanceof File) {
      formData.append("document_pdf", documentPdf);
    }

    if (selectedDocumentType?.requires_pdf && !documentPdf) {
      alert("This document type requires a PDF attachment.");
      return;
    }

    createMutation.mutate(formData);
  }

  function handleCancel(id: number) {
    const reason = window.prompt("Cancellation reason");

    if (!reason) {
      return;
    }

    cancelMutation.mutate({
      id,
      reason,
    });
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Stock Entry Documents
        </h2>
        <p className="text-muted-foreground">
          Register multi-item stock entries from suppliers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Entry Document</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <select
                  {...register("document_type_ref", {
                    valueAsNumber: true,
                    required: "Document type is required",
                  })}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={0}>Document type</option>
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.code} - {type.name}
                    </option>
                  ))}
                </select>
                {selectedDocumentType?.requires_pdf && (
                  <p className="text-sm text-amber-600">
                    This document type requires a PDF attachment.
                  </p>
                )}
              </div>

              <div>
                <Input type="date" {...register("entry_date")} />
              </div>

              <div>
                <Input
                  placeholder="Supplier name"
                  {...register("supplier_name", {
                    required: selectedDocumentType?.requires_supplier
                      ? "Supplier name is required"
                      : false,
                  })}
                />
                {errors.supplier_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.supplier_name.message}
                  </p>
                )}
              </div>

              <div>
                <Input
                  placeholder="Supplier NIT"
                  {...register("supplier_tax_id", {
                    required: selectedDocumentType?.requires_supplier_tax_id
                      ? "Supplier NIT is required"
                      : false,
                  })}
                />
              </div>

              <div>
                <Input placeholder="Reason" {...register("reason")} />
              </div>

              <div className="md:col-span-3">
                <Input placeholder="Notes" {...register("notes")} />
              </div>

              <div className="md:col-span-3">
                <label className="text-sm font-medium">Document PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => {
                    setDocumentPdf(event.target.files?.[0] ?? null);
                  }}
                  className="mt-2 block w-full text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Items</h3>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      warehouse: 0,
                      item: 0,
                      quantity: "",
                      unit_cost: "",
                      notes: "",
                    })
                  }
                >
                  Add item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-xl border p-4 md:grid-cols-6"
                  >
                    <select
                      {...register(`lines.${index}.warehouse`, {
                        valueAsNumber: true,
                      })}
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value={0}>Warehouse</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>

                    <select
                      {...register(`lines.${index}.item`, {
                        valueAsNumber: true,
                      })}
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value={0}>Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.code} - {item.name}
                        </option>
                      ))}
                    </select>

                    <Input
                      placeholder="Quantity"
                      {...register(`lines.${index}.quantity`, {
                        required: true,
                      })}
                    />

                    <Input
                      placeholder="Unit cost"
                      {...register(`lines.${index}.unit_cost`, {
                        required: true,
                      })}
                    />

                    <Input
                      placeholder="Notes"
                      {...register(`lines.${index}.notes`)}
                    />

                    <Button
                      type="button"
                      variant="destructive"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Draft"}
            </Button>

            {createMutation.isError && (
              <p className="text-sm text-red-600">
                Could not create stock entry document.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entry Documents</CardTitle>
        </CardHeader>

        <CardContent>

          <div className="mb-4 grid gap-3 md:grid-cols-5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <Input
              placeholder="Supplier"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            />

            <Input
              placeholder="Document number"
              value={documentNumberFilter}
              onChange={(e) => setDocumentNumberFilter(e.target.value)}
            />

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load stock entry documents.
            </p>
          )}

          {!isLoading && !isError && documents.length === 0 && (
            <p className="text-muted-foreground">No documents found.</p>
          )}

          {!isLoading && !isError && documents.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>{document.entry_date}</TableCell>
                    <TableCell>
                      {document.document_type_ref_code ?? document.document_type} {document.document_number}
                    </TableCell>
                    <TableCell>
                      {document.supplier_name}
                      {document.supplier_tax_id
                        ? ` · NIT ${document.supplier_tax_id}`
                        : ""}
                    </TableCell>
                    <TableCell>{document.status}</TableCell>
                    <TableCell className="text-right">
                      {document.total_amount}
                    </TableCell>
                    <TableCell className="text-right">
                      {document.lines_detail.length}
                    </TableCell>
                    <TableCell>
                      {document.document_pdf ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!document.document_pdf}
                          onClick={() => openStockEntryDocumentPdf(document.id)}
                        >
                          View PDF
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/stock-entry-documents/${document.id}`)}
                        >
                          View
                        </Button>
                        {document.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate(document.id)}
                          >
                            Confirm
                          </Button>
                        )}

                        {document.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={cancelMutation.isPending}
                            onClick={() => handleCancel(document.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
