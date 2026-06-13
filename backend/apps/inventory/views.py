from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.core.api import TenantRequiredMixin
from apps.tenancy.permissions import IsTenantMember
from apps.core.audit_mixins import AuditCrudMixin
from .models import Warehouse, Item, StockEntry, StockExit
from .models import StockLayer, InventoryAdjustment
from .models import StockTransfer
from .serializers import StockTransferSerializer
from .serializers import WarehouseSerializer
from .serializers import ItemSerializer
from .serializers import StockEntrySerializer
from .serializers import StockExitSerializer
from .serializers import InventoryAdjustmentSerializer
from django.db.models import Sum, F, DecimalField, ExpressionWrapper
from decimal import Decimal

from io import BytesIO
from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment


class WarehouseViewSet(AuditCrudMixin, TenantRequiredMixin, ModelViewSet):
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        # Se evalúa ya dentro del request, con tenant en el contexto ✅
        return Warehouse.objects.all()


class ItemViewSet(AuditCrudMixin, TenantRequiredMixin, ModelViewSet):
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        return Item.objects.all()


class StockEntryViewSet(AuditCrudMixin, TenantRequiredMixin, ModelViewSet):
    serializer_class = StockEntrySerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        return StockEntry.objects.select_related("warehouse", "item").all()
    
    def perform_create(self, serializer):
        tenant = self.request.tenant

        stock_entry = serializer.save(tenant=tenant)

        StockLayer.objects.create(
            tenant=tenant,
            stock_entry=stock_entry,
            warehouse=stock_entry.warehouse,
            item=stock_entry.item,
            original_quantity=stock_entry.quantity,
            remaining_quantity=stock_entry.quantity,
            unit_cost=stock_entry.unit_cost,
            entry_date=stock_entry.entry_date,
        )


class StockExitViewSet(AuditCrudMixin, TenantRequiredMixin, ModelViewSet):
    serializer_class = StockExitSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        return (
            StockExit.objects
            .select_related("warehouse", "item")
            .prefetch_related("allocations")
            .all()
        )


class CurrentStockView(TenantRequiredMixin, APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        layer_total_cost = ExpressionWrapper(
            F("remaining_quantity") * F("unit_cost"),
            output_field=DecimalField(max_digits=18, decimal_places=2),
        )

        rows = (
            StockLayer.objects
            .select_related("warehouse", "item")
            .values(
                "warehouse_id",
                "warehouse__name",
                "item_id",
                "item__code",
                "item__name",
            )
            .annotate(
                quantity=Sum("remaining_quantity"),
                total_cost=Sum(layer_total_cost),
            )
        )

        result = []

        for row in rows:
            quantity = row["quantity"] or Decimal("0")
            total_cost = row["total_cost"] or Decimal("0")

            average_cost = (
                total_cost / quantity
                if quantity > 0
                else Decimal("0")
            )

            result.append({
                "warehouse_id": row["warehouse_id"],
                "warehouse_name": row["warehouse__name"],
                "item_id": row["item_id"],
                "item_code": row["item__code"],
                "item_name": row["item__name"],
                "quantity": str(quantity.quantize(Decimal("0.01"))),
                "average_cost": str(average_cost.quantize(Decimal("0.01"))),
                "total_cost": str(total_cost.quantize(Decimal("0.01"))),
            })

        return Response(result)


class DashboardSummaryView(TenantRequiredMixin, APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        total_warehouses = Warehouse.objects.count()
        total_items = Item.objects.count()
        total_entries = StockEntry.objects.count()
        total_exits = StockExit.objects.count()

        entries_quantity = (
            StockEntry.objects.aggregate(total=Sum("quantity")).get("total")
            or Decimal("0")
        )

        exits_quantity = (
            StockExit.objects.aggregate(total=Sum("quantity")).get("total")
            or Decimal("0")
        )

        current_quantity = entries_quantity - exits_quantity

        entry_total_cost = ExpressionWrapper(
            F("quantity") * F("unit_cost"),
            output_field=DecimalField(max_digits=18, decimal_places=2),
        )

        total_entry_cost = (
            StockEntry.objects
            .aggregate(total=Sum(entry_total_cost))
            .get("total")
            or Decimal("0")
        )

        layer_total_cost = ExpressionWrapper(
            F("remaining_quantity") * F("unit_cost"),
            output_field=DecimalField(max_digits=18, decimal_places=2),
        )

        current_quantity = (
            StockLayer.objects.aggregate(total=Sum("remaining_quantity")).get("total")
            or Decimal("0")
        )

        current_value = (
            StockLayer.objects.aggregate(total=Sum(layer_total_cost)).get("total")
            or Decimal("0")
        )

        return Response({
            "total_warehouses": total_warehouses,
            "total_items": total_items,
            "total_stock_entries": total_entries,
            "total_stock_exits": total_exits,
            "current_quantity": str(current_quantity),
            "current_value": str(total_entry_cost),
            "current_quantity": str(current_quantity.quantize(Decimal("0.01"))),
            "current_value": str(current_value.quantize(Decimal("0.01"))),
        })


class StockMovementHistoryView(TenantRequiredMixin, APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        entries = [
            {
                "type": "ENTRY",
                "date": entry.entry_date,
                "warehouse_name": entry.warehouse.name,
                "item_code": entry.item.code,
                "item_name": entry.item.name,
                "quantity": str(entry.quantity),
                "unit_cost": str(entry.unit_cost),
                "total_cost": str((entry.quantity * entry.unit_cost).quantize(Decimal("0.01"))),
                "reference": entry.reference,
                "notes": entry.notes,
            }
            for entry in StockEntry.objects.select_related("warehouse", "item").all()
        ]

        exits = []

        for stock_exit in (
            StockExit.objects
            .select_related("warehouse", "item")
            .prefetch_related("allocations")
            .all()
        ):
            total_cost = sum(
                (
                    allocation.quantity * allocation.unit_cost
                    for allocation in stock_exit.allocations.all()
                ),
                Decimal("0"),
            )

            exits.append({
                "type": "EXIT",
                "date": stock_exit.exit_date,
                "warehouse_name": stock_exit.warehouse.name,
                "item_code": stock_exit.item.code,
                "item_name": stock_exit.item.name,
                "quantity": str(stock_exit.quantity),
                "unit_cost": None,
                "total_cost": str(total_cost.quantize(Decimal("0.01"))),
                "reference": stock_exit.reference,
                "notes": stock_exit.notes,
            })

        adjustments = []

        for adjustment in (
            InventoryAdjustment.objects
            .select_related("warehouse", "item")
            .prefetch_related("allocations")
            .all()
        ):
            if adjustment.adjustment_type == InventoryAdjustment.TYPE_POSITIVE:
                total_cost = adjustment.quantity * adjustment.unit_cost
                unit_cost = adjustment.unit_cost
            else:
                total_cost = sum(
                    (
                        allocation.quantity * allocation.unit_cost
                        for allocation in adjustment.allocations.all()
                    ),
                    Decimal("0"),
                )
                unit_cost = None

            adjustments.append({
                "type": f"ADJUSTMENT_{adjustment.adjustment_type}",
                "date": adjustment.adjustment_date,
                "warehouse_name": adjustment.warehouse.name,
                "item_code": adjustment.item.code,
                "item_name": adjustment.item.name,
                "quantity": str(adjustment.quantity),
                "unit_cost": str(unit_cost) if unit_cost is not None else None,
                "total_cost": str(total_cost.quantize(Decimal("0.01"))),
                "reference": adjustment.reference,
                "notes": adjustment.reason,
            })
        
        transfers = []

        for transfer in (
            StockTransfer.objects
            .select_related("source_warehouse", "destination_warehouse", "item")
            .prefetch_related("allocations")
            .all()
        ):
            total_cost = sum(
                (
                    allocation.quantity * allocation.unit_cost
                    for allocation in transfer.allocations.all()
                ),
                Decimal("0"),
            )

            transfers.append({
                "type": "TRANSFER",
                "date": transfer.transfer_date,
                "warehouse_name": f"{transfer.source_warehouse.name} → {transfer.destination_warehouse.name}",
                "item_code": transfer.item.code,
                "item_name": transfer.item.name,
                "quantity": str(transfer.quantity),
                "unit_cost": None,
                "total_cost": str(total_cost.quantize(Decimal("0.01"))),
                "reference": transfer.reference,
                "notes": transfer.notes,
            })

        movements = entries + exits + adjustments + transfers
        movements.sort(key=lambda row: row["date"], reverse=True)

        return Response(movements)


class KardexView(TenantRequiredMixin, APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        warehouse_id = request.query_params.get("warehouse")
        item_id = request.query_params.get("item")

        if not warehouse_id or not item_id:
            return Response(
                {"detail": "warehouse and item query params are required."},
                status=400,
            )

        movements = []

        entries = (
            StockEntry.objects
            .select_related("warehouse", "item")
            .filter(warehouse_id=warehouse_id, item_id=item_id)
        )

        for entry in entries:
            movements.append({
                "date": entry.entry_date,
                "type": "ENTRY",
                "reference": entry.reference,
                "entry_quantity": entry.quantity,
                "exit_quantity": Decimal("0"),
                "unit_cost": entry.unit_cost,
                "total_cost": entry.quantity * entry.unit_cost,
                "sort_id": entry.id,
            })

        exits = (
            StockExit.objects
            .select_related("warehouse", "item")
            .prefetch_related("allocations")
            .filter(warehouse_id=warehouse_id, item_id=item_id)
        )

        for stock_exit in exits:
            total_cost = sum(
                (
                    allocation.quantity * allocation.unit_cost
                    for allocation in stock_exit.allocations.all()
                ),
                Decimal("0"),
            )

            average_exit_cost = (
                total_cost / stock_exit.quantity
                if stock_exit.quantity > 0
                else Decimal("0")
            )

            movements.append({
                "date": stock_exit.exit_date,
                "type": "EXIT",
                "reference": stock_exit.reference,
                "entry_quantity": Decimal("0"),
                "exit_quantity": stock_exit.quantity,
                "unit_cost": average_exit_cost,
                "total_cost": total_cost,
                "sort_id": stock_exit.id,
            })
        
        adjustments = (
            InventoryAdjustment.objects
            .select_related("warehouse", "item")
            .prefetch_related("allocations")
            .filter(warehouse_id=warehouse_id, item_id=item_id)
        )

        for adjustment in adjustments:
            if adjustment.adjustment_type == InventoryAdjustment.TYPE_POSITIVE:
                total_cost = adjustment.quantity * adjustment.unit_cost

                movements.append({
                    "date": adjustment.adjustment_date,
                    "type": "ADJUSTMENT_POSITIVE",
                    "reference": adjustment.reference,
                    "entry_quantity": adjustment.quantity,
                    "exit_quantity": Decimal("0"),
                    "unit_cost": adjustment.unit_cost,
                    "total_cost": total_cost,
                    "sort_id": adjustment.id,
                })

            if adjustment.adjustment_type == InventoryAdjustment.TYPE_NEGATIVE:
                total_cost = sum(
                    (
                        allocation.quantity * allocation.unit_cost
                        for allocation in adjustment.allocations.all()
                    ),
                    Decimal("0"),
                )

                average_exit_cost = (
                    total_cost / adjustment.quantity
                    if adjustment.quantity > 0
                    else Decimal("0")
                )

                movements.append({
                    "date": adjustment.adjustment_date,
                    "type": "ADJUSTMENT_NEGATIVE",
                    "reference": adjustment.reference,
                    "entry_quantity": Decimal("0"),
                    "exit_quantity": adjustment.quantity,
                    "unit_cost": average_exit_cost,
                    "total_cost": total_cost,
                    "sort_id": adjustment.id,
                })
        
        transfers_out = (
            StockTransfer.objects
            .select_related("source_warehouse", "destination_warehouse", "item")
            .prefetch_related("allocations")
            .filter(source_warehouse_id=warehouse_id, item_id=item_id)
        )

        for transfer in transfers_out:
            total_cost = sum(
                (
                    allocation.quantity * allocation.unit_cost
                    for allocation in transfer.allocations.all()
                ),
                Decimal("0"),
            )

            average_cost = (
                total_cost / transfer.quantity
                if transfer.quantity > 0
                else Decimal("0")
            )

            movements.append({
                "date": transfer.transfer_date,
                "type": "TRANSFER_OUT",
                "reference": transfer.reference,
                "entry_quantity": Decimal("0"),
                "exit_quantity": transfer.quantity,
                "unit_cost": average_cost,
                "total_cost": total_cost,
                "sort_id": transfer.id,
            })

        transfers_in = (
            StockTransfer.objects
            .select_related("source_warehouse", "destination_warehouse", "item")
            .prefetch_related("allocations")
            .filter(destination_warehouse_id=warehouse_id, item_id=item_id)
        )

        for transfer in transfers_in:
            total_cost = sum(
                (
                    allocation.quantity * allocation.unit_cost
                    for allocation in transfer.allocations.all()
                ),
                Decimal("0"),
            )

            average_cost = (
                total_cost / transfer.quantity
                if transfer.quantity > 0
                else Decimal("0")
            )

            movements.append({
                "date": transfer.transfer_date,
                "type": "TRANSFER_IN",
                "reference": transfer.reference,
                "entry_quantity": transfer.quantity,
                "exit_quantity": Decimal("0"),
                "unit_cost": average_cost,
                "total_cost": total_cost,
                "sort_id": transfer.id,
            })

        movements.sort(key=lambda row: (row["date"], row["sort_id"]))

        balance_quantity = Decimal("0")
        balance_value = Decimal("0")
        result = []

        for row in movements:
            if row["type"] == "ENTRY":
                balance_quantity += row["entry_quantity"]
                balance_value += row["total_cost"]

            if row["type"] == "EXIT":
                balance_quantity -= row["exit_quantity"]
                balance_value -= row["total_cost"]

            average_balance_cost = (
                balance_value / balance_quantity
                if balance_quantity > 0
                else Decimal("0")
            )

            result.append({
                "date": row["date"],
                "type": row["type"],
                "reference": row["reference"],
                "entry_quantity": str(row["entry_quantity"].quantize(Decimal("0.01"))),
                "exit_quantity": str(row["exit_quantity"].quantize(Decimal("0.01"))),
                "balance_quantity": str(balance_quantity.quantize(Decimal("0.01"))),
                "unit_cost": str(row["unit_cost"].quantize(Decimal("0.01"))),
                "total_cost": str(row["total_cost"].quantize(Decimal("0.01"))),
                "balance_value": str(balance_value.quantize(Decimal("0.01"))),
                "average_balance_cost": str(average_balance_cost.quantize(Decimal("0.01"))),
            })

        return Response(result)


class InventoryAdjustmentViewSet(AuditCrudMixin, TenantRequiredMixin, ModelViewSet):
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        return (
            InventoryAdjustment.objects
            .select_related("warehouse", "item")
            .prefetch_related("allocations")
            .all()
        )


class StockTransferViewSet(AuditCrudMixin, TenantRequiredMixin, ModelViewSet):
    serializer_class = StockTransferSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        return (
            StockTransfer.objects
            .select_related("source_warehouse", "destination_warehouse", "item")
            .prefetch_related("allocations")
            .all()
        )


class KardexExportView(KardexView):
    def get(self, request):
        response = super().get(request)

        if response.status_code != 200:
            return response

        rows = response.data

        wb = Workbook()
        ws = wb.active
        ws.title = "Kardex"

        headers = [
            "Date",
            "Type",
            "Reference",
            "Entry Qty",
            "Exit Qty",
            "Balance Qty",
            "Unit Cost",
            "Movement Cost",
            "Balance Value",
            "Avg Balance Cost",
        ]

        ws.append(headers)

        header_fill = PatternFill("solid", fgColor="1E293B")
        header_font = Font(color="FFFFFF", bold=True)

        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")

        for row in rows:
            ws.append([
                row["date"],
                row["type"],
                row["reference"],
                row["entry_quantity"],
                row["exit_quantity"],
                row["balance_quantity"],
                row["unit_cost"],
                row["total_cost"],
                row["balance_value"],
                row["average_balance_cost"],
            ])

        for column_cells in ws.columns:
            max_length = max(len(str(cell.value or "")) for cell in column_cells)
            ws.column_dimensions[column_cells[0].column_letter].width = max_length + 2

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        http_response = HttpResponse(
            output,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        filename = f"kardex_{request.query_params.get('warehouse')}_{request.query_params.get('item')}.xlsx"

        http_response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return http_response


class CurrentStockExportView(CurrentStockView):
    def get(self, request):
        response = super().get(request)

        if response.status_code != 200:
            return response

        rows = response.data

        wb = Workbook()
        ws = wb.active
        ws.title = "Current Stock"

        headers = [
            "Warehouse",
            "Item Code",
            "Item Name",
            "Quantity",
            "Average Cost",
            "Total Cost",
        ]

        ws.append(headers)

        header_fill = PatternFill("solid", fgColor="1E293B")
        header_font = Font(color="FFFFFF", bold=True)

        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")

        for row in rows:
            ws.append([
                row["warehouse_name"],
                row["item_code"],
                row["item_name"],
                row["quantity"],
                row["average_cost"],
                row["total_cost"],
            ])

        for column_cells in ws.columns:
            max_length = max(len(str(cell.value or "")) for cell in column_cells)
            ws.column_dimensions[column_cells[0].column_letter].width = max_length + 2

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        http_response = HttpResponse(
            output,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        http_response["Content-Disposition"] = 'attachment; filename="current_stock.xlsx"'

        return http_response


class InventoryValuationView(TenantRequiredMixin, APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        layer_value = ExpressionWrapper(
            F("remaining_quantity") * F("unit_cost"),
            output_field=DecimalField(max_digits=18, decimal_places=2),
        )

        rows = (
            StockLayer.objects
            .values(
                "warehouse_id",
                "warehouse__name",
            )
            .annotate(
                inventory_value=Sum(layer_value),
            )
        )

        warehouses = []
        total_inventory_value = Decimal("0")

        for row in rows:
            value = row["inventory_value"] or Decimal("0")

            warehouses.append({
                "warehouse_id": row["warehouse_id"],
                "warehouse_name": row["warehouse__name"],
                "inventory_value": str(
                    value.quantize(Decimal("0.01"))
                ),
            })

            total_inventory_value += value

        return Response({
            "total_inventory_value": str(
                total_inventory_value.quantize(Decimal("0.01"))
            ),
            "warehouses": warehouses,
        })
