import json
from django.http import JsonResponse
from .licensing import verify_license_key, get_machine_hardware_id, print_unauthorized_banner

_HAS_PRINTED_BANNER = False

class LicenseGateMiddleware:
    """
    Enterprise Hardware Authorization Gate:
    Enforces that this machine is authorized by Haroon Atieeq before serving API traffic.
    """
    EXEMPT_PATHS = [
        '/api/v1/license/status/',
        '/api/v1/license/activate/',
        '/static/',
        '/media/',
        '/favicon.ico',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Allow exempt endpoints
        for exempt in self.EXEMPT_PATHS:
            if path.startswith(exempt):
                return self.get_response(request)

        # Enforce cryptographic license verification
        is_valid, msg, meta = verify_license_key()
        if not is_valid:
            global _HAS_PRINTED_BANNER
            if not _HAS_PRINTED_BANNER:
                print_unauthorized_banner(meta.get('hardware_id', get_machine_hardware_id()), reason=meta.get('reason', 'UNAUTHORIZED'))
                _HAS_PRINTED_BANNER = True

            return JsonResponse({
                "success": False,
                "error": {
                    "code": "INSTANCE_UNAUTHORIZED",
                    "message": "This OffensiveGrid deployment is locked. An official activation key from Haroon Atieeq is required to operate this platform.",
                    "hardware_id": meta.get('hardware_id', get_machine_hardware_id()),
                    "contact": "haroonatieeq6@gmail.com",
                    "author": "Haroon Atieeq (Founder & Lead Developer)",
                    "portal": "https://cszone.pk"
                }
            }, status=403)

        return self.get_response(request)
