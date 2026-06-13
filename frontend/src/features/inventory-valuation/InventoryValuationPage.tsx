import { useQuery } from "@tanstack/react-query";
import { useTenant } from "../../context/TenantContext";
import {
  exportInventoryValuation,
  getInventoryValuation,
} from "./api";

import { Button } from "@/components/ui/button";
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

export function InventoryValuationPage() {
  const { tenantSlug } = useTenant();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["inventory-valuation", tenantSlug],
    queryFn: getInventoryValuation,
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Inventory Valuation
          </h2>
          <p className="text-muted-foreground">
            Inventory value by warehouse.
          </p>
        </div>

        <Button variant="outline" onClick={exportInventoryValuation}>
          Export Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Inventory Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            {data?.total_inventory_value ?? "0.00"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Valuation</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load inventory valuation.
            </p>
          )}

          {!isLoading && !isError && data?.warehouses.length === 0 && (
            <p className="text-muted-foreground">No valuation data found.</p>
          )}

          {!isLoading && !isError && data && data.warehouses.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Inventory Value</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.warehouses.map((warehouse) => (
                  <TableRow key={warehouse.warehouse_id}>
                    <TableCell>{warehouse.warehouse_name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {warehouse.inventory_value}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow>
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell className="text-right font-bold">
                    {data.total_inventory_value}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
