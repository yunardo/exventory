import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "./api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTenant } from "../../context/TenantContext";
import { getInventoryValuation } from "../inventory-valuation/api";
import { getStockMovements } from "../stock-movements/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function DashboardPage() {
  const { tenantSlug } = useTenant();

  const {
    data: summary,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboard-summary", tenantSlug],
    queryFn: getDashboardSummary,
  });

  const cards = [
    { title: "Warehouses", value: summary?.total_warehouses ?? 0 },
    { title: "Items", value: summary?.total_items ?? 0 },
    { title: "Stock Entries", value: summary?.total_stock_entries ?? 0 },
    { title: "Stock Exits", value: summary?.total_stock_exits ?? 0 },
    { title: "Current Quantity", value: summary?.current_quantity ?? "0.00" },
    { title: "Inventory Value", value: summary?.current_value ?? "0.00" },
  ];

  const { data: valuation } = useQuery({
    queryKey: ["inventory-valuation", tenantSlug],
    queryFn: getInventoryValuation,
  });

  const valuationChartData =
  valuation?.warehouses.map((warehouse) => ({
    warehouse: warehouse.warehouse_name,
    value: Number(warehouse.inventory_value),
  })) ?? [];

  const { data: movements = [] } = useQuery({
    queryKey: ["stock-movements", tenantSlug],
    queryFn: getStockMovements,
  });

  const recentMovements = movements.slice(0, 5);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your current inventory workspace.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading summary...</p>}

      {isError && (
        <p className="text-sm text-red-600">
          Could not load dashboard summary.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Inventory Value by Warehouse</CardTitle>
        </CardHeader>

        <CardContent className="h-80">
          {valuationChartData.length === 0 ? (
            <p className="text-muted-foreground">No valuation data found.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valuationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="warehouse" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Movements</CardTitle>
        </CardHeader>

        <CardContent>
          {recentMovements.length === 0 ? (
            <p className="text-muted-foreground">No recent movements.</p>
          ) : (
            <div className="space-y-4">
              {recentMovements.map((movement, index) => (
                <div
                  key={`${movement.type}-${movement.date}-${index}`}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {movement.type} · {movement.item_code} - {movement.item_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {movement.date} · {movement.warehouse_name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{movement.quantity}</p>
                    <p className="text-sm text-muted-foreground">
                      {movement.total_cost}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}