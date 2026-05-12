from django.db import models
from apps.core.models import TenantAwareModel

class Warehouse(TenantAwareModel):
    name = models.CharField(max_length=150)
    location = models.CharField(max_length=250, blank=True, default="")

    class Meta:
        unique_together = (("tenant", "name"),)

    def __str__(self):
        return self.name