import logging
from .models import AuditLog

logger = logging.getLogger('cybergrid.audit')


def log_action(user, action, resource_type, resource_id="", details=None, ip_address=None):
    """
    Utility function to record an administrative or security audit event.
    """
    try:
        return AuditLog.objects.create(
            user=user if getattr(user, 'is_authenticated', False) else None,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            details=details or {},
            ip_address=ip_address
        )
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        return None


class AuditService:
    @classmethod
    def log(cls, user, action, resource_type, resource_id="", details=None, request=None):
        ip = None
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR')
        return log_action(user, action, resource_type, resource_id, details, ip_address=ip)
