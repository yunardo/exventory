import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getWarehouses } from "../warehouses/api";
import { getItems } from "../items/api";
import { createStockExit, getStockExits } from "./api";
import { getCurrentStock } from "../current-stock/api";

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

const stockExitSchema = z.object({
  warehouse: z.coerce.number().min(1, "Warehouse is required"),
  item: z.coerce.number().min(1, "Item is required"),
  quantity: z.string().min(1, "Quantity is required"),
  reference: z.string().optional(),
  exit_date: z.string().min(1, "Exit date is required"),
  notes: z.string().optional(),
});

type StockExitFormInput = z.input<typeof stockExitSchema>;
type StockExitFormValues = z.output<typeof stockExitSchema>;

export function StockExitsPage() {
  const queryClient = useQueryClient();
  const { tenantSlug } = useTenant();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StockExitFormInput, unknown, StockExitFormValues>({
    resolver: zodResolver(stockExitSchema),
    defaultValues: {
      warehouse: 0,
      item: 0,
      quantity: "",
      reference: "",
      exit_date: new Date().toISOString().slice(0, 10),
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
    data: stockExits = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stock-exits", tenantSlug],
    queryFn: getStockExits,
  });

  const { data: currentStock = [] } = useQuery({
    queryKey: ["current-stock", tenantSlug],
    queryFn: getCurrentStock,
  });

  const selectedWarehouse = Number(watch("warehouse"));
  const selectedItem = Number(watch("item"));

  const selectedStock = currentStock.find(
    (row) =>
      row.warehouse_id === selectedWarehouse &&
      row.item_id === selectedItem
  );

  const createMutation = useMutation({
    mutationFn: createStockExit,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stock-exits", tenantSlug],
      });

      reset({
        warehouse: 0,
        item: 0,
        quantity: "",
        reference: "",
        exit_date: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    },
  });

  function onSubmit(values: StockExitFormValues) {
    createMutation.mutate(values);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stock Exits</h2>
        <p className="text-muted-foreground">
          Register outgoing stock for the selected workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Stock Exit</CardTitle>
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
              {selectedWarehouse > 0 && selectedItem > 0 && (
                <p className="text-sm text-muted-foreground">
                  Available stock: {selectedStock?.quantity ?? "0.00"}
                </p>
              )}
            </div>

            <div>
              <Input placeholder="Reference" {...register("reference")} />
            </div>

            <div>
              <Input type="date" {...register("exit_date")} />
              {errors.exit_date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.exit_date.message}
                </p>
              )}
            </div>

            <div>
              <Input placeholder="Notes" {...register("notes")} />
            </div>

            <div className="md:col-span-3">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Exit"}
              </Button>
            </div>
          </form>

          {createMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Could not create stock exit.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exit List</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load stock exits.
            </p>
          )}

          {!isLoading && !isError && stockExits.length === 0 && (
            <p className="text-muted-foreground">No stock exits found.</p>
          )}

          {!isLoading && !isError && stockExits.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {stockExits.map((exit) => (
                  <TableRow key={exit.id}>
                    <TableCell>{exit.exit_date}</TableCell>
                    <TableCell>{exit.warehouse_name}</TableCell>
                    <TableCell>
                      {exit.item_code} - {exit.item_name}
                    </TableCell>
                    <TableCell>{exit.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {exit.total_cost}
                    </TableCell>
                    <TableCell>{exit.reference || "-"}</TableCell>
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