from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Membership

SAFE_METHODS = ["GET", "HEAD", "OPTIONS"]

class IsTenantMember(BasePermission):
    """
    Requiere:
      - request.tenant existe
      - usuario autenticado
      - membership activa en ese tenant
    """
    message = "User is not an active member of this tenant."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return False
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        return Membership.objects.filter(
            tenant=tenant,
            user=user,
            is_active=True
        ).exists()

class HasTenantRole(BasePermission):
    message = "User does not have the required role for this tenant."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return False

        user = request.user
        if not user or not user.is_authenticated:
            return False

        required = getattr(view, "required_roles", None)

        if not required:
            return True

        return Membership.objects.filter(
            tenant=tenant,
            user=user,
            is_active=True,
            role__in=required,
        ).exists()
