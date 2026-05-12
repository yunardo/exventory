from django.contrib import admin
from django.core.exceptions import PermissionDenied
from apps.core.audit_models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "tenant", "action", "entity", "entity_id", "user", "status_code", "request_id")
    list_filter = ("action", "entity", "status_code", "tenant")
    search_fields = ("entity", "entity_id", "request_id", "path", "user__username", "user__email", "tenant__slug")
    ordering = ("-created_at",)

    def get_queryset(self, request):
        if not request.user.is_superuser:
            raise PermissionDenied("Only superusers can view global audit logs.")
        return AuditLog.objects.all_with_tenants()

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False