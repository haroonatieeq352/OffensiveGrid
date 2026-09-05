"""
Standardized API Response formatting helpers for OffensiveGrid.
"""
from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message=None, status_code=status.HTTP_200_OK, meta=None):
    """
    Returns a uniform success JSON response:
    {
        "success": true,
        "message": "...",
        "data": { ... },
        "meta": { ... }
    }
    """
    payload = {
        "success": True,
    }
    if message is not None:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    if meta is not None:
        payload["meta"] = meta
        
    return Response(payload, status=status_code)


def error_response(code, message, details=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Returns a uniform error JSON response:
    {
        "success": false,
        "error": {
            "code": "CODE",
            "message": "...",
            "details": { ... }
        }
    }
    """
    error_payload = {
        "code": code,
        "message": message,
    }
    if details is not None:
        error_payload["details"] = details
        
    return Response(
        {
            "success": False,
            "error": error_payload
        },
        status=status_code
    )
