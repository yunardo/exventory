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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
      alert(t("stockDocuments.requiresPDFAttachment"));
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
          {t("stockDocuments.entryTitle")}
        </h2>
        <p className="text-muted-foreground">
          {t("stockDocuments.entryDescription")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("stockDocuments.newEntry")}</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <select
                  {...register("document_type_ref", {
                    valueAsNumber: true,
                    required: t("stockDocuments.requiresDocumentType"),
                  })}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={0}>{t("stockDocuments.documentType")}</option>
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.code} - {type.name}
                    </option>
                  ))}
                </select>
                {selectedDocumentType?.requires_pdf && (
                  <p className="text-sm text-amber-600">
                    {t("stockDocuments.requiresPDFAttachment")}
                  </p>
                )}
              </div>

              <div>
                <Input type="date" {...register("entry_date")} />
              </div>

              <div>
                <Input
                  placeholder={t("stockDocuments.supplier")}
                  {...register("supplier_name", {
                    required: selectedDocumentType?.requires_supplier
                      ? t("stockDocuments.requiresSupplier")
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
                  placeholder={t("stockDocuments.supplierNit")}
                  {...register("supplier_tax_id", {
                    required: selectedDocumentType?.requires_supplier_tax_id
                      ? t("stockDocuments.requiresSupplierNIT")
                      : false,
                  })}
                />
              </div>

              <div>
                <Input placeholder={t("stockDocuments.reason")} {...register("reason")} />
              </div>

              <div className="md:col-span-3">
                <Input placeholder={t("stockDocuments.notes")} {...register("notes")} />
              </div>

              <div className="md:col-span-3">
                <label className="text-sm font-medium">{t("stockDocuments.documentPdf")}</label>
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
                <h3 className="font-semibold">{t("stockDocuments.items")}</h3>

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
                  {t("stockDocuments.addItem")}
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
                      <option value={0}>{t("stockDocuments.warehouse")}</option>
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
                      <option value={0}>{t("stockDocuments.item")}</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.code} - {item.name}
                        </option>
                      ))}
                    </select>

                    <Input
                      placeholder={t("stockDocuments.quantity")}
                      {...register(`lines.${index}.quantity`, {
                        required: true,
                      })}
                    />

                    <Input
                      placeholder={t("stockDocuments.unitCost")}
                      {...register(`lines.${index}.unit_cost`, {
                        required: true,
                      })}
                    />

                    <Input
                      placeholder={t("stockDocuments.notes")}
                      {...register(`lines.${index}.notes`)}
                    />

                    <Button
                      type="button"
                      variant="destructive"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      {t("stockDocuments.remove")}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("stockDocuments.creating") : t("stockDocuments.createDraft")}
            </Button>

            {createMutation.isError && (
              <p className="text-sm text-red-600">
                {t("stockDocuments.errors.createEntry")}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("stockDocuments.entryTitle")}</CardTitle>
        </CardHeader>

        <CardContent>

          <div className="mb-4 grid gap-3 md:grid-cols-5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("stockDocuments.allStatuses")}</option>
              <option value="draft">{t("stockDocuments.draft")}</option>
              <option value="confirmed">{t("stockDocuments.confirmed")}</option>
              <option value="cancelled">{t("stockDocuments.cancelled")}</option>
            </select>

            <Input
              placeholder={t("stockDocuments.supplier")}
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            />

            <Input
              placeholder={t("stockDocuments.documentNumber")}
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

          {isLoading && <p className="text-muted-foreground">{t("common.loading")}</p>}

          {isError && (
            <p className="text-sm text-red-600">
              {t("stockDocuments.errors.loadEntry")}
            </p>
          )}

          {!isLoading && !isError && documents.length === 0 && (
            <p className="text-muted-foreground">{t("stockDocuments.errors.NoDocuments")}</p>
          )}

          {!isLoading && !isError && documents.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("stockDocuments.date")}</TableHead>
                  <TableHead>{t("stockDocuments.document")}</TableHead>
                  <TableHead>{t("stockDocuments.supplier")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.total")}</TableHead>
                  <TableHead className="text-right">{t("stockDocuments.lines")}</TableHead>
                  <TableHead>{t("common.pdf")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                          {t("stockDocuments.viewPdf")}
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
                          {t("common.view")}
                        </Button>
                        {document.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate(document.id)}
                          >
                            {t("common.confirm")}
                          </Button>
                        )}

                        {document.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={cancelMutation.isPending}
                            onClick={() => handleCancel(document.id)}
                          >
                            {t("common.cancel")}
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
