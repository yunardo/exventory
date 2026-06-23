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
from .models import UFVRevaluationRun, UFVRevaluationRunLine
from .models import UFVRate

from .models import (
    StockEntryDocument,
    StockEntryLine,
    StockExitDocument,
    StockExitLine,
    StockExitLineAllocation,
)

import json


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


class UFVRevaluationRunLineSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    item_code = serializers.CharField(source="item.code", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = UFVRevaluationRunLine
        fields = [
            "id",
            "stock_layer",
            "warehouse",
            "warehouse_name",
            "item",
            "item_code",
            "item_name",
            "quantity",
            "original_unit_cost",
            "updated_unit_cost",
            "purchase_ufv",
            "closing_ufv",
            "original_total",
            "updated_total",
            "revaluation_amount",
        ]


class UFVRevaluationRunSerializer(serializers.ModelSerializer):
    lines = UFVRevaluationRunLineSerializer(many=True, read_only=True)
    applied_by_username = serializers.CharField(
        source="applied_by.username",
        read_only=True,
    )

    class Meta:
        model = UFVRevaluationRun
        fields = [
            "id",
            "closing_date",
            "closing_ufv",
            "total_original_value",
            "total_updated_value",
            "total_revaluation",
            "notes",
            "applied_by",
            "applied_by_username",
            "created_at",
            "lines",
        ]
        read_only_fields = [
            "id",
            "applied_by",
            "applied_by_username",
            "created_at",
            "lines",
        ]


class StockEntryLineSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    item_code = serializers.CharField(source="item.code", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = StockEntryLine
        fields = [
            "id",
            "warehouse",
            "warehouse_name",
            "item",
            "item_code",
            "item_name",
            "quantity",
            "unit_cost",
            "total_cost",
            "ufv_rate",
            "ufv_value",
            "notes",
        ]
        read_only_fields = [
            "id",
            "total_cost",
            "ufv_rate",
            "ufv_value",
        ]


class StockEntryDocumentSerializer(serializers.ModelSerializer):
    lines = StockEntryLineSerializer(many=True)

    class Meta:
        model = StockEntryDocument
        fields = [
            "id",
            "document_type",
            "document_number",
            "supplier_name",
            "supplier_tax_id",
            "entry_date",
            "reason",
            "notes",
            "status",
            "total_amount",
            "document_pdf",
            "cancelled_at",
            "cancellation_reason",
            "lines",
        ]
        read_only_fields = [
            "id",
            "status",
            "total_amount",
            "cancelled_at",
            "cancellation_reason",
        ]

    def create(self, validated_data):
        lines_data = validated_data.pop("lines", [])

        if isinstance(lines_data, str):
            lines_data = json.loads(lines_data)

        tenant = validated_data.get("tenant") or self.context["request"].tenant

        document = StockEntryDocument.objects.create(**validated_data)

        for line_data in lines_data:
            entry_date = document.entry_date

            ufv_rate = (
                UFVRate.objects
                .filter(tenant=tenant, date=entry_date)
                .first()
            )

            StockEntryLine.objects.create(
                tenant=tenant,
                document=document,
                ufv_rate=ufv_rate,
                ufv_value=ufv_rate.value if ufv_rate else None,
                **line_data,
            )

        self._recalculate_total(document)

        return document

    def update(self, instance, validated_data):
        lines_data = validated_data.pop("lines", None)

        if instance.status != StockEntryDocument.Status.DRAFT:
            raise serializers.ValidationError({
                "detail": "Only draft documents can be edited."
            })

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if lines_data is not None:
            instance.lines.all().delete()

            tenant = instance.tenant

            for line_data in lines_data:
                ufv_rate = (
                    UFVRate.objects
                    .filter(tenant=tenant, date=instance.entry_date)
                    .first()
                )

                StockEntryLine.objects.create(
                    tenant=tenant,
                    document=instance,
                    ufv_rate=ufv_rate,
                    ufv_value=ufv_rate.value if ufv_rate else None,
                    **line_data,
                )

        self._recalculate_total(instance)

        return instance

    def _recalculate_total(self, document):
        total = sum(
            (line.total_cost for line in document.lines.all()),
            Decimal("0"),
        )

        document.total_amount = total
        document.save(update_fields=["total_amount"])
    
    def to_internal_value(self, data):
        mutable_data = data.copy()

        lines = mutable_data.get("lines")

        if isinstance(lines, str):
            try:
                parsed_lines = json.loads(lines)
            except json.JSONDecodeError:
                raise serializers.ValidationError({
                    "lines": "Invalid JSON format."
                })

            mutable_data.setlist("lines", parsed_lines)

        return super().to_internal_value(mutable_data)


class StockExitLineSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    item_code = serializers.CharField(source="item.code", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = StockExitLine
        fields = [
            "id",
            "warehouse",
            "warehouse_name",
            "item",
            "item_code",
            "item_name",
            "quantity",
            "total_cost",
            "notes",
        ]
        read_only_fields = [
            "id",
            "total_cost",
        ]


class StockExitDocumentSerializer(serializers.ModelSerializer):
    lines = StockExitLineSerializer(many=True)

    class Meta:
        model = StockExitDocument
        fields = [
            "id",
            "document_type",
            "document_number",
            "requester_name",
            "requesting_unit",
            "responsible_name",
            "exit_date",
            "reason",
            "notes",
            "status",
            "total_amount",
            "document_pdf",
            "cancelled_at",
            "cancellation_reason",
            "lines",
        ]
        read_only_fields = [
            "id",
            "status",
            "total_amount",
            "cancelled_at",
            "cancellation_reason",
        ]

    def validate(self, attrs):
        lines_data = attrs.get("lines", [])

        if not lines_data:
            raise serializers.ValidationError({
                "lines": "At least one line is required."
            })

        return attrs

    def create(self, validated_data):
        lines_data = validated_data.pop("lines", [])

        if isinstance(lines_data, str):
            lines_data = json.loads(lines_data)

        tenant = validated_data.get("tenant") or self.context["request"].tenant

        document = StockExitDocument.objects.create(**validated_data)

        for line_data in lines_data:
            StockExitLine.objects.create(
                tenant=tenant,
                document=document,
                **line_data,
            )

        return document

    def update(self, instance, validated_data):
        lines_data = validated_data.pop("lines", None)

        if instance.status != StockExitDocument.Status.DRAFT:
            raise serializers.ValidationError({
                "detail": "Only draft documents can be edited."
            })

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if lines_data is not None:
            instance.lines.all().delete()

            for line_data in lines_data:
                StockExitLine.objects.create(
                    tenant=instance.tenant,
                    document=instance,
                    **line_data,
                )

        return instance
    
    def to_internal_value(self, data):
        mutable_data = data.copy()

        lines = mutable_data.get("lines")

        if isinstance(lines, str):
            try:
                parsed_lines = json.loads(lines)
            except json.JSONDecodeError:
                raise serializers.ValidationError({
                    "lines": "Invalid JSON format."
                })

            mutable_data.setlist("lines", parsed_lines)

        return super().to_internal_value(mutable_data)
