from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from rest_framework.viewsets import ModelViewSet
from .serializers import MyTenantSerializer
from apps.tenancy.permissions import IsTenantMember, HasTenantRole
from apps.tenancy.models import Membership
from apps.tenancy.serializers import MembershipSerializer

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
