from rest_framework import serializers
from apps.core.audit_models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "created_at",
            "action",
            "entity",
            "entity_id",
            "path",
            "method",
            "status_code",
            "user",
            "request_id",
            "meta",
        ]
        read_only_fields = fields