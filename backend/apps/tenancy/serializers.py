from rest_framework import serializers
from .models import Tenant, Membership, TenantInvitation

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


class TenantInvitationSerializer(serializers.ModelSerializer):
    invited_by_username = serializers.CharField(
        source="invited_by.username",
        read_only=True,
    )
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = TenantInvitation
        fields = [
            "id",
            "email",
            "role",
            "token",
            "invited_by",
            "invited_by_username",
            "accepted_at",
            "expires_at",
            "is_active",
            "is_expired",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "token",
            "invited_by",
            "invited_by_username",
            "accepted_at",
            "expires_at",
            "is_expired",
            "created_at",
        ]


class TenantSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = [
            "id",
            "name",
            "slug",
            "company_name",
            "tax_id",
            "phone",
            "address",
            "currency_code",
            "timezone",
            "is_active",
        ]
        read_only_fields = [
            "id",
            "slug",
            "is_active",
        ]
