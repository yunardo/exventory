"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.inventory.views import WarehouseViewSet
from apps.inventory.views import ItemViewSet
from apps.tenancy.views import MeView, MyTenantsView
from apps.tenancy.auth_views import TenantTokenObtainPairView
from apps.core.views import AuditLogViewSet, AuthMeView
from apps.tenancy.views import AuthTenantsView

def health_check(request):
    return JsonResponse({"status": "ok"})

def root_view(request):
    tenant = getattr(request, "tenant", None)
    return JsonResponse({
        "status": "ok",
        "tenant": tenant.slug if tenant else None,
    })

router = DefaultRouter()
router.register(r"warehouses", WarehouseViewSet, basename="warehouse")
router.register(r"items", ItemViewSet, basename="items")
router.register(r"audit-logs", AuditLogViewSet, basename="audit-logs")

urlpatterns = [
    path("", root_view),
    path("health/", health_check),
    path('admin/', admin.site.urls),

    path("api/auth/login/", TenantTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("api/me/", MeView.as_view(), name="me"),
    path("api/my-tenants/", MyTenantsView.as_view(), name="my_tenants"),

    path("api/auth/me/", AuthMeView.as_view(), name="auth-me"),
    path("api/auth/tenants/", AuthTenantsView.as_view(), name="auth-tenants"),

    path("api/", include(router.urls)),
]
