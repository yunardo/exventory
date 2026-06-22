import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";

import { getWarehouses } from "../warehouses/api";
import { getItems } from "../items/api";
import { getCurrentStock } from "../current-stock/api";
import { useTenant } from "../../context/TenantContext";
import {
  cancelStockExitDocument,
  confirmStockExitDocument,
  createStockExitDocument,
  getStockExitDocuments,
  type CreateStockExitDocumentPayload,
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

export function StockExitDocumentsPage() {
  const { tenantSlug } = useTenant();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateStockExitDocumentPayload>({
    defaultValues: {
      document_type: "request",
      document_number: "",
      requester_name: "",
      requesting_unit: "",
      responsible_name: "",
      exit_date: new Date().toISOString().slice(0, 10),
      reason: "",
      notes: "",
      lines: [
        {
          warehouse: 0,
          item: 0,
          quantity: "",
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const watchedLines = watch("lines");

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses", tenantSlug],
    queryFn: getWarehouses,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items", tenantSlug],
    queryFn: getItems,
  });

  const { data: currentStock = [] } = useQuery({
    queryKey: ["current-stock", tenantSlug],
    queryFn: getCurrentStock,
  });

  const { data: documents = [], isLoading, isError } = useQuery({
    queryKey: ["stock-exit-documents", tenantSlug],
    queryFn: getStockExitDocuments,
  });

  const createMutation = useMutation({
    mutationFn: createStockExitDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stock-exit-documents", tenantSlug],
      });

      reset({
        document_type: "request",
        document_number: "",
        requester_name: "",
        requesting_unit: "",
        responsible_name: "",
        exit_date: new Date().toISOString().slice(0, 10),
        reason: "",
        notes: "",
        lines: [
          {
            warehouse: 0,
            item: 0,
            quantity: "",
            notes: "",
          },
        ],
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: confirmStockExitDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stock-exit-documents", tenantSlug],
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
    mutationFn: cancelStockExitDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stock-exit-documents", tenantSlug],
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

  function getAvailableStock(warehouseId: number, itemId: number) {
    const row = currentStock.find(
      (stock) =>
        stock.warehouse_id === warehouseId &&
        stock.item_id === itemId
    );

    return row?.quantity ?? "0.00";
  }

  function onSubmit(values: CreateStockExitDocumentPayload) {
    createMutation.mutate(values);
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
          Stock Exit Documents
        </h2>
        <p className="text-muted-foreground">
          Register multi-item stock exits for requesting units.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Exit Document</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Input
                  placeholder="Document type"
                  {...register("document_type", {
                    required: "Document type is required",
                  })}
                />
                {errors.document_type && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.document_type.message}
                  </p>
                )}
              </div>

              <div>
                <Input
                  placeholder="Document number"
                  {...register("document_number", {
                    required: "Document number is required",
                  })}
                />
                {errors.document_number && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.document_number.message}
                  </p>
                )}
              </div>

              <div>
                <Input type="date" {...register("exit_date")} />
              </div>

              <div>
                <Input
                  placeholder="Requester name"
                  {...register("requester_name", {
                    required: "Requester name is required",
                  })}
                />
                {errors.requester_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.requester_name.message}
                  </p>
                )}
              </div>

              <div>
                <Input
                  placeholder="Requesting unit"
                  {...register("requesting_unit", {
                    required: "Requesting unit is required",
                  })}
                />
                {errors.requesting_unit && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.requesting_unit.message}
                  </p>
                )}
              </div>

              <div>
                <Input
                  placeholder="Responsible name"
                  {...register("responsible_name")}
                />
              </div>

              <div>
                <Input placeholder="Reason" {...register("reason")} />
              </div>

              <div className="md:col-span-2">
                <Input placeholder="Notes" {...register("notes")} />
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
                      notes: "",
                    })
                  }
                >
                  Add item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const warehouseId = Number(watchedLines?.[index]?.warehouse ?? 0);
                  const itemId = Number(watchedLines?.[index]?.item ?? 0);
                  const availableStock =
                    warehouseId > 0 && itemId > 0
                      ? getAvailableStock(warehouseId, itemId)
                      : "0.00";

                  return (
                    <div
                      key={field.id}
                      className="grid gap-3 rounded-xl border p-4 md:grid-cols-5"
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

                      <div>
                        <Input
                          placeholder="Quantity"
                          {...register(`lines.${index}.quantity`, {
                            required: true,
                          })}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Available: {availableStock}
                        </p>
                      </div>

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
                  );
                })}
              </div>
            </div>

            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Draft"}
            </Button>

            {createMutation.isError && (
              <p className="text-sm text-red-600">
                Could not create stock exit document.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exit Documents</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load stock exit documents.
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
                  <TableHead>Requester</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>{document.exit_date}</TableCell>
                    <TableCell>
                      {document.document_type} {document.document_number}
                    </TableCell>
                    <TableCell>{document.requester_name}</TableCell>
                    <TableCell>{document.requesting_unit}</TableCell>
                    <TableCell>{document.status}</TableCell>
                    <TableCell className="text-right">
                      {document.total_amount}
                    </TableCell>
                    <TableCell className="text-right">
                      {document.lines.length}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {document.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={confirmMutation.isPending}
                            onClick={() =>
                              confirmMutation.mutate(document.id)
                            }
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

          {confirmMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Could not confirm document. Check available stock.
            </p>
          )}

          {cancelMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Could not cancel document.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
