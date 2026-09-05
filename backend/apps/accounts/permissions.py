"""
Custom Role-Based Access Control (RBAC) Permission Classes for OffensiveGrid.
"""
from rest_framework.permissions import BasePermission
from .models import RoleType


class IsSuperAdmin(BasePermission):
    """
    Allows access only to Super Administrators.
    """
    message = "Super Administrator privileges are required to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_super_admin
        )


class IsAdmin(BasePermission):
    """
    Allows access to Administrators and Super Administrators.
    """
    message = "Administrative privileges are required to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin_user
        )


class IsInstructor(BasePermission):
    """
    Allows access to Instructors, Admins, and Super Administrators.
    """
    message = "Instructor or Administrative privileges are required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_instructor
        )


class IsStudent(BasePermission):
    """
    Allows access to verified Students.
    """
    message = "Verified student trainee access is required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_student
        )


class IsSelfOrAdmin(BasePermission):
    """
    Allows access to the user himself or any administrator.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_admin_user:
            return True
        return obj == request.user or getattr(obj, 'user', None) == request.user
