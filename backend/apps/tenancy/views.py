from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from rest_framework.viewsets import ModelViewSet
from .serializers import MyTenantSerializer
from apps.tenancy.permissions import IsTenantMember, HasTenantRole
from apps.tenancy.models import Membership, TenantInvitation
from apps.tenancy.serializers import MembershipSerializer
from rest_framework.exceptions import ValidationError
from .models import TenantInvitation
from .serializers import TenantInvitationSerializer

from django.utils import timezone
from rest_framework import status
from datetime import timedelta
from rest_framework.decorators import action

class AuthTenantsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = (
            Membership.objects
            .select_related("tenant")
            .filter(user=request.user, tenant__is_active=True)
        )

        return Response([
            {
                "id": membership.tenant.id,
                "name": membership.tenant.name,
                "slug": membership.tenant.slug,
                "role": membership.role,
            }
            for membership in memberships
        ])

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            # En un SaaS por subdominio, esto normalmente es error (salvo endpoints globales)
            raise NotFound(detail="Tenant context is required (use tenant subdomain).")

        membership = Membership.objects.filter(
            tenant=tenant, user=request.user, is_active=True
        ).first()

        if not membership:
            # Está autenticado pero no pertenece a ese tenant
            return Response({
                "user": {
                    "id": request.user.id,
                    "username": request.user.get_username(),
                    "email": request.user.email,
                },
                "tenant": {"id": tenant.id, "slug": tenant.slug, "name": tenant.name},
                "membership": None,
                "is_member": False,
            }, status=200)

        return Response({
            "user": {
                "id": request.user.id,
                "username": request.user.get_username(),
                "email": request.user.email,
            },
            "tenant": {"id": tenant.id, "slug": tenant.slug, "name": tenant.name},
            "membership": {
                "role": membership.role,
                "is_active": membership.is_active,
            },
            "is_member": True,
        }, status=200)


class MyTenantsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Membership.objects.select_related("tenant").filter(
            user=request.user, is_active=True, tenant__is_active=True
        ).order_by("tenant__name")

        data = MyTenantSerializer(qs, many=True).data
        return Response(data, status=200)


class TenantMembershipViewSet(ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated, IsTenantMember, HasTenantRole]
    required_roles = [
        Membership.Role.OWNER,
        Membership.Role.ADMIN,
    ]

    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return (
            Membership.objects
            .select_related("user", "tenant")
            .filter(tenant=self.request.tenant)
            .order_by("user__username")
        )
    
    def perform_update(self, serializer):
        instance = self.get_object()

        new_role = serializer.validated_data.get("role", instance.role)
        new_is_active = serializer.validated_data.get("is_active", instance.is_active)

        is_current_admin_role = instance.role in [
            Membership.Role.OWNER,
            Membership.Role.ADMIN,
        ]

        would_lose_admin_role = new_role not in [
            Membership.Role.OWNER,
            Membership.Role.ADMIN,
        ]

        would_be_inactive = new_is_active is False

        if is_current_admin_role and (would_lose_admin_role or would_be_inactive):
            active_admins = Membership.objects.filter(
                tenant=instance.tenant,
                is_active=True,
                role__in=[
                    Membership.Role.OWNER,
                    Membership.Role.ADMIN,
                ],
            ).exclude(id=instance.id)

            if not active_admins.exists():
                raise ValidationError({
                    "detail": "A tenant must have at least one active owner or admin."
                })

        serializer.save()


class TenantInvitationViewSet(ModelViewSet):
    serializer_class = TenantInvitationSerializer
    permission_classes = [IsAuthenticated, IsTenantMember, HasTenantRole]
    required_roles = [
        Membership.Role.OWNER,
        Membership.Role.ADMIN,
    ]

    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return (
            TenantInvitation.objects
            .select_related("tenant", "invited_by")
            .filter(tenant=self.request.tenant)
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.tenant,
            invited_by=self.request.user,
        )
    
    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        invitation = self.get_object()
        invitation.is_active = False
        invitation.save(update_fields=["is_active"])

        return Response({"detail": "Invitation revoked."})


    @action(detail=True, methods=["post"])
    def resend(self, request, pk=None):
        invitation = self.get_object()

        invitation.is_active = True
        invitation.accepted_at = None
        invitation.expires_at = timezone.now() + timedelta(days=7)

        invitation.save(
            update_fields=[
                "is_active",
                "accepted_at",
                "expires_at",
            ]
        )

        return Response({"detail": "Invitation renewed."})


class AcceptTenantInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"detail": "Token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation = (
            TenantInvitation.objects
            .select_related("tenant")
            .filter(token=token)
            .first()
        )

        if not invitation:
            return Response(
                {"detail": "Invitation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not invitation.is_active:
            return Response(
                {"detail": "Invitation is inactive."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.accepted_at:
            return Response(
                {"detail": "Invitation has already been accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.is_expired:
            return Response(
                {"detail": "Invitation has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership, created = Membership.objects.get_or_create(
            tenant=invitation.tenant,
            user=request.user,
            defaults={
                "role": invitation.role,
                "is_active": True,
            },
        )

        if not created:
            membership.role = invitation.role
            membership.is_active = True
            membership.save(update_fields=["role", "is_active"])

        invitation.accepted_at = timezone.now()
        invitation.is_active = False
        invitation.save(update_fields=["accepted_at", "is_active"])

        return Response({
            "detail": "Invitation accepted.",
            "tenant": {
                "id": invitation.tenant.id,
                "slug": invitation.tenant.slug,
                "name": invitation.tenant.name,
            },
            "membership": {
                "role": membership.role,
                "is_active": membership.is_active,
            },
        })
