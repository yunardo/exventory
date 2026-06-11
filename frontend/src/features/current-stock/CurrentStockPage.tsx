import { useQuery } from "@tanstack/react-query";
import { getCurrentStock } from "./api";

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

export function CurrentStockPage() {
  const { tenantSlug } = useTenant();

  const {
    data: currentStock = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["current-stock", tenantSlug],
    queryFn: getCurrentStock,
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Current Stock</h2>
        <p className="text-muted-foreground">
          Current balance by warehouse and item.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Balance</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load current stock.
            </p>
          )}

          {!isLoading && !isError && currentStock.length === 0 && (
            <p className="text-muted-foreground">No stock found.</p>
          )}

          {!isLoading && !isError && currentStock.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentStock.map((row) => (
                  <TableRow key={`${row.warehouse_id}-${row.item_id}`}>
                    <TableCell>{row.warehouse_name}</TableCell>
                    <TableCell>
                      {row.item_code} - {row.item_name}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.quantity}
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