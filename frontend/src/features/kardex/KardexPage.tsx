import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getWarehouses } from "../warehouses/api";
import { getItems } from "../items/api";
import { getKardex } from "./api";
import { useTenant } from "../../context/TenantContext";

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

export function KardexPage() {
  const { tenantSlug } = useTenant();

  const [warehouseId, setWarehouseId] = useState(0);
  const [itemId, setItemId] = useState(0);
  const [filters, setFilters] = useState({
    warehouseId: 0,
    itemId: 0,
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
    data: rows = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["kardex", tenantSlug, filters.warehouseId, filters.itemId],
    queryFn: () => getKardex(filters.warehouseId, filters.itemId),
    enabled: filters.warehouseId > 0 && filters.itemId > 0,
  });

  function handleSearch() {
    setFilters({
      warehouseId,
      itemId,
    });
  }

  const canSearch = warehouseId > 0 && itemId > 0;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Kardex</h2>
        <p className="text-muted-foreground">
          Movement history and running balance by warehouse and item.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={0}>Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>

            <select
              value={itemId}
              onChange={(e) => setItemId(Number(e.target.value))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={0}>Select item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>

            <Button disabled={!canSearch} onClick={handleSearch}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kardex Detail</CardTitle>
        </CardHeader>

        <CardContent>
          {filters.warehouseId === 0 || filters.itemId === 0 ? (
            <p className="text-muted-foreground">
              Select a warehouse and item to view Kardex.
            </p>
          ) : isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : isError ? (
            <p className="text-sm text-red-600">Could not load Kardex.</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">No movements found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Exit</TableHead>
                  <TableHead className="text-right">Balance Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Movement Cost</TableHead>
                  <TableHead className="text-right">Balance Value</TableHead>
                  <TableHead className="text-right">Avg Balance Cost</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((row, index) => {
                  const isPositive =
                    row.type === "ENTRY" ||
                    row.type === "ADJUSTMENT_POSITIVE" ||
                    row.type === "TRANSFER_IN";

                  const isTransfer =
                    row.type === "TRANSFER_IN" ||
                    row.type === "TRANSFER_OUT";
                  return (
                  <TableRow key={`${row.date}-${row.type}-${index}`}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>
                      <span
                        className={
                          isTransfer
                            ? "rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700"
                            : isPositive
                              ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700"
                              : "rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                        }
                      >
                        {row.type}
                      </span>
                    </TableCell>
                    <TableCell>{row.reference || "-"}</TableCell>
                    <TableCell className="text-right">
                      {row.entry_quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.exit_quantity}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.balance_quantity}
                    </TableCell>
                    <TableCell className="text-right">{row.unit_cost}</TableCell>
                    <TableCell className="text-right font-medium">
                      {row.total_cost}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.balance_value}
                    </TableCell>

                    <TableCell className="text-right">
                      {row.average_balance_cost}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}