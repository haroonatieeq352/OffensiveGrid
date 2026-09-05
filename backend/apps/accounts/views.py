"""
API Views for Authentication and User Management in OffensiveGrid.
"""
import random
import logging
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
import secrets
import re
import pyotp
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.contrib.auth.password_validation import validate_password
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404

from apps.core.responses import success_response, error_response
from .models import (
    User,
    Role,
    UserRole,
    RoleType,
    EmailVerificationOTP,
    InstructorUpgradeRequest,
    PasswordResetOTP,
)
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    RoleSerializer,
    InstructorUpgradeRequestSerializer,
    AdminInstructorUpgradeRequestSerializer,
)
from .permissions import IsAdmin, IsSuperAdmin

logger = logging.getLogger('cybergrid.accounts')


class SendEmailOTPView(APIView):
    """
    POST /api/v1/auth/send-email-otp/
    Generates and sends a 6-digit OTP to the trainee's email with 300s (5-min) expiry and 30s resend cooldown.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp_send'

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        if not email or '@' not in email:
            return error_response(
                code="INVALID_EMAIL",
                message="Please provide a valid email address.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Check if already registered
        if User.objects.filter(email__iexact=email).exists():
            return error_response(
                code="EMAIL_ALREADY_REGISTERED",
                message="An account with this email address is already registered. Please sign in.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 30-Second Cooldown Check (Only block if previous code was created less than 30s ago)
        recent_otp = EmailVerificationOTP.objects.filter(
            email=email,
            created_at__gte=timezone.now() - timedelta(seconds=30)
        ).first()

        if recent_otp:
            time_passed = (timezone.now() - recent_otp.created_at).total_seconds()
            remaining_cooldown = max(1, 30 - int(time_passed))
            return error_response(
                code="COOLDOWN_ACTIVE",
                message=f"Please wait {remaining_cooldown} seconds before requesting another code.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Generate 6-digit random numeric code (e.g. 748291)
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(seconds=300)  # 5 minutes for comfortable checking

        # Clear older unverified OTP records for this email
        EmailVerificationOTP.objects.filter(email=email, is_verified=False).delete()

        # Save new active OTP in database
        EmailVerificationOTP.objects.create(
            email=email,
            otp_code=otp_code,
            is_verified=False,
            expires_at=expires_at
        )

        # Send Real High-Aesthetic HTML Email
        subject = f"🔐 {otp_code} is your OffensiveGrid Verification Code"
        text_content = (
            f"Hello,\n\n"
            f"Your OffensiveGrid 6-digit verification code is: {otp_code}\n\n"
            f"This code will expire in 5 minutes (300 seconds).\n\n"
            f"If you did not initiate this registration request, you can safely ignore this email.\n\n"
            f"Best regards,\nOffensiveGrid Defense Team"
        )
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OffensiveGrid Verification</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #090d16; padding: 40px 10px;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                  <!-- Top Gradient Strip -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #ce2029 0%, #06b6d4 100%); height: 5px;"></td>
                  </tr>
                  
                  <!-- Main Body -->
                  <tr>
                    <td style="padding: 35px 30px;">
                      <!-- Logo / Header -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td>
                            <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                              🛡️ Offensive<span style="color: #ce2029;">Grid</span>
                            </div>
                            <div style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">
                              DEFENSE & CTF LABS • SECURITY SERVICE
                            </div>
                          </td>
                        </tr>
                      </table>

                      <div style="height: 25px;"></div>

                      <!-- Greeting & Message -->
                      <div style="color: #f1f5f9; font-size: 16px; font-weight: 700; margin-bottom: 8px;">
                        Trainee Account Email Verification
                      </div>
                      <div style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
                        Thank you for joining OffensiveGrid. Enter the following 6-digit verification code to confirm your email and activate your CTF scenario access:
                      </div>

                      <!-- 6-Digit Bold OTP Box -->
                      <div style="background-color: #1e293b; border: 2px dashed #ce2029; border-radius: 12px; padding: 22px 15px; text-align: center; margin-bottom: 25px;">
                        <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; display: inline-block;">
                          {otp_code}
                        </span>
                      </div>

                      <!-- Security Details Box -->
                      <div style="background-color: rgba(206, 32, 41, 0.12); border-left: 4px solid #ce2029; border-radius: 6px; padding: 12px 16px; margin-bottom: 25px;">
                        <div style="color: #c7d2fe; font-size: 12px; font-weight: 500; line-height: 1.5;">
                          ⏱️ <strong>Valid for 5 minutes (300 seconds)</strong>. For security reasons, do not forward or share this code with anyone.
                        </div>
                      </div>

                      <!-- Security Footer Note -->
                      <div style="border-top: 1px solid #1e293b; padding-top: 20px; color: #64748b; font-size: 11px; line-height: 1.6;">
                        If you did not initiate this registration request on OffensiveGrid, no action is needed and you can safely ignore this email.
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0b1120; padding: 16px 30px; text-align: center; border-top: 1px solid #1e293b;">
                      <div style="color: #475569; font-size: 11px; font-family: monospace;">
                        © 2026 OffensiveGrid Defense & CTF Labs • All Rights Reserved
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"Verification OTP email successfully sent to {email}")
        except Exception as e:
            logger.warning(f"Could not send email via SMTP: {e}")

        return success_response(
            data={
                "email": email,
                "expires_in_seconds": 300,
                "cooldown_seconds": 30,
            },
            message=f"6-digit verification code sent to {email}. Valid for 5 minutes."
        )


class VerifyEmailOTPView(APIView):
    """
    POST /api/v1/auth/verify-email-otp/
    Validates the 6-digit OTP code against the database record.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp_send'

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        otp_code = request.data.get('otp_code', '').strip()

        if not email or not otp_code:
            return error_response(
                code="MISSING_DATA",
                message="Both email and 6-digit OTP code are required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Retrieve the latest active OTP record for this email
        record = EmailVerificationOTP.objects.filter(email=email).order_by('-created_at').first()

        if not record or record.otp_code != otp_code:
            return error_response(
                code="INVALID_OTP",
                message="Invalid 6-digit verification code. Please check your email and enter the exact 6 digits.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if timezone.now() > record.expires_at:
            return error_response(
                code="OTP_EXPIRED",
                message="This verification code has expired (5-minute limit). Please click 'Resend OTP' for a new code.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        record.is_verified = True
        record.save(update_fields=['is_verified'])

        return success_response(
            data={"email": email, "is_verified": True},
            message="Email verified successfully! You can now complete your registration."
        )


class RegisterView(APIView):
    """
    POST /api/v1/auth/register/
    Registers a new trainee student account.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        response_data = serializer.data
        return success_response(
            data=response_data,
            message="Account registered successfully. Welcome to OffensiveGrid!",
            status_code=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Authenticates user with email/username and password, returning JWT access & refresh tokens.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        return success_response(
            data=serializer.validated_data,
            message="Authentication successful.",
            status_code=status.HTTP_200_OK
        )


class CustomTokenRefreshView(TokenRefreshView):
    """
    POST /api/v1/auth/refresh/
    Exchanges a valid refresh token for a new access token.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            return success_response(
                data=response.data,
                message="Access token refreshed successfully."
            )
        return response


class MeView(APIView):
    """
    GET /api/v1/auth/me/
    PATCH /api/v1/auth/me/
    Retrieves or updates the authenticated user's profile and assigned roles.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserProfileSerializer(request.user)
        return success_response(
            data=serializer.data,
            message="Profile retrieved successfully."
        )

    def patch(self, request, *args, **kwargs):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return success_response(
            data=serializer.data,
            message="Profile updated successfully."
        )


class UserListView(generics.ListAPIView):
    """
    GET /api/v1/auth/users/
    Administrative endpoint to list, search, and filter all platform users.
    """
    permission_classes = [IsAdmin]
    serializer_class = UserProfileSerializer
    queryset = User.objects.prefetch_related('roles').all()
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Filter by role if specified
        role_filter = request.query_params.get('role')
        if role_filter:
            queryset = queryset.filter(roles__name=role_filter.upper())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class UserStatusToggleView(APIView):
    """
    POST /api/v1/auth/users/<uuid:user_id>/toggle-status/
    Admin toggle to activate or deactivate a student account.
    """
    permission_classes = [IsAdmin]

    def post(self, request, user_id, *args, **kwargs):
        target_user = get_object_or_404(User, id=user_id)
        if target_user == request.user:
            return error_response(
                code="SELF_ACTION_FORBIDDEN",
                message="You cannot deactivate your own administrative account.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
            
        if target_user.is_super_admin and not request.user.is_super_admin:
            return error_response(
                code="PERMISSION_DENIED",
                message="Administrators cannot modify Super Administrator accounts.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        target_user.is_active = not target_user.is_active
        target_user.save(update_fields=['is_active', 'updated_at'])
        
        status_text = "activated" if target_user.is_active else "deactivated"
        return success_response(
            data=UserProfileSerializer(target_user).data,
            message=f"User {target_user.username} has been {status_text}."
        )


class StudentUpgradeRequestView(APIView):
    """
    POST /api/v1/auth/instructor-requests/submit/
    Student applies for instructor status.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if request.user.is_instructor:
            return error_response("ALREADY_INSTRUCTOR", "You already have instructor access.", status.HTTP_400_BAD_REQUEST)
        
        pending_exists = InstructorUpgradeRequest.objects.filter(user=request.user, status=InstructorUpgradeRequest.RequestStatus.PENDING).exists()
        if pending_exists:
            return error_response("PENDING_REQUEST_EXISTS", "You already have a pending upgrade request.", status.HTTP_400_BAD_REQUEST)

        serializer = InstructorUpgradeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, status=InstructorUpgradeRequest.RequestStatus.PENDING)
        
        return success_response(serializer.data, "Instructor upgrade request submitted successfully.", status.HTTP_201_CREATED)


class AdminUpgradeRequestListView(generics.ListAPIView):
    """
    GET /api/v1/auth/admin/instructor-requests/
    Super Admin views all instructor requests.
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = AdminInstructorUpgradeRequestSerializer
    queryset = InstructorUpgradeRequest.objects.select_related('user', 'reviewed_by').order_by('-created_at')


class AdminUpgradeProcessView(APIView):
    """
    POST /api/v1/auth/admin/instructor-requests/<uuid:pk>/process/
    Super Admin approves or rejects an instructor request.
    """
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk, *args, **kwargs):
        action = request.data.get('action')
        if action not in ['approve', 'reject']:
            return error_response("INVALID_ACTION", "Action must be 'approve' or 'reject'.", status.HTTP_400_BAD_REQUEST)
        
        upgrade_request = get_object_or_404(InstructorUpgradeRequest, id=pk)
        
        if upgrade_request.status != InstructorUpgradeRequest.RequestStatus.PENDING:
            return error_response("ALREADY_PROCESSED", "This request has already been processed.", status.HTTP_400_BAD_REQUEST)
        
        upgrade_request.reviewed_by = request.user
        upgrade_request.reviewed_at = timezone.now()
        
        if action == 'approve':
            upgrade_request.status = InstructorUpgradeRequest.RequestStatus.APPROVED
            # Assign the role securely
            role, _ = Role.objects.get_or_create(name=RoleType.INSTRUCTOR)
            UserRole.objects.get_or_create(user=upgrade_request.user, role=role)
        else:
            upgrade_request.status = InstructorUpgradeRequest.RequestStatus.REJECTED
        
        upgrade_request.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])
        
        return success_response(None, f"Instructor request has been {action}d successfully.", status.HTTP_200_OK)


class AdminUpgradeMarkSeenView(APIView):
    """
    POST /api/v1/auth/admin/instructor-requests/<uuid:pk>/mark-seen/
    Super Admin marks a request as seen.
    """
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk, *args, **kwargs):
        upgrade_request = get_object_or_404(InstructorUpgradeRequest, id=pk)
        if not upgrade_request.is_seen:
            upgrade_request.is_seen = True
            upgrade_request.save(update_fields=['is_seen'])
        return success_response(data={"id": str(upgrade_request.id), "is_seen": True}, message="Marked as seen.")


class AdminPendingInstructorStatsView(APIView):
    """
    GET /api/v1/auth/admin/instructor-requests/stats/
    Super Admin API to check live unread instructor requests.
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request, *args, **kwargs):
        unseen_count = InstructorUpgradeRequest.objects.filter(
            is_seen=False,
            status=InstructorUpgradeRequest.RequestStatus.PENDING
        ).count()
        return success_response(data={"pending_count": unseen_count})


class RevokeInstructorRoleView(APIView):
    """
    POST /api/v1/auth/users/<uuid:user_id>/revoke-instructor/
    Admin revokes the Instructor role from a user.
    """
    permission_classes = [IsAdmin]

    def post(self, request, user_id, *args, **kwargs):
        target_user = get_object_or_404(User, id=user_id)
        
        if target_user.is_super_admin and not request.user.is_super_admin:
            return error_response(
                code="PERMISSION_DENIED",
                message="Administrators cannot modify Super Administrator accounts.",
                status_code=status.HTTP_403_FORBIDDEN
            )
            
        if RoleType.INSTRUCTOR not in target_user.role_names:
            return error_response(
                code="ROLE_NOT_FOUND",
                message="User does not have the Instructor role.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
            
        # Find and delete the instructor role assignment
        try:
            role = Role.objects.get(name=RoleType.INSTRUCTOR)
            UserRole.objects.filter(user=target_user, role=role).delete()
        except Role.DoesNotExist:
            pass
            
        # Update any approved requests to REVOKED
        InstructorUpgradeRequest.objects.filter(
            user=target_user, 
            status=InstructorUpgradeRequest.RequestStatus.APPROVED
        ).update(status=InstructorUpgradeRequest.RequestStatus.REVOKED)
            
        return success_response(
            data=UserProfileSerializer(target_user).data,
            message=f"Instructor role revoked from {target_user.username}."
        )


class PasswordResetRequestView(APIView):
    """
    POST /api/v1/auth/password-reset/request/
    Initiates password recovery with Anti-User Enumeration and 60s cooldown.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_request'

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        if not email or '@' not in email:
            return error_response(
                code="INVALID_EMAIL",
                message="Please provide a valid email address.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        generic_message = "If an account associated with this email address exists, a 6-digit password reset code has been sent to your inbox."

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if not user:
            # Anti-user enumeration: Return identical success response so attackers cannot probe for registered emails
            return success_response(
                data={"email": email, "cooldown_seconds": 60},
                message=generic_message
            )

        # 60s Cooldown Check
        recent = PasswordResetOTP.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(seconds=60)
        ).first()

        if recent:
            time_passed = (timezone.now() - recent.created_at).total_seconds()
            remaining = max(1, 60 - int(time_passed))
            return error_response(
                code="COOLDOWN_ACTIVE",
                message=f"Please wait {remaining} seconds before requesting another reset code.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Clean old unverified OTPs for this user
        PasswordResetOTP.objects.filter(user=user, is_verified=False).delete()

        # Generate 6-digit cryptographic random code
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=10)

        PasswordResetOTP.objects.create(
            user=user,
            otp_code=otp_code,
            expires_at=expires_at
        )

        # Send High-Aesthetic HTML Email
        subject = f"🔐 {otp_code} is your OffensiveGrid Password Reset Code"
        text_content = (
            f"Hello {user.username},\n\n"
            f"A password reset request was initiated for your OffensiveGrid account.\n\n"
            f"Your 6-digit reset code is: {otp_code}\n\n"
            f"This code will expire in 10 minutes.\n\n"
            f"If you did not initiate this request, someone may be attempting to access your account. Please ensure your account credentials are safe.\n\n"
            f"Best regards,\nOffensiveGrid Security Team"
        )

        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>OffensiveGrid Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #090d16; padding: 40px 10px;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #ce2029 0%, #3b82f6 100%); height: 5px;"></td>
                  </tr>
                  <tr>
                    <td style="padding: 35px 30px;">
                      <h2 style="color: #ffffff; margin: 0 0 10px; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
                      <p style="color: #94a3b8; font-size: 14px; line-height: 22px; margin: 0 0 25px;">
                        Hello <strong style="color: #f1f5f9;">{user.username}</strong>, we received a request to reset your OffensiveGrid account password. Enter the 6-digit code below:
                      </p>
                      <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
                        <span style="font-family: monospace, Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8;">
                          {otp_code}
                        </span>
                        <div style="color: #64748b; font-size: 12px; margin-top: 8px;">⏱️ Valid for 10 minutes only</div>
                      </div>
                      <p style="color: #64748b; font-size: 12px; line-height: 18px; margin: 0;">
                        ⚠️ If you did not request this password reset, you can safely ignore this email. Your current password remains unchanged.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #090d16; padding: 15px 30px; text-align: center; border-top: 1px solid #1e293b;">
                      <span style="color: #475569; font-size: 11px;">OffensiveGrid Defense & CTF Labs • High-Security Authentication Engine</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"Password reset OTP successfully sent to {email}")
        except Exception as e:
            logger.warning(f"Could not send password reset email via SMTP: {e}")

        return success_response(
            data={"email": email, "cooldown_seconds": 60},
            message=generic_message
        )


class PasswordResetVerifyOTPView(APIView):
    """
    POST /api/v1/auth/password-reset/verify-otp/
    Validates the 6-digit OTP, handles brute-force lockout (max 5 tries), and issues a 5-minute single-use reset_token.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_verify'

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        otp_code = request.data.get('otp_code', '').strip()

        if not email or not otp_code:
            return error_response(
                code="MISSING_DATA",
                message="Both email and 6-digit reset code are required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if not user:
            return error_response(
                code="INVALID_OTP",
                message="Invalid or expired verification code.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        record = PasswordResetOTP.objects.filter(
            user=user,
            is_verified=False,
            is_used=False
        ).order_by('-created_at').first()

        if not record:
            return error_response(
                code="NO_ACTIVE_REQUEST",
                message="No active password reset request found. Please request a new code.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Brute-force protection: Lock out after 5 failed tries
        if record.failed_attempts >= 5:
            record.delete()
            return error_response(
                code="TOO_MANY_ATTEMPTS",
                message="Too many failed attempts. This reset code has been permanently invalidated for security. Please request a new code.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if timezone.now() > record.expires_at:
            return error_response(
                code="OTP_EXPIRED",
                message="This password reset code has expired (10-minute limit). Please request a new code.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if record.otp_code != otp_code:
            record.failed_attempts += 1
            record.save(update_fields=['failed_attempts'])
            remaining = max(0, 5 - record.failed_attempts)
            return error_response(
                code="INVALID_OTP",
                message=f"Invalid 6-digit code. {remaining} attempt(s) remaining.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # OTP is verified! Generate cryptographically random single-use reset token
        reset_token = secrets.token_urlsafe(48)
        record.reset_token = reset_token
        record.is_verified = True
        record.token_expires_at = timezone.now() + timedelta(minutes=5)
        record.save(update_fields=['reset_token', 'is_verified', 'token_expires_at'])

        # Check if Admin 2FA is required
        is_admin = user.roles.filter(name__in=[RoleType.SUPER_ADMIN, RoleType.ADMIN]).exists()
        requires_2fa = is_admin and user.is_totp_enabled

        return success_response(
            data={
                "reset_token": reset_token,
                "requires_2fa": requires_2fa,
                "email": email
            },
            message="Verification successful. Please set your new password."
        )


class PasswordResetConfirmView(APIView):
    """
    POST /api/v1/auth/password-reset/confirm/
    Validates reset_token, enforces Admin 2FA (if applicable), sets new password, and revokes sessions.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_confirm'

    def post(self, request, *args, **kwargs):
        reset_token = request.data.get('reset_token', '').strip()
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')
        totp_code = request.data.get('totp_code', '').strip()

        if not reset_token or not new_password or not confirm_password:
            return error_response(
                code="MISSING_DATA",
                message="Reset token, new password, and confirm password are required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        record = PasswordResetOTP.objects.filter(
            reset_token=reset_token,
            is_verified=True,
            is_used=False
        ).first()

        if not record:
            return error_response(
                code="INVALID_RESET_SESSION",
                message="Invalid or expired reset session. Please request a new reset code.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if not record.token_expires_at or timezone.now() > record.token_expires_at:
            return error_response(
                code="TOKEN_EXPIRED",
                message="Reset session has expired (5-minute limit). Please request a new reset code.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = record.user

        # Admin 2FA Verification (Defense in Depth)
        is_admin = user.roles.filter(name__in=[RoleType.SUPER_ADMIN, RoleType.ADMIN]).exists()
        if is_admin and user.is_totp_enabled:
            if not totp_code:
                return error_response(
                    code="TOTP_REQUIRED",
                    message="Two-Factor Authentication is required for administrator accounts. Please enter your 6-digit Authenticator code.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            totp = pyotp.TOTP(user.totp_secret)
            if not totp.verify(totp_code):
                return error_response(
                    code="INVALID_TOTP",
                    message="Invalid Two-Factor Authentication code. Please enter the current code from your Authenticator app.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        # Validate Passwords
        if new_password != confirm_password:
            return error_response(
                code="PASSWORD_MISMATCH",
                message="Passwords do not match.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8 or len(new_password) > 128:
            return error_response(
                code="INVALID_PASSWORD_LENGTH",
                message="Password must be between 8 and 128 characters long.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if not re.search(r'[A-Z]', new_password):
            return error_response(code="PASSWORD_NO_UPPER", message="Password must contain at least one capital letter (A-Z).", status_code=status.HTTP_400_BAD_REQUEST)
        if not re.search(r'[a-z]', new_password):
            return error_response(code="PASSWORD_NO_LOWER", message="Password must contain at least one small letter (a-z).", status_code=status.HTTP_400_BAD_REQUEST)
        if not re.search(r'\d', new_password):
            return error_response(code="PASSWORD_NO_DIGIT", message="Password must contain at least one number (0-9).", status_code=status.HTTP_400_BAD_REQUEST)
        if not re.search(r'[@$!%*?&#^()_+\-=\[\]{};:\'",.<>\/\\|`~]', new_password):
            return error_response(code="PASSWORD_NO_SPECIAL", message="Password must contain at least one special symbol.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=user)
        except Exception as e:
            return error_response(code="PASSWORD_WEAK", message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

        # Set New Password (automatically hashes with PBKDF2/SHA256 and updates password salt)
        user.set_password(new_password)
        user.save()

        # Mark OTP as used and clean up all reset records for this user
        record.is_used = True
        record.save(update_fields=['is_used'])
        PasswordResetOTP.objects.filter(user=user).delete()

        # Send Security Confirmation Email
        try:
            alert_subject = "🛡️ Security Alert: OffensiveGrid Password Changed"
            alert_body = (
                f"Hello {user.username},\n\n"
                f"Your OffensiveGrid account password was successfully changed on {timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}.\n\n"
                f"If you made this change, you can safely disregard this notice.\n"
                f"If you did NOT make this change, please contact OffensiveGrid security immediately to secure your account.\n\n"
                f"Best regards,\nOffensiveGrid Security Team"
            )
            alert_msg = EmailMultiAlternatives(
                subject=alert_subject,
                body=alert_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            alert_msg.send(fail_silently=True)
        except Exception as e:
            logger.warning(f"Could not send password change alert email: {e}")

        return success_response(
            message="Your password has been changed successfully. You can now sign in with your new credentials."
        )


class GoogleLoginView(APIView):
    """
    POST /api/v1/auth/google/
    Validates Google OAuth ID token, authenticates existing user or auto-onboards student.
    Enforces 2FA for elevated Admin accounts.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        token = request.data.get('id_token') or request.data.get('credential')
        otp = request.data.get('otp', '').strip()

        if not token:
            return error_response(
                code="MISSING_TOKEN",
                message="Google ID token is required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                google_client_id
            )
        except ValueError as e:
            return error_response(
                code="INVALID_GOOGLE_TOKEN",
                message=f"Google token verification failed: {str(e)}",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        email = idinfo.get('email', '').strip().lower()
        if not email or not idinfo.get('email_verified', False):
            return error_response(
                code="UNVERIFIED_EMAIL",
                message="The Google account email is unverified.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        mode = request.data.get('mode') or request.data.get('intent') or 'login'

        user = User.objects.filter(email__iexact=email).first()
        requires_totp_setup = False

        if user:
            # If user already exists and is attempting registration, block and show strict alert
            if mode == 'register':
                return error_response(
                    code="ACCOUNT_ALREADY_EXISTS",
                    message=f"An account with this email ({email}) is already registered. Please sign in from the Login page.",
                    details={"email": email, "code": "account_exists"},
                    status_code=status.HTTP_409_CONFLICT
                )

            if not user.is_active:
                return error_response(
                    code="ACCOUNT_INACTIVE",
                    message="This user account has been disabled. Please contact support.",
                    status_code=status.HTTP_403_FORBIDDEN
                )

            # Check Admin 2FA enforcement
            is_admin = user.roles.filter(name__in=[RoleType.SUPER_ADMIN, RoleType.ADMIN]).exists()
            if is_admin:
                if user.is_totp_enabled:
                    if not otp:
                        return error_response(
                            code="OTP_REQUIRED",
                            message="2FA is required. Please enter your 6-digit code.",
                            details={"code": "otp_required", "email": user.email},
                            status_code=status.HTTP_400_BAD_REQUEST
                        )
                    totp = pyotp.TOTP(user.totp_secret)
                    if not totp.verify(otp):
                        return error_response(
                            code="INVALID_OTP",
                            message="Invalid 2FA code. Please check your Authenticator app.",
                            status_code=status.HTTP_401_UNAUTHORIZED
                        )
                else:
                    requires_totp_setup = True

            # Sync avatar or name if missing
            avatar = idinfo.get('picture')
            updated_fields = []
            if avatar and not user.avatar_url:
                user.avatar_url = avatar
                updated_fields.append('avatar_url')
            if not user.first_name and idinfo.get('given_name'):
                user.first_name = idinfo.get('given_name')[:50]
                updated_fields.append('first_name')
            if not user.last_name and idinfo.get('family_name'):
                user.last_name = idinfo.get('family_name')[:50]
                updated_fields.append('last_name')
            if updated_fields:
                user.save(update_fields=updated_fields)

        else:
            # Auto-onboard as Student / Trainee
            given_name = idinfo.get('given_name') or ''
            family_name = idinfo.get('family_name') or ''
            if not given_name and not family_name:
                full_name = idinfo.get('name', 'Trainee')
                parts = full_name.split(' ', 1)
                given_name = parts[0]
                family_name = parts[1] if len(parts) > 1 else ''

            # Generate unique clean username
            email_prefix = re.sub(r'[^a-z0-9_]', '', email.split('@')[0].lower())[:20] or 'trainee'
            base_username = email_prefix
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1

            avatar = idinfo.get('picture')

            user = User.objects.create_user(
                email=email,
                username=username,
                first_name=given_name[:50],
                last_name=family_name[:50],
                avatar_url=avatar,
                password=None
            )

        # Issue SimpleJWT tokens
        refresh = RefreshToken.for_user(user)
        user_data = UserProfileSerializer(user).data

        return success_response(
            data={
                "user": user_data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                "requires_totp_setup": requires_totp_setup
            },
            message="Google authentication successful."
        )


