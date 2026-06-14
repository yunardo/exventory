import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getWarehouses } from "../warehouses/api";
import { getItems } from "../items/api";
import { getCurrentStock } from "../current-stock/api";
import { createStockTransfer, getStockTransfers } from "./api";
import { useTenant } from "../../context/TenantContext";

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
import { canCreateStockMovement } from "@/auth/roles";

const transferSchema = z
  .object({
    source_warehouse: z.coerce.number().min(1, "Source warehouse is required"),
    destination_warehouse: z.coerce
      .number()
      .min(1, "Destination warehouse is required"),
    item: z.coerce.number().min(1, "Item is required"),
    quantity: z.string().min(1, "Quantity is required"),
    transfer_date: z.string().min(1, "Transfer date is required"),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.source_warehouse === values.destination_warehouse) {
      ctx.addIssue({
        code: "custom",
        path: ["destination_warehouse"],
        message: "Destination must be different from source",
      });
    }
  });

type TransferFormInput = z.input<typeof transferSchema>;
type TransferFormValues = z.output<typeof transferSchema>;

export function StockTransfersPage() {
  const queryClient = useQueryClient();
  const { tenantSlug, tenantRole } = useTenant();
  const canCreate = canCreateStockMovement(tenantRole);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TransferFormInput, unknown, TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      source_warehouse: 0,
      destination_warehouse: 0,
      item: 0,
      quantity: "",
      transfer_date: new Date().toISOString().slice(0, 10),
      reference: "",
      notes: "",
    },
  });

  const sourceWarehouse = Number(watch("source_warehouse"));
  const selectedItem = Number(watch("item"));

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

  const {
    data: transfers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stock-transfers", tenantSlug],
    queryFn: getStockTransfers,
  });

  const selectedStock = currentStock.find(
    (row) =>
      row.warehouse_id === sourceWarehouse &&
      row.item_id === selectedItem
  );

  const createMutation = useMutation({
    mutationFn: createStockTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stock-transfers", tenantSlug],
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

      reset({
        source_warehouse: 0,
        destination_warehouse: 0,
        item: 0,
        quantity: "",
        transfer_date: new Date().toISOString().slice(0, 10),
        reference: "",
        notes: "",
      });
    },
  });

  function onSubmit(values: TransferFormValues) {
    createMutation.mutate(values);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stock Transfers</h2>
        <p className="text-muted-foreground">
          Transfer stock between warehouses using FIFO costs.
        </p>
      </div>

      {canCreate && (
      <Card>
        <CardHeader>
          <CardTitle>New Transfer</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-3"
          >
            <div>
              <select
                {...register("source_warehouse")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={0}>Source warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {errors.source_warehouse && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.source_warehouse.message}
                </p>
              )}
            </div>

            <div>
              <select
                {...register("destination_warehouse")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={0}>Destination warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {errors.destination_warehouse && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.destination_warehouse.message}
                </p>
              )}
            </div>

            <div>
              <select
                {...register("item")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={0}>Select item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
              {errors.item && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.item.message}
                </p>
              )}
            </div>

            <div>
              <Input placeholder="Quantity" {...register("quantity")} />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.quantity.message}
                </p>
              )}

              {sourceWarehouse > 0 && selectedItem > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Available stock: {selectedStock?.quantity ?? "0.00"}
                </p>
              )}
            </div>

            <div>
              <Input type="date" {...register("transfer_date")} />
              {errors.transfer_date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.transfer_date.message}
                </p>
              )}
            </div>

            <div>
              <Input placeholder="Reference" {...register("reference")} />
            </div>

            <div className="md:col-span-3">
              <Input placeholder="Notes" {...register("notes")} />
            </div>

            <div className="md:col-span-3">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Transfer"}
              </Button>
            </div>
          </form>

          {createMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Could not create stock transfer.
            </p>
          )}
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load stock transfers.
            </p>
          )}

          {!isLoading && !isError && transfers.length === 0 && (
            <p className="text-muted-foreground">No transfers found.</p>
          )}

          {!isLoading && !isError && transfers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>{transfer.transfer_date}</TableCell>
                    <TableCell>{transfer.source_warehouse_name}</TableCell>
                    <TableCell>
                      {transfer.destination_warehouse_name}
                    </TableCell>
                    <TableCell>
                      {transfer.item_code} - {transfer.item_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {transfer.quantity}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {transfer.total_cost}
                    </TableCell>
                    <TableCell>{transfer.reference || "-"}</TableCell>
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
