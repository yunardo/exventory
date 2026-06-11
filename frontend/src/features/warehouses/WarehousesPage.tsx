import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createWarehouse,
  deleteWarehouse,
  getWarehouses,
  updateWarehouse,
  type Warehouse,
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
import { useTenant } from "../../context/TenantContext";

const warehouseSchema = z.object({
  name: z.string().min(2, "Name must have at least 2 characters"),
  location: z.string().optional(),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export function WarehousesPage() {
  const queryClient = useQueryClient();
  const { tenantSlug } = useTenant();
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      location: "",
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

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouses", tenantSlug],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouses", tenantSlug],
      });

      setEditingWarehouse(null);

      reset({
        name: "",
        location: "",
      });
    },
  });

  function onSubmit(values: WarehouseFormValues) {
    if (editingWarehouse) {
      updateMutation.mutate({
        id: editingWarehouse.id,
        ...values,
      });
      return;
    }

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
          <CardTitle>{editingWarehouse ? "Edit Warehouse" : "New Warehouse"}</CardTitle>
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
              <Input placeholder="Location" {...register("location")} />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.location.message}
                </p>
              )}
            </div>

            {editingWarehouse && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingWarehouse(null);
                  reset({
                    name: "",
                    location: "",
                  });
                }}
              >
                Cancel
              </Button>
            )}

            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingWarehouse
                ? updateMutation.isPending
                  ? "Updating..."
                  : "Update"
                : createMutation.isPending
                  ? "Creating..."
                  : "Create"}
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
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">
                      {warehouse.name}
                    </TableCell>
                    <TableCell>{warehouse.location ?? "-"}</TableCell>
                    <TableCell>
                      {warehouse.is_active === false ? "Inactive" : "Active"}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingWarehouse(warehouse);
                          reset({
                            name: warehouse.name,
                            location: warehouse.location ?? "",
                          });
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (confirm(`Delete warehouse "${warehouse.name}"?`)) {
                            deleteMutation.mutate(warehouse.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
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