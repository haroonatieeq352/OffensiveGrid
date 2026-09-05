from rest_framework import generics
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.accounts.permissions import IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    GET /api/v1/audit/logs/
    Admin API to list and search tamper-evident audit logs.
    """
    permission_classes = [IsAdmin]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related('user').all()
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['action', 'resource_type', 'user__username', 'user__email', 'ip_address']
    ordering_fields = ['created_at', 'action']
    ordering = ['-created_at']
