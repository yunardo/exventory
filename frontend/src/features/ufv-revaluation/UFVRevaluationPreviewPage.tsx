import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTenant } from "../../context/TenantContext";
import { getUFVRevaluationPreview } from "./api";

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

export function UFVRevaluationPreviewPage() {
  const { tenantSlug } = useTenant();

  const [closingDate, setClosingDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["ufv-revaluation-preview", tenantSlug, selectedDate],
    queryFn: () => getUFVRevaluationPreview(selectedDate),
    enabled: Boolean(selectedDate),
  });

  function handlePreview() {
    if (!closingDate) return;
    setSelectedDate(closingDate);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          UFV Revaluation Preview
        </h2>
        <p className="text-muted-foreground">
          Preview inventory revaluation based on a closing UFV rate.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Closing Date</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex gap-3">
            <Input
              type="date"
              value={closingDate}
              onChange={(event) => setClosingDate(event.target.value)}
              className="max-w-xs"
            />

            <Button disabled={!closingDate} onClick={handlePreview}>
              Preview
            </Button>
          </div>

          {isError && (
            <p className="mt-4 text-sm text-red-600">
              {(error as any)?.response?.data?.detail ||
                "Could not load UFV revaluation preview."}
            </p>
          )}
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Original Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {data.total_original_value}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Updated Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {data.total_updated_value}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Revaluation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {data.total_revaluation}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Detail · UFV {data.closing_ufv} · {data.closing_date}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {isLoading && <p className="text-muted-foreground">Loading...</p>}

              {data.rows.length === 0 ? (
                <p className="text-muted-foreground">
                  No stock layers with UFV value found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Purchase UFV</TableHead>
                      <TableHead className="text-right">Original Cost</TableHead>
                      <TableHead className="text-right">Updated Cost</TableHead>
                      <TableHead className="text-right">Revaluation</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data.rows.map((row, index) => (
                      <TableRow key={`${row.warehouse_id}-${row.item_id}-${index}`}>
                        <TableCell>{row.warehouse_name}</TableCell>
                        <TableCell>
                          {row.item_code} - {row.item_name}
                        </TableCell>
                        <TableCell>{row.entry_date}</TableCell>
                        <TableCell className="text-right">{row.quantity}</TableCell>
                        <TableCell className="text-right">
                          {row.purchase_ufv}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.original_total}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.updated_total}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {row.revaluation_amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
