from rest_framework import serializers
from .models import Warehouse
from .models import Item
from .models import StockEntry
from .models import StockExit


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
