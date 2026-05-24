from rest_framework import serializers
from .models import Warehouse
from .models import Item
from .models import StockEntry
from .models import StockExit
from decimal import Decimal
from django.db.models import Sum


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ["id", "name", "location", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = [
            "id",
            "code",
            "name",
            "description",
            "unit",
            "is_active",
        ]

class StockEntrySerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    item_code = serializers.CharField(source="item.code", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = StockEntry
        fields = [
            "id",
            "warehouse",
            "warehouse_name",
            "item",
            "item_code",
            "item_name",
            "quantity",
            "unit_cost",
            "reference",
            "entry_date",
            "notes",
        ]

class StockExitSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    item_code = serializers.CharField(source="item.code", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = StockExit
        fields = [
            "id",
            "warehouse",
            "warehouse_name",
            "item",
            "item_code",
            "item_name",
            "quantity",
            "reference",
            "exit_date",
            "notes",
        ]

    def validate(self, attrs):
        warehouse = attrs.get("warehouse")
        item = attrs.get("item")
        quantity = attrs.get("quantity") or Decimal("0")

        total_entries = (
            StockEntry.objects
            .filter(warehouse=warehouse, item=item)
            .aggregate(total=Sum("quantity"))
            .get("total")
            or Decimal("0")
        )

        total_exits = (
            StockExit.objects
            .filter(warehouse=warehouse, item=item)
            .aggregate(total=Sum("quantity"))
            .get("total")
            or Decimal("0")
        )

        available = total_entries - total_exits

        if quantity > available:
            raise serializers.ValidationError({
                "quantity": f"Not enough stock available. Available: {available}"
            })

        return attrs
