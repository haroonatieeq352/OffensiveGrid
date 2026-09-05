import os
import uuid
from pathlib import Path
from django.conf import settings
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import requests

signer = TimestampSigner(salt='cybergrid_file_access_salt')


class StorageManager:
    """
    Manages scenario attachments and dossier files.
    Seamlessly integrates with Supabase Storage when credentials are provided,
    otherwise provides local secure signed file serving in zero-cost development mode.
    """

    @classmethod
    def is_supabase_configured(cls):
        return bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)

    @classmethod
    def upload_file(cls, file_obj, filename, scenario_id):
        """
        Uploads a scenario dossier file. Returns (storage_key, file_size_bytes, file_type).
        """
        file_ext = os.path.splitext(filename)[1].lower()
        unique_key = f"scenarios/{scenario_id}/{uuid.uuid4()}_{filename}"
        file_bytes = file_obj.read()
        file_size = len(file_bytes)
        file_type = getattr(file_obj, 'content_type', 'application/octet-stream')

        if cls.is_supabase_configured():
            try:
                # Upload to Supabase Storage REST API
                endpoint = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_BUCKET_NAME}/{unique_key}"
                headers = {
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Content-Type": file_type,
                }
                res = requests.post(endpoint, data=file_bytes, headers=headers, timeout=10)
                if res.status_code in [200, 201]:
                    return unique_key, file_size, file_type
            except Exception as e:
                # Fallback to local storage on connection error
                pass

        # Local development storage fallback
        local_path = default_storage.save(f"scenario_files/{unique_key}", ContentFile(file_bytes))
        return local_path, file_size, file_type

    @classmethod
    def generate_signed_token(cls, file_id, user_id):
        """
        Generates a tamper-evident time-limited token for authorized file download.
        """
        data = f"{file_id}:{user_id}"
        return signer.sign(data)

    @classmethod
    def verify_signed_token(cls, token, max_age_seconds=300):
        """
        Validates token integrity and expiry (default 5 minutes).
        """
        try:
            raw = signer.unsign(token, max_age=max_age_seconds)
            file_id, user_id = raw.split(':')
            return file_id, user_id
        except (BadSignature, SignatureExpired, ValueError):
            return None, None
