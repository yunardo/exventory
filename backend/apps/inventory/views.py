from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.core.api import TenantRequiredMixin
from apps.tenancy.permissions import IsTenantMember
from apps.core.audit_mixins import AuditCrudMixin
from .models import Warehouse, Item, StockEntry, StockExit
from .serializers import WarehouseSerializer
from .serializers import ItemSerializer
from .serializers import StockEntrySerializer
from .serializers import StockExitSerializer
from decimal import Decimal

from django.db.models import Sum


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


class StockExitViewSet(AuditCrudMixin, TenantRequiredMixin, ModelViewSet):
    serializer_class = StockExitSerializer
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_queryset(self):
        return StockExit.objects.select_related("warehouse", "item").all()


class CurrentStockView(TenantRequiredMixin, APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        entries = (
            StockEntry.objects
            .select_related("warehouse", "item")
            .values(
                "warehouse_id",
                "warehouse__name",
                "item_id",
                "item__code",
                "item__name",
            )
            .annotate(total_entries=Sum("quantity"))
        )

        exits = (
            StockExit.objects
            .values("warehouse_id", "item_id")
            .annotate(total_exits=Sum("quantity"))
        )

        exits_map = {
            (row["warehouse_id"], row["item_id"]): row["total_exits"]
            for row in exits
        }

        result = []

        for row in entries:
            key = (row["warehouse_id"], row["item_id"])
            total_entries = row["total_entries"] or Decimal("0")
            total_exits = exits_map.get(key) or Decimal("0")
            quantity = total_entries - total_exits

            result.append({
                "warehouse_id": row["warehouse_id"],
                "warehouse_name": row["warehouse__name"],
                "item_id": row["item_id"],
                "item_code": row["item__code"],
                "item_name": row["item__name"],
                "quantity": str(quantity),
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

        return Response({
            "total_warehouses": total_warehouses,
            "total_items": total_items,
            "total_stock_entries": total_entries,
            "total_stock_exits": total_exits,
            "current_quantity": str(current_quantity),
        })
