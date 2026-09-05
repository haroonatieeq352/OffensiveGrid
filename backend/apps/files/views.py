import os
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from apps.core.responses import success_response, error_response
from apps.accounts.permissions import IsAdmin
from apps.scenarios.models import Scenario, ScenarioFile
from .services import StorageManager


class FileUploadView(APIView):
    """
    POST /api/v1/files/upload/
    Uploads a scenario attachment file (PDF, PCAP, DOCX, TXT, binary).
    """
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        scenario_id = request.data.get('scenario_id')

        if not file_obj:
            return error_response(
                code="FILE_REQUIRED",
                message="No file was provided in the request.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        scenario = get_object_or_404(Scenario, id=scenario_id) if scenario_id else None

        storage_path, file_size, file_type = StorageManager.upload_file(
            file_obj=file_obj,
            filename=file_obj.name,
            scenario_id=str(scenario.id) if scenario else "common"
        )

        scenario_file = ScenarioFile.objects.create(
            scenario=scenario,
            file_name=file_obj.name,
            file_path=storage_path,
            file_size_bytes=file_size,
            file_type=file_type,
            is_public=True
        )

        return success_response(
            data={
                "id": str(scenario_file.id),
                "file_name": scenario_file.file_name,
                "file_path": scenario_file.file_path,
                "file_size_bytes": scenario_file.file_size_bytes,
                "file_type": scenario_file.file_type,
            },
            message="File uploaded successfully.",
            status_code=status.HTTP_201_CREATED
        )


class FileDownloadTokenView(APIView):
    """
    GET /api/v1/files/<uuid:file_id>/token/
    Generates a secure, short-lived presigned token for the authenticated trainee.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, file_id, *args, **kwargs):
        scenario_file = get_object_or_404(ScenarioFile, id=file_id)
        token = StorageManager.generate_signed_token(str(scenario_file.id), str(request.user.id))

        return success_response(
            data={
                "token": token,
                "download_url": f"/api/v1/files/download/{token}/",
                "expires_in_seconds": 300,
                "file_name": scenario_file.file_name,
            },
            message="Secure download token issued."
        )


class SecureFileDownloadView(APIView):
    """
    GET /api/v1/files/download/<str:token>/
    Validates token and securely streams the file attachment to the client.
    """
    permission_classes = [AllowAny]

    def get(self, request, token, *args, **kwargs):
        file_id, user_id = StorageManager.verify_signed_token(token)

        if not file_id:
            return error_response(
                code="INVALID_OR_EXPIRED_TOKEN",
                message="The download token is invalid or has expired. Please request a new download link.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        scenario_file = get_object_or_404(ScenarioFile, id=file_id)

        # Serve local file if in local storage
        if default_storage.exists(scenario_file.file_path):
            file_handle = default_storage.open(scenario_file.file_path, 'rb')
            response = FileResponse(file_handle, content_type=scenario_file.file_type)
            response['Content-Disposition'] = f'attachment; filename="{scenario_file.file_name}"'
            return response

        return error_response(
            code="FILE_NOT_FOUND",
            message="File asset could not be located on storage server.",
            status_code=status.HTTP_404_NOT_FOUND
        )
