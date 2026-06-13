from rest_framework import serializers
from .models import Warehouse
from .models import Item
from .models import StockEntry
from .models import StockExit
from decimal import Decimal
from django.db.models import Sum
from django.db import transaction

from .models import StockEntry, StockExit, StockLayer, StockExitAllocation


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
    total_cost = serializers.SerializerMethodField()

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
            "total_cost",
        ]

    def get_total_cost(self, obj):
        total = sum(
            (
                allocation.quantity * allocation.unit_cost
                for allocation in obj.allocations.all()
            ),
            Decimal("0"),
        )
        return str(total.quantize(Decimal("0.01")))

    def validate(self, attrs):
        warehouse = attrs.get("warehouse")
        item = attrs.get("item")
        quantity = attrs.get("quantity") or Decimal("0")

        available = (
            StockLayer.objects
            .filter(
                warehouse=warehouse,
                item=item,
                remaining_quantity__gt=0,
            )
            .aggregate(total=Sum("remaining_quantity"))
            .get("total")
            or Decimal("0")
        )

        if quantity > available:
            raise serializers.ValidationError({
                "quantity": f"Not enough stock available. Available: {available}"
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        tenant = validated_data.get("tenant") or self.context["request"].tenant
        quantity_to_consume = validated_data["quantity"]

        stock_exit = StockExit.objects.create(**validated_data)

        layers = (
            StockLayer.objects
            .select_for_update()
            .filter(
                tenant=tenant,
                warehouse=stock_exit.warehouse,
                item=stock_exit.item,
                remaining_quantity__gt=0,
            )
            .order_by("entry_date", "id")
        )

        for layer in layers:
            if quantity_to_consume <= 0:
                break

            consumed_quantity = min(quantity_to_consume, layer.remaining_quantity)

            StockExitAllocation.objects.create(
                tenant=tenant,
                stock_exit=stock_exit,
                stock_layer=layer,
                quantity=consumed_quantity,
                unit_cost=layer.unit_cost,
            )

            layer.remaining_quantity -= consumed_quantity
            layer.save(update_fields=["remaining_quantity"])

            quantity_to_consume -= consumed_quantity

        return stock_exit
