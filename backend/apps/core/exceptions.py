"""
Centralized exception handler and custom exception classes for OffensiveGrid.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    ValidationError,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    MethodNotAllowed,
    Throttled
)

logger = logging.getLogger('cybergrid.exceptions')


class CyberGridAPIException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'CYBERGRID_ERROR'
    default_detail = 'A platform error occurred.'

    def __init__(self, detail=None, code=None, status_code=None):
        if status_code:
            self.status_code = status_code
        if code:
            self.default_code = code
        super().__init__(detail or self.default_detail, code or self.default_code)


class AttemptLimitExceeded(CyberGridAPIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = 'ATTEMPT_LIMIT_EXCEEDED'
    default_detail = 'Maximum flag submission attempt limit reached for this scenario.'


class ScenarioAlreadySolved(CyberGridAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'SCENARIO_ALREADY_SOLVED'
    default_detail = 'You have already solved this scenario.'


class CompetitionNotActive(CyberGridAPIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = 'COMPETITION_NOT_ACTIVE'
    default_detail = 'This competition is not currently active.'


def custom_exception_handler(exc, context):
    """
    Standardizes all API exceptions into a unified response structure:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "User-friendly message",
            "details": { ... }
        }
    }
    """
    # Call REST framework's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    from django.db.models import ProtectedError
    from django.core.exceptions import ValidationError as DjangoValidationError

    if isinstance(exc, ProtectedError):
        return Response(
            {
                "success": False,
                "error": {
                    "code": "RESOURCE_PROTECTED",
                    "message": "Cannot delete this item because other active records are currently linked to it.",
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if isinstance(exc, DjangoValidationError):
        return Response(
            {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input format or UUID syntax.",
                    "details": getattr(exc, 'message_dict', getattr(exc, 'messages', str(exc)))
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # If an unhandled exception occurred, format as a clean 500
    if response is None:
        logger.exception(f"Unhandled Server Error in view {context.get('view')}: {exc}")
        return Response(
            {
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected internal server error occurred. Please contact administrator.",
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Determine standard error code and message
    error_code = "API_ERROR"
    message = "Request failed."
    details = response.data

    if isinstance(exc, ValidationError):
        error_code = "VALIDATION_ERROR"
        message = "Validation failed for one or more fields."
    elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        error_code = "AUTHENTICATION_FAILED"
        message = str(exc.detail) if hasattr(exc, 'detail') else "Authentication credentials were not provided or are invalid."
    elif isinstance(exc, PermissionDenied):
        error_code = "PERMISSION_DENIED"
        message = "You do not have permission to perform this action."
    elif isinstance(exc, NotFound):
        error_code = "RESOURCE_NOT_FOUND"
        message = "The requested resource was not found."
    elif isinstance(exc, MethodNotAllowed):
        error_code = "METHOD_NOT_ALLOWED"
        message = f"Method '{context.get('request').method}' not allowed."
    elif isinstance(exc, Throttled):
        error_code = "RATE_LIMIT_EXCEEDED"
        message = f"Request was throttled. Expected available in {exc.wait} seconds."
    elif isinstance(exc, CyberGridAPIException):
        error_code = exc.default_code
        message = str(exc.detail)
    elif hasattr(exc, 'detail'):
        message = str(exc.detail)

    response.data = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
            "details": details
        }
    }

    return response
