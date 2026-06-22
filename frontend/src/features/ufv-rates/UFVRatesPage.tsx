import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { useTenant } from "../../context/TenantContext";
import {
  createUFVRate,
  getUFVRates,
  updateUFVRate,
  type CreateUFVRatePayload,
  type UFVRate,
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

export function UFVRatesPage() {
  const { tenantSlug } = useTenant();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUFVRatePayload>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      value: "",
    },
  });

  const { data: rates = [], isLoading, isError } = useQuery({
    queryKey: ["ufv-rates", tenantSlug],
    queryFn: getUFVRates,
  });

  const createMutation = useMutation({
    mutationFn: createUFVRate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ufv-rates", tenantSlug],
      });

      reset({
        date: new Date().toISOString().slice(0, 10),
        value: "",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUFVRate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ufv-rates", tenantSlug],
      });
    },
  });

  function onSubmit(values: CreateUFVRatePayload) {
    createMutation.mutate(values);
  }

  function handleValueChange(rate: UFVRate, value: string) {
    updateMutation.mutate({
      id: rate.id,
      value,
    });
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">UFV Rates</h2>
        <p className="text-muted-foreground">
          Manage daily UFV rates for this workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New UFV Rate</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-3"
          >
            <div>
              <Input
                type="date"
                {...register("date", {
                  required: "Date is required",
                })}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div>
              <Input
                placeholder="UFV value"
                {...register("value", {
                  required: "UFV value is required",
                })}
              />
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.value.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Rate"}
            </Button>
          </form>

          {createMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Could not create UFV rate. The date may already exist.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UFV History</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load UFV rates.
            </p>
          )}

          {!isLoading && !isError && rates.length === 0 && (
            <p className="text-muted-foreground">No UFV rates found.</p>
          )}

          {!isLoading && !isError && rates.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>{rate.date}</TableCell>

                    <TableCell>
                      <Input
                        defaultValue={rate.value}
                        className="max-w-xs"
                        onBlur={(event) => {
                          const value = event.target.value;

                          if (value !== rate.value) {
                            handleValueChange(rate, value);
                          }
                        }}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        Save on blur
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {updateMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Could not update UFV rate.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
