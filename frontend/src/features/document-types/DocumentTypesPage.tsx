import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { useTenant } from "../../context/TenantContext";
import {
  createDocumentType,
  getDocumentTypes,
  seedDefaultDocumentTypes,
  updateDocumentType,
  type CreateDocumentTypePayload,
  type DocumentMovementType,
  type DocumentType,
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
import { useTranslation } from "react-i18next";

export function DocumentTypesPage() {
  const { tenantSlug } = useTenant();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<CreateDocumentTypePayload>>({});
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDocumentTypePayload>({
    defaultValues: {
      code: "",
      name: "",
      movement_type: "entry",
      requires_supplier: false,
      requires_supplier_tax_id: false,
      requires_requester: false,
      requires_requesting_unit: false,
      requires_pdf: false,
      is_active: true,
    },
  });

  const {
    data: documentTypes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["document-types", tenantSlug],
    queryFn: () => getDocumentTypes(),
  });

  const createMutation = useMutation({
    mutationFn: createDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document-types", tenantSlug],
      });

      reset({
        code: "",
        name: "",
        movement_type: "entry",
        requires_supplier: false,
        requires_supplier_tax_id: false,
        requires_requester: false,
        requires_requesting_unit: false,
        requires_pdf: false,
        is_active: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document-types", tenantSlug],
      });
    },
  });

  const seedDefaultsMutation = useMutation({
    mutationFn: seedDefaultDocumentTypes,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document-types", tenantSlug],
      });
    },
  });

  function onSubmit(values: CreateDocumentTypePayload) {
    createMutation.mutate(values);
  }

  function startEdit(documentType: DocumentType) {
    setEditingId(documentType.id);
    setEditValues({
      code: documentType.code,
      name: documentType.name,
      movement_type: documentType.movement_type,
      requires_supplier: documentType.requires_supplier,
      requires_supplier_tax_id: documentType.requires_supplier_tax_id,
      requires_requester: documentType.requires_requester,
      requires_requesting_unit: documentType.requires_requesting_unit,
      requires_pdf: documentType.requires_pdf,
      is_active: documentType.is_active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  function saveEdit(id: number) {
    updateMutation.mutate(
      {
        id,
        ...editValues,
      },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditValues({});
        },
      }
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("documentTypes.title")}
        </h2>

        <p className="text-muted-foreground">
          {t("documentTypes.description")}
        </p>
        <Button
          variant="outline"
          disabled={seedDefaultsMutation.isPending}
          onClick={() => seedDefaultsMutation.mutate()}
        >
          {seedDefaultsMutation.isPending
            ? t("common.loading")
            : t("documentTypes.createDefaults")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("documentTypes.newTitle")}</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Input
                  placeholder={t("documentTypes.code")}
                  {...register("code", {
                    required: "Code is required",
                  })}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.code.message}
                  </p>
                )}
              </div>

              <div>
                <Input
                  placeholder={t("documentTypes.name")}
                  {...register("name", {
                    required: "Name is required",
                  })}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <select
                {...register("movement_type")}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="entry">{t("documentTypes.entry")}</option>
                <option value="exit">{t("documentTypes.exit")}</option>
                <option value="both">{t("documentTypes.both")}</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("requires_supplier")} />
                {t("documentTypes.requiresSupplier")}
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register("requires_supplier_tax_id")}
                />
                {t("documentTypes.requiresSupplierNit")}
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("requires_requester")} />
                {t("documentTypes.requiresRequester")}
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register("requires_requesting_unit")}
                />
                {t("documentTypes.requiresUnit")}
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("requires_pdf")} />
                {t("documentTypes.requiresPdf")}
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("is_active")} />
                {t("documentTypes.active")}
              </label>
            </div>

            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("documentTypes.creating") : t("documentTypes.create")}
            </Button>

            {createMutation.isError && (
              <p className="text-sm text-red-600">
                {t("documentTypes.errors.create")}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("documentTypes.listTitle")}</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">{t("common.loading")}</p>}

          {isError && (
            <p className="text-sm text-red-600">
              {t("documentTypes.errors.load")}
            </p>
          )}

          {!isLoading && !isError && documentTypes.length === 0 && (
            <p className="text-muted-foreground">{t("documentTypes.errors.empty")}</p>
          )}

          {!isLoading && !isError && documentTypes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("documentTypes.code")}</TableHead>
                  <TableHead>{t("documentTypes.name")}</TableHead>
                  <TableHead>{t("documentTypes.movement")}</TableHead>
                  <TableHead>{t("documentTypes.rules")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {documentTypes.map((documentType) => {
                  const isEditing = editingId === documentType.id;

                  return (
                    <TableRow key={documentType.id}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editValues.code ?? ""}
                            disabled={documentType.is_used}
                            onChange={(e) =>
                              setEditValues((v) => ({ ...v, code: e.target.value }))
                            }
                          />
                        ) : (
                          <span className="font-medium">{documentType.code}</span>
                        )}
                        {documentType.is_used && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Code and movement cannot be changed because this type is already used.
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editValues.name ?? ""}
                            onChange={(e) =>
                              setEditValues((v) => ({ ...v, name: e.target.value }))
                            }
                          />
                        ) : (
                          documentType.name
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <select
                            value={editValues.movement_type ?? "entry"}
                            disabled={documentType.is_used}
                            onChange={(e) =>
                              setEditValues((v) => ({
                                ...v,
                                movement_type: e.target.value as DocumentMovementType,
                              }))
                            }
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="entry">{t("documentTypes.entry")}</option>
                            <option value="exit">{t("documentTypes.exit")}</option>
                            <option value="both">{t("documentTypes.both")}</option>
                          </select>
                        ) : (
                          documentType.movement_type
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <div className="grid gap-2 text-sm">
                            {[
                              ["requires_supplier", "Supplier"],
                              ["requires_supplier_tax_id", "NIT"],
                              ["requires_requester", "Requester"],
                              ["requires_requesting_unit", "Unit"],
                              ["requires_pdf", "PDF"],
                              ["is_active", "Active"],
                            ].map(([key, label]) => (
                              <label key={key} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(
                                    editValues[key as keyof CreateDocumentTypePayload]
                                  )}
                                  onChange={(e) =>
                                    setEditValues((v) => ({
                                      ...v,
                                      [key]: e.target.checked,
                                    }))
                                  }
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        ) : (
                          [
                            documentType.requires_supplier ? "Supplier" : null,
                            documentType.requires_supplier_tax_id ? "NIT" : null,
                            documentType.requires_requester ? "Requester" : null,
                            documentType.requires_requesting_unit ? "Unit" : null,
                            documentType.requires_pdf ? "PDF" : null,
                          ]
                            .filter(Boolean)
                            .join(", ") || "-"
                        )}
                      </TableCell>

                      <TableCell>
                        {documentType.is_active ? "Active" : "Inactive"}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                disabled={updateMutation.isPending}
                                onClick={() => saveEdit(documentType.id)}
                              >
                                Save
                              </Button>

                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(documentType)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
