import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  getStockEntryDocument,
  openStockEntryDocumentPdf,
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

export function StockEntryDocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  const documentId = Number(id);

  const {
    data: document,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stock-entry-document", tenantSlug, documentId],
    queryFn: () => getStockEntryDocument(documentId),
    enabled: Number.isFinite(documentId) && documentId > 0,
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Stock Entry Document Detail
          </h2>
          <p className="text-muted-foreground">
            Review supplier, document and item lines.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/stock-entry-documents")}
        >
          Back
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {isError && (
        <p className="text-sm text-red-600">
          Could not load stock entry document.
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
                  {document.entry_date}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Supplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {document.supplier_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {document.supplier_tax_id
                    ? `NIT ${document.supplier_tax_id}`
                    : "No NIT"}
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
                onClick={() => openStockEntryDocumentPdf(document.id)}
              >
                View PDF
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
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">UFV</TableHead>
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
                          {line.unit_cost}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.total_cost}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.ufv_value ?? "-"}
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
