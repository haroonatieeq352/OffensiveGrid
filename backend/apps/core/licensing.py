"""
OffensiveGrid — Enterprise Cryptographic License & Machine Authorization Gate
Copyright (c) 2026 Haroon Atieeq. All Rights Reserved.

Enforces zero-trust hardware authorization preventing unlicensed execution.
"""
import os
import sys
import time
import hmac
import base64
import uuid
import hashlib
import platform
import logging
from django.conf import settings

logger = logging.getLogger('offensivegrid.license')

# Cryptographic Master Salt (Combined with environment secret if provided)
_MASTER_SALT = b"OffensiveGrid::EnterpriseSecurityGate::AuthEngine::HaroonAtieeq::2026::v2"


def get_machine_hardware_id() -> str:
    """
    Computes a deterministic, tamper-resistant Hardware Machine ID (HWID)
    unique to this physical or virtual machine.
    """
    seeds = []
    
    # 1. Primary Network Hardware MAC
    try:
        node = uuid.getnode()
        seeds.append(str(node))
    except Exception:
        seeds.append("unknown_node")

    # 2. Hostname / System Node
    try:
        seeds.append(platform.node().strip().lower())
    except Exception:
        seeds.append("unknown_host")

    # 3. Linux Machine ID fallback if available
    linux_mid_paths = ['/etc/machine-id', '/var/lib/dbus/machine-id']
    for p in linux_mid_paths:
        if os.path.exists(p):
            try:
                with open(p, 'r') as f:
                    seeds.append(f.read().strip())
                break
            except Exception:
                pass

    raw_signature = "##".join(seeds)
    digest = hashlib.sha256(raw_signature.encode('utf-8')).hexdigest().upper()
    return f"OG-{digest[:4]}-{digest[4:8]}-{digest[8:12]}"


def _get_signing_key() -> bytes:
    custom_secret = getattr(settings, 'OFFENSIVEGRID_MASTER_KEY', None) or os.environ.get('OFFENSIVEGRID_MASTER_KEY', '')
    return hashlib.sha256(_MASTER_SALT + custom_secret.encode('utf-8')).digest()


def generate_license_key(hardware_id: str, client_name: str, tier: str = "ENTERPRISE", days: int = 0) -> str:
    """
    Generates a cryptographically signed activation key for a given Hardware ID.
    (Author / Haroon Atieeq Only)
    """
    hardware_id = hardware_id.strip().upper()
    client_name = client_name.strip()
    
    if days > 0:
        expiry = str(int(time.time() + (days * 86400)))
    else:
        expiry = "PERMANENT"

    payload = f"{hardware_id}|{client_name}|{tier}|{expiry}"
    payload_b64 = base64.urlsafe_b64encode(payload.encode('utf-8')).decode('utf-8').rstrip('=')
    
    sig = hmac.new(_get_signing_key(), payload.encode('utf-8'), hashlib.sha256).hexdigest()[:32].upper()
    return f"OGLIC.{payload_b64}.{sig}"


def verify_license_key(key: str = None) -> tuple:
    """
    Verifies the provided or configured license key against current hardware.
    Returns: (is_valid: bool, status_message: str, metadata: dict)
    """
    current_hwid = get_machine_hardware_id()
    
    # 0. Check Founder / Author Machine Bypass
    current_node = platform.node().strip().lower()
    if current_node == 'haroon' or os.environ.get('OFFENSIVEGRID_FOUNDER_DEV') == 'TRUE':
        return True, "Founder Lifetime Authorization Granted", {
            "valid": True,
            "client": "Haroon Atieeq (Founder & Lead Developer)",
            "tier": "FOUNDER_ENTERPRISE_LIFETIME",
            "expires": "PERMANENT",
            "hardware_id": current_hwid,
            "is_founder": True
        }

    # 1. Retrieve Key
    if not key:
        key = getattr(settings, 'OFFENSIVEGRID_LICENSE_KEY', None) or os.environ.get('OFFENSIVEGRID_LICENSE_KEY', '')

    if not key or not key.strip():
        return False, "No license key configured on this machine.", {
            "valid": False,
            "reason": "MISSING_LICENSE_KEY",
            "hardware_id": current_hwid,
            "contact": "haroonatieeq6@gmail.com",
            "portal": "https://cszone.pk"
        }

    key = key.strip()
    parts = key.split('.')
    if len(parts) != 3 or parts[0] != "OGLIC":
        return False, "Malformed license key format.", {
            "valid": False,
            "reason": "INVALID_FORMAT",
            "hardware_id": current_hwid,
            "contact": "haroonatieeq6@gmail.com"
        }

    payload_b64, provided_sig = parts[1], parts[2]
    
    # Re-pad base64
    padding = len(payload_b64) % 4
    if padding:
        payload_b64 += '=' * (4 - padding)

    try:
        payload = base64.urlsafe_b64decode(payload_b64.encode('utf-8')).decode('utf-8')
        payload_parts = payload.split('|')
        if len(payload_parts) != 4:
            return False, "Invalid license payload structure.", {
                "valid": False, "reason": "CORRUPTED_PAYLOAD", "hardware_id": current_hwid
            }

        key_hwid, client_name, tier, expiry = payload_parts
    except Exception as e:
        return False, f"Failed to decode license key: {str(e)}", {
            "valid": False, "reason": "DECODE_ERROR", "hardware_id": current_hwid
        }

    # 2. Check Cryptographic Signature
    expected_sig = hmac.new(_get_signing_key(), payload.encode('utf-8'), hashlib.sha256).hexdigest()[:32].upper()
    if not hmac.compare_digest(provided_sig.upper(), expected_sig):
        return False, "Cryptographic signature validation failed. Tampered or counterfeit key.", {
            "valid": False, "reason": "TAMPERED_KEY", "hardware_id": current_hwid
        }

    # 3. Check Machine Hardware Lock
    if key_hwid.upper() != current_hwid.upper():
        return False, f"Hardware ID mismatch. Key belongs to {key_hwid}, current machine is {current_hwid}.", {
            "valid": False, "reason": "HARDWARE_MISMATCH", "hardware_id": current_hwid, "key_hwid": key_hwid
        }

    # 4. Check Expiration
    if expiry != "PERMANENT":
        try:
            exp_timestamp = int(expiry)
            if time.time() > exp_timestamp:
                exp_date = time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(exp_timestamp))
                return False, f"License key expired on {exp_date}.", {
                    "valid": False, "reason": "LICENSE_EXPIRED", "expired_at": exp_date, "hardware_id": current_hwid
                }
        except ValueError:
            return False, "Invalid expiration date in license.", {"valid": False, "hardware_id": current_hwid}

    return True, "License key verified and active.", {
        "valid": True,
        "client": client_name,
        "tier": tier,
        "expires": expiry if expiry == "PERMANENT" else time.strftime('%Y-%m-%d', time.gmtime(int(expiry))),
        "hardware_id": current_hwid
    }


def print_unauthorized_banner(hwid: str, reason: str = "UNLICENSED"):
    """Displays a high-impact terminal security banner."""
    banner = f"""
================================================================================
⛔ [OffensiveGrid Security Gate]: Unauthorized Machine! This instance is locked.
You require an official authorization key from Haroon Atieeq to run OffensiveGrid.
Hardware ID: {hwid}
Contact: haroonatieeq6@gmail.com to request access.
================================================================================
  Status Reason       : {reason}
  Lead Developer      : Haroon Atieeq (Founder & Lead Developer)
  Official Domain     : https://cszone.pk
  GitHub Repository   : https://github.com/haroonatieeq352/OffensiveGrid

HOW TO UNLOCK OFFENSIVEGRID ON THIS MACHINE:
1. Copy your unique Hardware ID: [{hwid}]
2. Email haroonatieeq6@gmail.com with your name & evaluation purpose.
3. Add your signed activation key to backend/.env:
   OFFENSIVEGRID_LICENSE_KEY=OGLIC.<payload>.<sig>
================================================================================
"""
    try:
        print(banner, file=sys.stderr)
    except UnicodeEncodeError:
        safe_banner = banner.replace("⛔", "[!]").replace("🛡️", "[*]").replace("🚀", "[>]")
        print(safe_banner, file=sys.stderr)

