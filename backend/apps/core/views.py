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
        queryset = AuditLog.objects.select_related("user").all()

        action = self.request.query_params.get("action")
        entity = self.request.query_params.get("entity")
        method = self.request.query_params.get("method")

        if action:
            queryset = queryset.filter(action=action)

        if entity:
            queryset = queryset.filter(entity=entity)

        if method:
            queryset = queryset.filter(method=method)

        return queryset.order_by("-created_at")


class AuditLogOptionsView(TenantRequiredMixin, APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        queryset = AuditLog.objects.all()

        return Response({
            "actions": sorted(
                value for value in queryset.values_list("action", flat=True).distinct()
                if value
            ),
            "entities": sorted(
                value for value in queryset.values_list("entity", flat=True).distinct()
                if value
            ),
            "methods": sorted(
                value for value in queryset.values_list("method", flat=True).distinct()
                if value
            ),
        })
