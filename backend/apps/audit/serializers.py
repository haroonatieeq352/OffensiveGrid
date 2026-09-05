from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='System / Guest')
    user_email = serializers.CharField(source='user.email', read_only=True, default='N/A')

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'username',
            'user_email',
            'action',
            'resource_type',
            'resource_id',
            'details',
            'ip_address',
            'created_at',
        ]
        read_only_fields = fields
