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