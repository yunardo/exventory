import { useQuery } from "@tanstack/react-query";
import { useTenant } from "../../context/TenantContext";
import { getUFVRevaluationRuns } from "./api";

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

export function UFVRevaluationRunsPage() {
  const { tenantSlug } = useTenant();

  const {
    data: runs = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["ufv-revaluation-runs", tenantSlug],
    queryFn: getUFVRevaluationRuns,
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          UFV Revaluation Runs
        </h2>
        <p className="text-muted-foreground">
          Historical UFV revaluations applied to inventory.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applied Revaluations</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {isError && (
            <p className="text-sm text-red-600">
              Could not load UFV revaluation runs.
            </p>
          )}

          {!isLoading && !isError && runs.length === 0 && (
            <p className="text-muted-foreground">
              No UFV revaluation runs found.
            </p>
          )}

          {!isLoading && !isError && runs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Closing Date</TableHead>
                  <TableHead>Closing UFV</TableHead>
                  <TableHead className="text-right">Original Value</TableHead>
                  <TableHead className="text-right">Updated Value</TableHead>
                  <TableHead className="text-right">Revaluation</TableHead>
                  <TableHead>Applied By</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{run.closing_date}</TableCell>
                    <TableCell>{run.closing_ufv}</TableCell>
                    <TableCell className="text-right">
                      {run.total_original_value}
                    </TableCell>
                    <TableCell className="text-right">
                      {run.total_updated_value}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {run.total_revaluation}
                    </TableCell>
                    <TableCell>{run.applied_by_username ?? "-"}</TableCell>
                    <TableCell>
                      {new Date(run.created_at).toLocaleString()}
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
