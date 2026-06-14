from rest_framework import serializers
from .models import Tenant, Membership

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "name", "slug", "is_active"]


class MyTenantSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer()

    class Meta:
        model = Membership
        fields = ["tenant", "role", "is_active", "created_at"]


class MembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Membership
        fields = [
            "id",
            "user",
            "username",
            "email",
            "role",
            "is_active",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "username",
            "email",
            "created_at",
        ]
