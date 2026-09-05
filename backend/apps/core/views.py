import os
import re
import logging
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .responses import success_response, error_response
from .licensing import verify_license_key, get_machine_hardware_id

logger = logging.getLogger('offensivegrid.license')


@api_view(['GET'])
@permission_classes([AllowAny])
def license_status(request):
    """
    Returns current instance hardware signature and cryptographic licensing status.
    """
    is_valid, message, metadata = verify_license_key()
    hwid = get_machine_hardware_id()
    
    return success_response(
        data={
            "is_licensed": is_valid,
            "hardware_id": hwid,
            "client": metadata.get("client", "Unlicensed Instance"),
            "tier": metadata.get("tier", "LOCKED"),
            "expires": metadata.get("expires", "EXPIRED / NONE"),
            "contact": "haroonatieeq6@gmail.com",
            "author": "Haroon Atieeq (Founder & Lead Developer)",
            "portal": "https://cszone.pk",
            "github": "https://github.com/haroonatieeq352/OffensiveGrid"
        },
        message=message
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def activate_license(request):
    """
    Validates and activates an official authorization key for this hardware instance.
    """
    key = request.data.get('license_key', '').strip()
    if not key:
        return error_response(message="License key is required.", status_code=400)

    is_valid, message, metadata = verify_license_key(key)
    if not is_valid:
        return error_response(
            message=f"Activation Rejected: {message}",
            status_code=403,
            details=metadata
        )

    # Persist key to backend/.env if accessible
    try:
        env_path = settings.BASE_DIR / '.env'
        if env_path.exists():
            content = env_path.read_text(encoding='utf-8')
            if 'OFFENSIVEGRID_LICENSE_KEY=' in content:
                content = re.sub(r'OFFENSIVEGRID_LICENSE_KEY=.*', f'OFFENSIVEGRID_LICENSE_KEY={key}', content)
            else:
                content += f"\n# OffensiveGrid Authorized Activation Key\nOFFENSIVEGRID_LICENSE_KEY={key}\n"
            env_path.write_text(content, encoding='utf-8')
    except Exception as e:
        logger.warning(f"Could not persist license key to .env file: {e}")

    # Dynamically inject into runtime memory
    setattr(settings, 'OFFENSIVEGRID_LICENSE_KEY', key)
    os.environ['OFFENSIVEGRID_LICENSE_KEY'] = key

    return success_response(
        data={
            "is_licensed": True,
            "client": metadata.get("client"),
            "tier": metadata.get("tier"),
            "expires": metadata.get("expires"),
            "hardware_id": metadata.get("hardware_id", get_machine_hardware_id())
        },
        message="OffensiveGrid instance successfully authorized and unlocked! 🚀"
    )
