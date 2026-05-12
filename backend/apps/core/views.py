from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated
from apps.core.api import TenantRequiredMixin
from apps.tenancy.permissions import IsTenantMember, HasTenantRole
from apps.core.audit_models import AuditLog
from apps.core.serializers import AuditLogSerializer

class AuditLogViewSet(TenantRequiredMixin, ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsTenantMember, HasTenantRole]

    # Solo admin/owner pueden ver audit logs
    required_roles = ["owner", "admin"]

    def get_queryset(self):
        # Filtrado automático por tenant gracias al manager
        return AuditLog.objects.all().order_by("-created_at")