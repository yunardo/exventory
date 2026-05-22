from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.core.api import TenantRequiredMixin
from apps.tenancy.permissions import IsTenantMember, HasTenantRole
from apps.core.audit_models import AuditLog
from apps.core.serializers import AuditLogSerializer

class AuthMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
        })

class AuditLogViewSet(TenantRequiredMixin, ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsTenantMember, HasTenantRole]

    # Solo admin/owner pueden ver audit logs
    required_roles = ["owner", "admin"]

    def get_queryset(self):
        # Filtrado automático por tenant gracias al manager
        return AuditLog.objects.all().order_by("-created_at")