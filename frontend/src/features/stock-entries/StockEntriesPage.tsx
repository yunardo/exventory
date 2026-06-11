import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getWarehouses } from "../warehouses/api";
import { getItems } from "../items/api";
import { createStockEntry, getStockEntries } from "./api";

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
import { useTenant } from "../../context/TenantContext";

const stockEntrySchema = z.object({
  warehouse: z.coerce.number().min(1, "Warehouse is required"),
  item: z.coerce.number().min(1, "Item is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unit_cost: z.string().min(1, "Unit cost is required"),
  reference: z.string().optional(),
  entry_date: z.string().min(1, "Entry date is required"),
  notes: z.string().optional(),
});

type StockEntryFormInput = z.input<typeof stockEntrySchema>;
type StockEntryFormValues = z.output<typeof stockEntrySchema>;

export function StockEntriesPage() {
  const queryClient = useQueryClient();
  const { tenantSlug } = useTenant();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockEntryFormInput, unknown, StockEntryFormValues>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: {
      warehouse: 0,
      item: 0,
      quantity: "",
      unit_cost: "",
      reference: "",
      entry_date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses", tenantSlug],
    queryFn: getWarehouses,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items", tenantSlug],
    queryFn: getItems,
  });

  const {
    data: stockEntries = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stock-entries", tenantSlug],
    queryFn: getStockEntries,
  });

  const createMutation = useMutation({
    mutationFn: createStockEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stock-entries", tenantSlug],
      });

      reset({
        warehouse: 0,
        item: 0,
        quantity: "",
        unit_cost: "",
        reference: "",
        entry_date: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    },
  });

  function onSubmit(values: StockEntryFormValues) {
    createMutation.mutate(values);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stock Entries</h2>
        <p className="text-muted-foreground">
          Register incoming stock for the selected workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Stock Entry</CardTitle>
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
              <Input placeholder="Quantity" {...register("quantity")} />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div>
              <Input placeholder="Unit cost" {...register("unit_cost")} />
              {errors.unit_cost && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.unit_cost.message}
                </p>
              )}
            </div>

            <div>
              <Input placeholder="Reference" {...register("reference")} />
            </div>

            <div>
              <Input type="date" {...register("entry_date")} />
              {errors.entry_date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.entry_date.message}
                </p>
              )}
            </div>

            <div className="md:col-span-3">
              <Input placeholder="Notes" {...register("notes")} />
            </div>

            <div className="md:col-span-3">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Entry"}
              </Button>
            </div>
          </form>

          {createMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Could not create stock entry.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entry List</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load stock entries.
            </p>
          )}

          {!isLoading && !isError && stockEntries.length === 0 && (
            <p className="text-muted-foreground">No stock entries found.</p>
          )}

          {!isLoading && !isError && stockEntries.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {stockEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.entry_date}</TableCell>
                    <TableCell>{entry.warehouse_name}</TableCell>
                    <TableCell>
                      {entry.item_code} - {entry.item_name}
                    </TableCell>
                    <TableCell>{entry.quantity}</TableCell>
                    <TableCell>{entry.unit_cost}</TableCell>
                    <TableCell>{entry.reference || "-"}</TableCell>
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