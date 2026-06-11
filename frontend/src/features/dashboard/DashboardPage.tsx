import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "./api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTenant } from "../../context/TenantContext";

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
  ];

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
    </section>
  );
}