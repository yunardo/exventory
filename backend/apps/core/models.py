from django.db import models
from apps.tenancy.models import Tenant
from .managers import TenantAwareManager

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class TenantAwareModel(TimeStampedModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.PROTECT, related_name="%(class)s_set")

    # Manager por defecto filtra por tenant automáticamente
    objects = TenantAwareManager()

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=["tenant"]),
        ]

# Ensure additional models are registered
from .audit_models import AuditLog  # noqa: F401