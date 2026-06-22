from rest_framework import serializers
from .models import Warehouse
from .models import Item
from .models import StockEntry
from .models import StockExit
from decimal import Decimal
from django.db.models import Sum
from django.db import transaction

from .models import StockEntry, StockExit, StockLayer, StockExitAllocation
from .models import InventoryAdjustment, InventoryAdjustmentAllocation
from .models import StockTransfer, StockTransferAllocation, UFVRate



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
    ufv_value = serializers.DecimalField(
        max_digits=12,
        decimal_places=5,
        read_only=True,
    )

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
            "ufv_rate",
            "ufv_value",
            "reference",
            "entry_date",
            "notes",
        ]
        # read_only_fields = ["ufv_rate", "ufv_value"]

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


class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    item_code = serializers.CharField(source="item.code", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = InventoryAdjustment
        fields = [
            "id",
            "warehouse",
            "warehouse_name",
            "item",
            "item_code",
            "item_name",
            "adjustment_type",
            "quantity",
            "unit_cost",
            "reference",
            "adjustment_date",
            "reason",
            "total_cost",
        ]

    def get_total_cost(self, obj):
        if obj.adjustment_type == InventoryAdjustment.TYPE_POSITIVE:
            if obj.unit_cost is None:
                return "0.00"
            total = obj.quantity * obj.unit_cost
            return str(total.quantize(Decimal("0.01")))

        total = sum(
            (
                allocation.quantity * allocation.unit_cost
                for allocation in obj.allocations.all()
            ),
            Decimal("0"),
        )
        return str(total.quantize(Decimal("0.01")))

    def validate(self, attrs):
        adjustment_type = attrs.get("adjustment_type")
        warehouse = attrs.get("warehouse")
        item = attrs.get("item")
        quantity = attrs.get("quantity") or Decimal("0")
        unit_cost = attrs.get("unit_cost")

        if quantity <= 0:
            raise serializers.ValidationError({
                "quantity": "Quantity must be greater than zero."
            })

        if adjustment_type == InventoryAdjustment.TYPE_POSITIVE and unit_cost is None:
            raise serializers.ValidationError({
                "unit_cost": "Unit cost is required for positive adjustments."
            })

        if adjustment_type == InventoryAdjustment.TYPE_NEGATIVE:
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

        adjustment = InventoryAdjustment.objects.create(**validated_data)

        if adjustment.adjustment_type == InventoryAdjustment.TYPE_POSITIVE:
            StockLayer.objects.create(
                tenant=tenant,
                stock_entry=None,  # esto requiere cambio si stock_entry es OneToOne NOT NULL
                warehouse=adjustment.warehouse,
                item=adjustment.item,
                original_quantity=adjustment.quantity,
                remaining_quantity=adjustment.quantity,
                unit_cost=adjustment.unit_cost,
                entry_date=adjustment.adjustment_date,
                ufv_value=None
            )
            return adjustment

        quantity_to_consume = adjustment.quantity

        layers = (
            StockLayer.objects
            .select_for_update()
            .filter(
                tenant=tenant,
                warehouse=adjustment.warehouse,
                item=adjustment.item,
                remaining_quantity__gt=0,
            )
            .order_by("entry_date", "id")
        )

        for layer in layers:
            if quantity_to_consume <= 0:
                break

            consumed_quantity = min(quantity_to_consume, layer.remaining_quantity)

            InventoryAdjustmentAllocation.objects.create(
                tenant=tenant,
                adjustment=adjustment,
                stock_layer=layer,
                quantity=consumed_quantity,
                unit_cost=layer.unit_cost,
            )

            layer.remaining_quantity -= consumed_quantity
            layer.save(update_fields=["remaining_quantity"])

            quantity_to_consume -= consumed_quantity

        return adjustment


class StockTransferSerializer(serializers.ModelSerializer):
    source_warehouse_name = serializers.CharField(
        source="source_warehouse.name",
        read_only=True,
    )
    destination_warehouse_name = serializers.CharField(
        source="destination_warehouse.name",
        read_only=True,
    )
    item_code = serializers.CharField(source="item.code", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = StockTransfer
        fields = [
            "id",
            "source_warehouse",
            "source_warehouse_name",
            "destination_warehouse",
            "destination_warehouse_name",
            "item",
            "item_code",
            "item_name",
            "quantity",
            "transfer_date",
            "reference",
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
        source = attrs.get("source_warehouse")
        destination = attrs.get("destination_warehouse")
        item = attrs.get("item")
        quantity = attrs.get("quantity") or Decimal("0")

        if source == destination:
            raise serializers.ValidationError({
                "destination_warehouse": "Destination warehouse must be different from source warehouse."
            })

        if quantity <= 0:
            raise serializers.ValidationError({
                "quantity": "Quantity must be greater than zero."
            })

        available = (
            StockLayer.objects
            .filter(
                warehouse=source,
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
        quantity_to_transfer = validated_data["quantity"]

        stock_transfer = StockTransfer.objects.create(**validated_data)

        layers = (
            StockLayer.objects
            .select_for_update()
            .filter(
                tenant=tenant,
                warehouse=stock_transfer.source_warehouse,
                item=stock_transfer.item,
                remaining_quantity__gt=0,
            )
            .order_by("entry_date", "id")
        )

        for layer in layers:
            if quantity_to_transfer <= 0:
                break

            consumed_quantity = min(quantity_to_transfer, layer.remaining_quantity)

            StockTransferAllocation.objects.create(
                tenant=tenant,
                stock_transfer=stock_transfer,
                stock_layer=layer,
                quantity=consumed_quantity,
                unit_cost=layer.unit_cost,
            )

            StockLayer.objects.create(
                tenant=tenant,
                stock_entry=None,
                warehouse=stock_transfer.destination_warehouse,
                item=stock_transfer.item,
                original_quantity=consumed_quantity,
                remaining_quantity=consumed_quantity,
                unit_cost=layer.unit_cost,
                entry_date=stock_transfer.transfer_date,
                ufv_value=layer.ufv_value,
            )

            layer.remaining_quantity -= consumed_quantity
            layer.save(update_fields=["remaining_quantity"])

            quantity_to_transfer -= consumed_quantity

        return stock_transfer


class UFVRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UFVRate
        fields = [
            "id",
            "date",
            "value",
        ]
