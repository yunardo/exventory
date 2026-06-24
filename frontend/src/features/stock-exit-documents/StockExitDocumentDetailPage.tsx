import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  getStockExitDocument,
  openGeneratedStockExitPdf,
  openStockExitDocumentPdf,
} from "./api";
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

export function StockExitDocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  const documentId = Number(id);

  const {
    data: document,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stock-exit-document", tenantSlug, documentId],
    queryFn: () => getStockExitDocument(documentId),
    enabled: Number.isFinite(documentId) && documentId > 0,
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Stock Exit Document Detail
          </h2>
          <p className="text-muted-foreground">
            Review requester, unit and item lines.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/stock-exit-documents")}
        >
          Back
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {isError && (
        <p className="text-sm text-red-600">
          Could not load stock exit document.
        </p>
      )}

      {document && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {document.document_type} {document.document_number}
                </p>
                <p className="text-sm text-muted-foreground">
                  {document.exit_date}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Requester
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {document.requester_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {document.requesting_unit}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {document.total_amount}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {document.status}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p>
                <span className="font-semibold">Responsible:</span>{" "}
                {document.responsible_name || "-"}
              </p>

              <p>
                <span className="font-semibold">Reason:</span>{" "}
                {document.reason || "-"}
              </p>

              <p>
                <span className="font-semibold">Notes:</span>{" "}
                {document.notes || "-"}
              </p>

              {document.cancellation_reason && (
                <p>
                  <span className="font-semibold">Cancellation reason:</span>{" "}
                  {document.cancellation_reason}
                </p>
              )}

              <Button
                variant="outline"
                disabled={!document.document_pdf}
                onClick={() => openStockExitDocumentPdf(document.id)}
              >
                View PDF
              </Button>

              <Button
                variant="outline"
                onClick={() => openGeneratedStockExitPdf(document.id)}
              >
                Generate PDF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lines</CardTitle>
            </CardHeader>

            <CardContent>
              {document.lines_detail.length === 0 ? (
                <p className="text-muted-foreground">No lines found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {document.lines_detail.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.warehouse_name}</TableCell>
                        <TableCell>
                          {line.item_code} - {line.item_name}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.total_cost}
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
