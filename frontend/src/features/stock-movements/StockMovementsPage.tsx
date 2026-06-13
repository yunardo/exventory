import { useQuery } from "@tanstack/react-query";
import { useTenant } from "../../context/TenantContext";
import { getStockMovements } from "./api";

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

export function StockMovementsPage() {
  const { tenantSlug } = useTenant();

  const {
    data: movements = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stock-movements", tenantSlug],
    queryFn: getStockMovements,
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stock Movements</h2>
        <p className="text-muted-foreground">
          Unified movement history for stock entries and exits.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load stock movements.
            </p>
          )}

          {!isLoading && !isError && movements.length === 0 && (
            <p className="text-muted-foreground">No movements found.</p>
          )}

          {!isLoading && !isError && movements.length > 0 && (
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
                {movements.map((movement, index) => {
                  const isPositive =
                    movement.type === "ENTRY" ||
                    movement.type === "ADJUSTMENT_POSITIVE";
                  return (
                  <TableRow key={`${movement.type}-${movement.date}-${index}`}>
                    <TableCell>{movement.date}</TableCell>
                    <TableCell>
                      <span
                        className={
                          isPositive
                            ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700"
                            : "rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                        }
                      >
                        {movement.type}
                      </span>
                    </TableCell>
                    <TableCell>{movement.warehouse_name}</TableCell>
                    <TableCell>
                      {movement.item_code} - {movement.item_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.unit_cost ?? "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {movement.total_cost}
                    </TableCell>
                    <TableCell>{movement.reference || "-"}</TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}