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

    class Meta:
        ordering = ["entry_date", "id"]

    def __str__(self):
        return f"{self.item} - {self.remaining_quantity} @ {self.unit_cost}"
