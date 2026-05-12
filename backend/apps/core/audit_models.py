from django.db import models
from django.conf import settings
from apps.core.models import TenantAwareModel

class AuditLog(TenantAwareModel):
    """
    Registro auditable por tenant.
    Guardamos payload pequeño y seguro (JSON).
    """
    action = models.CharField(max_length=50)
    entity = models.CharField(max_length=100, blank=True, default="")   # e.g. "Warehouse"
    entity_id = models.CharField(max_length=64, blank=True, default="") # str por si es UUID/int
    path = models.CharField(max_length=300, blank=True, default="")
    method = models.CharField(max_length=10, blank=True, default="")
    status_code = models.IntegerField(null=True, blank=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="audit_logs"
    )

    request_id = models.CharField(max_length=64, blank=True, default="")
    ip_address = models.CharField(max_length=64, blank=True, default="")
    user_agent = models.CharField(max_length=300, blank=True, default="")

    # JSON pequeño: cambios/metadata (sin secretos)
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["tenant", "action"]),
            models.Index(fields=["tenant", "entity", "entity_id"]),
            models.Index(fields=["request_id"]),
        ]

    def __str__(self):
        return f"{self.created_at} {self.tenant_id} {self.action} {self.entity}:{self.entity_id}"