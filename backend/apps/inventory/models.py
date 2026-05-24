from django.db import models
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