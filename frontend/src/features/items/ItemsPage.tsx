import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createItem,
  deleteItem,
  getItems,
  updateItem,
  type Item,
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

const itemSchema = z.object({
  code: z.string().min(2, "Code must have at least 2 characters"),
  name: z.string().min(2, "Name must have at least 2 characters"),
  description: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export function ItemsPage() {
  const queryClient = useQueryClient();
  const { tenantSlug } = useTenant();
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      unit: "unit",
    },
  });

  const {
    data: items = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["items", tenantSlug],
    queryFn: getItems,
  });

  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", tenantSlug] });
      reset({
        code: "",
        name: "",
        description: "",
        unit: "unit",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", tenantSlug] });
      setEditingItem(null);
      reset({
        code: "",
        name: "",
        description: "",
        unit: "unit",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", tenantSlug] });
    },
  });

  function onSubmit(values: ItemFormValues) {
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        ...values,
      });
      return;
    }

    createMutation.mutate(values);
  }

  function handleCancelEdit() {
    setEditingItem(null);
    reset({
      code: "",
      name: "",
      description: "",
      unit: "unit",
    });
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Items</h2>
        <p className="text-muted-foreground">
          Manage inventory items for the selected workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingItem ? "Edit Item" : "New Item"}</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-4"
          >
            <div>
              <Input placeholder="Code" {...register("code")} />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div>
              <Input placeholder="Name" {...register("name")} />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Input placeholder="Description" {...register("description")} />
            </div>

            <div>
              <Input placeholder="Unit" {...register("unit")} />
              {errors.unit && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.unit.message}
                </p>
              )}
            </div>

            <div className="flex gap-2 md:col-span-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingItem
                  ? updateMutation.isPending
                    ? "Updating..."
                    : "Update"
                  : createMutation.isPending
                    ? "Creating..."
                    : "Create"}
              </Button>

              {editingItem && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {(createMutation.isError || updateMutation.isError) && (
            <p className="mt-4 text-sm text-red-600">
              Could not save item.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Item List</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">Could not load items.</p>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <p className="text-muted-foreground">No items found.</p>
          )}

          {!isLoading && !isError && items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.description || "-"}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      {item.is_active ? "Active" : "Inactive"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            reset({
                              code: item.code,
                              name: item.name,
                              description: item.description ?? "",
                              unit: item.unit,
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
                            if (confirm(`Delete item "${item.name}"?`)) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
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