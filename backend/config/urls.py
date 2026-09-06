"""
OffensiveGrid Master URL Configuration.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from apps.core.responses import success_response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """System health check endpoint for monitoring."""
    return success_response(
        data={
            "status": "healthy",
            "service": "OffensiveGrid API Core",
            "version": "2.0.0"
        },
        message="OffensiveGrid Core is fully operational."
    )


urlpatterns = [
    # Root Health / Landing
    path('', health_check, name='root_health'),

    # Administration Portal
    path('admin/', admin.site.urls),

    # Health Check
    path('api/v1/health/', health_check, name='health_check'),

    # Domain API Endpoints
    path('api/v1/auth/', include('apps.accounts.urls', namespace='accounts')),
    path('api/v1/scenarios/', include('apps.scenarios.urls', namespace='scenarios')),
    path('api/v1/competitions/', include('apps.competitions.urls', namespace='competitions')),
    path('api/v1/submissions/', include('apps.submissions.urls', namespace='submissions')),
    path('api/v1/leaderboard/', include('apps.leaderboard.urls', namespace='leaderboard')),
    path('api/v1/files/', include('apps.files.urls', namespace='files')),
    path('api/v1/audit/', include('apps.audit.urls', namespace='audit')),
    path('api/v1/payments/', include('apps.payments.urls', namespace='payments')),
    path('api/v1/license/', include('apps.core.urls', namespace='license')),
]

# Serve media files in development and local environments
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
