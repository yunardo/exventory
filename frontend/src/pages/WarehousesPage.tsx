import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createWarehouse,
  getWarehouses,
} from "../api/warehouses";

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

const warehouseSchema = z.object({
  name: z.string().min(2, "Name must have at least 2 characters"),
  code: z.string().optional(),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export function WarehousesPage() {
  const queryClient = useQueryClient();
  const tenantSlug = localStorage.getItem("tenant_slug");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  const {
    data: warehouses = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["warehouses", tenantSlug],
    queryFn: getWarehouses,
  });

  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouses", tenantSlug],
      });
      reset();
    },
  });

  function onSubmit(values: WarehouseFormValues) {
    createMutation.mutate(values);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Warehouses</h2>
        <p className="text-muted-foreground">
          Manage warehouses for the selected workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Warehouse</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-3"
          >
            <div>
              <Input placeholder="Warehouse name" {...register("name")} />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Input placeholder="Code" {...register("code")} />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.code.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </form>

          {createMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Could not create warehouse.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse List</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load warehouses.
            </p>
          )}

          {!isLoading && !isError && warehouses.length === 0 && (
            <p className="text-muted-foreground">No warehouses found.</p>
          )}

          {!isLoading && !isError && warehouses.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">
                      {warehouse.name}
                    </TableCell>
                    <TableCell>{warehouse.code ?? "-"}</TableCell>
                    <TableCell>
                      {warehouse.is_active === false ? "Inactive" : "Active"}
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