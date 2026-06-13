import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getWarehouses } from "../warehouses/api";
import { getItems } from "../items/api";
import {
  createInventoryAdjustment,
  getInventoryAdjustments,
} from "./api";
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

const adjustmentSchema = z
  .object({
    warehouse: z.coerce.number().min(1, "Warehouse is required"),
    item: z.coerce.number().min(1, "Item is required"),
    adjustment_type: z.enum(["POSITIVE", "NEGATIVE"]),
    quantity: z.string().min(1, "Quantity is required"),
    unit_cost: z.string().optional(),
    reference: z.string().optional(),
    adjustment_date: z.string().min(1, "Date is required"),
    reason: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.adjustment_type === "POSITIVE" && !values.unit_cost) {
      ctx.addIssue({
        code: "custom",
        path: ["unit_cost"],
        message: "Unit cost is required for positive adjustments",
      });
    }
  });

type AdjustmentFormInput = z.input<typeof adjustmentSchema>;
type AdjustmentFormValues = z.output<typeof adjustmentSchema>;

export function InventoryAdjustmentsPage() {
  const { tenantSlug } = useTenant();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdjustmentFormInput, unknown, AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      warehouse: 0,
      item: 0,
      adjustment_type: "POSITIVE",
      quantity: "",
      unit_cost: "",
      reference: "",
      adjustment_date: new Date().toISOString().slice(0, 10),
      reason: "",
    },
  });

  const adjustmentType = watch("adjustment_type");

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses", tenantSlug],
    queryFn: getWarehouses,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items", tenantSlug],
    queryFn: getItems,
  });

  const {
    data: adjustments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["inventory-adjustments", tenantSlug],
    queryFn: getInventoryAdjustments,
  });

  const createMutation = useMutation({
    mutationFn: createInventoryAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inventory-adjustments", tenantSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["current-stock", tenantSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary", tenantSlug],
      });

      reset({
        warehouse: 0,
        item: 0,
        adjustment_type: "POSITIVE",
        quantity: "",
        unit_cost: "",
        reference: "",
        adjustment_date: new Date().toISOString().slice(0, 10),
        reason: "",
      });
    },
  });

  function onSubmit(values: AdjustmentFormValues) {
    createMutation.mutate({
      ...values,
      unit_cost:
        values.adjustment_type === "POSITIVE"
          ? values.unit_cost
          : null,
    });
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Inventory Adjustments
        </h2>
        <p className="text-muted-foreground">
          Register positive or negative stock adjustments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Adjustment</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-3"
          >
            <div>
              <select
                {...register("warehouse")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={0}>Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {errors.warehouse && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.warehouse.message}
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
              <select
                {...register("adjustment_type")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="POSITIVE">Positive adjustment</option>
                <option value="NEGATIVE">Negative adjustment</option>
              </select>
            </div>

            <div>
              <Input placeholder="Quantity" {...register("quantity")} />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {adjustmentType === "POSITIVE" && (
              <div>
                <Input placeholder="Unit cost" {...register("unit_cost")} />
                {errors.unit_cost && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.unit_cost.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <Input placeholder="Reference" {...register("reference")} />
            </div>

            <div>
              <Input type="date" {...register("adjustment_date")} />
              {errors.adjustment_date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.adjustment_date.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Input placeholder="Reason" {...register("reason")} />
            </div>

            <div className="md:col-span-3">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? "Creating..."
                  : "Create Adjustment"}
              </Button>
            </div>
          </form>

          {createMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Could not create inventory adjustment.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adjustment History</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load adjustments.
            </p>
          )}

          {!isLoading && !isError && adjustments.length === 0 && (
            <p className="text-muted-foreground">No adjustments found.</p>
          )}

          {!isLoading && !isError && adjustments.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {adjustments.map((adjustment) => (
                  <TableRow key={adjustment.id}>
                    <TableCell>{adjustment.adjustment_date}</TableCell>
                    <TableCell>
                      <span
                        className={
                          adjustment.adjustment_type === "POSITIVE"
                            ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700"
                            : "rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                        }
                      >
                        {adjustment.adjustment_type}
                      </span>
                    </TableCell>
                    <TableCell>{adjustment.warehouse_name}</TableCell>
                    <TableCell>
                      {adjustment.item_code} - {adjustment.item_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {adjustment.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {adjustment.unit_cost ?? "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {adjustment.total_cost}
                    </TableCell>
                    <TableCell>{adjustment.reference || "-"}</TableCell>
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
