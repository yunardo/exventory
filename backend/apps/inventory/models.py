from django.db import models
from django.conf import settings
from apps.core.models import TenantAwareModel

class Warehouse(TenantAwareModel):
    name = models.CharField(max_length=150)
    location = models.CharField(max_length=250, blank=True, default="")

    class Meta:
        unique_together = (("tenant", "name"),)

    def __str__(self):
        return self.name
    
class Item(TenantAwareModel):
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=30, default="unit")
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("tenant", "code")
        ordering = ["code", "name"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class UFVRate(TenantAwareModel):
    date = models.DateField()
    value = models.DecimalField(max_digits=12, decimal_places=5)

    class Meta:
        ordering = ["-date"]
        unique_together = (("tenant", "date"),)

    def __str__(self):
        return f"{self.date} - {self.value}"


class StockEntry(TenantAwareModel):
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="stock_entries",
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        related_name="stock_entries",
    )

    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)

    reference = models.CharField(max_length=120, blank=True)
    entry_date = models.DateField()

    notes = models.TextField(blank=True)

    ufv_rate = models.ForeignKey(
        UFVRate,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="stock_entries",
    )

    ufv_value = models.DecimalField(
        max_digits=12,
        decimal_places=5,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-entry_date", "-id"]

    def __str__(self):
        return f"{self.item} -> {self.warehouse} ({self.quantity})"

class StockExit(TenantAwareModel):
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="stock_exits",
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        related_name="stock_exits",
    )

    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=120, blank=True)
    exit_date = models.DateField()
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-exit_date", "-id"]

    def __str__(self):
        return f"{self.item} <- {self.warehouse} ({self.quantity})"


class StockLayer(TenantAwareModel):
    stock_entry = models.OneToOneField(
        StockEntry,
        on_delete=models.CASCADE,
        related_name="stock_layer",
        null=True,
        blank=True,
    )

    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="stock_layers",
    )

    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        related_name="stock_layers",
    )

    original_quantity = models.DecimalField(max_digits=12, decimal_places=2)
    remaining_quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    entry_date = models.DateField()

    ufv_value = models.DecimalField(
        max_digits=12,
        decimal_places=5,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["entry_date", "id"]

    def __str__(self):
        return f"{self.item} - {self.remaining_quantity} @ {self.unit_cost}"


class StockExitAllocation(TenantAwareModel):
    stock_exit = models.ForeignKey(
        StockExit,
        on_delete=models.CASCADE,
        related_name="allocations",
    )

    stock_layer = models.ForeignKey(
        StockLayer,
        on_delete=models.PROTECT,
        related_name="exit_allocations",
    )

    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.stock_exit_id} -> {self.stock_layer_id} ({self.quantity})"


class InventoryAdjustment(TenantAwareModel):
    TYPE_POSITIVE = "POSITIVE"
    TYPE_NEGATIVE = "NEGATIVE"

    TYPES = [
        (TYPE_POSITIVE, "Positive"),
        (TYPE_NEGATIVE, "Negative"),
    ]

    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="inventory_adjustments",
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        related_name="inventory_adjustments",
    )

    adjustment_type = models.CharField(max_length=20, choices=TYPES)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)

    unit_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Required for positive adjustments",
    )

    reference = models.CharField(max_length=120, blank=True)
    adjustment_date = models.DateField()
    reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-adjustment_date", "-id"]

    def __str__(self):
        return f"{self.adjustment_type} {self.item} ({self.quantity})"


class InventoryAdjustmentAllocation(TenantAwareModel):
    adjustment = models.ForeignKey(
        InventoryAdjustment,
        on_delete=models.CASCADE,
        related_name="allocations",
    )

    stock_layer = models.ForeignKey(
        StockLayer,
        on_delete=models.PROTECT,
        related_name="adjustment_allocations",
    )

    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.adjustment_id} -> {self.stock_layer_id} ({self.quantity})"


class StockTransfer(TenantAwareModel):
    source_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="outgoing_transfers",
    )
    destination_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="incoming_transfers",
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        related_name="stock_transfers",
    )

    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    transfer_date = models.DateField()
    reference = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-transfer_date", "-id"]

    def __str__(self):
        return f"{self.item} {self.source_warehouse} -> {self.destination_warehouse}"


class StockTransferAllocation(TenantAwareModel):
    stock_transfer = models.ForeignKey(
        StockTransfer,
        on_delete=models.CASCADE,
        related_name="allocations",
    )
    stock_layer = models.ForeignKey(
        StockLayer,
        on_delete=models.PROTECT,
        related_name="transfer_allocations",
    )

    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.stock_transfer_id} -> {self.stock_layer_id} ({self.quantity})"
