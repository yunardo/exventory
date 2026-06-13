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

        movements = entries + exits + adjustments
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
