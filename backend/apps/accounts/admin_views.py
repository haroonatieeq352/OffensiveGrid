import re
import pyotp
import uuid
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from django.conf import settings

from apps.core.responses import success_response, error_response
from .models import User, Role, UserRole, RoleType, AdminInviteKey, EmailVerificationOTP
from .permissions import IsSuperAdmin

class GenerateInviteKeyView(APIView):
    """
    POST /api/v1/auth/admin/invite/
    SuperAdmin only. Generates a new one-time use invite key for creating an Admin.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, *args, **kwargs):
        role_type = request.data.get('role', RoleType.ADMIN)
        if role_type not in [RoleType.ADMIN, RoleType.SUPER_ADMIN]:
            role_type = RoleType.ADMIN

        expires_at = timezone.now() + timezone.timedelta(days=7) # Key valid for 7 days
        
        invite = AdminInviteKey.objects.create(
            created_by=request.user,
            role=role_type,
            expires_at=expires_at
        )

        return success_response(
            data={"invite_key": str(invite.key), "expires_at": invite.expires_at, "role": invite.role},
            message="Admin invite key generated successfully.",
            status_code=status.HTTP_201_CREATED
        )

class AdminRegisterView(APIView):
    """
    POST /api/v1/auth/admin/register/
    Public. Uses a valid invite key to register a new admin user.
    Hardened with ScopedRateThrottle, OTP verification, and strict input validation.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def post(self, request, *args, **kwargs):
        invite_key = request.data.get('invite_key')
        if not invite_key:
            return error_response(code="MISSING_KEY", message="Invite key is required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            invite = AdminInviteKey.objects.get(key=invite_key, is_used=False)
        except (AdminInviteKey.DoesNotExist, ValueError):
            return error_response(code="INVALID_KEY", message="Invalid or already used invite key.", status_code=status.HTTP_400_BAD_REQUEST)
        
        if invite.expires_at < timezone.now():
            return error_response(code="EXPIRED_KEY", message="This invite key has expired.", status_code=status.HTTP_400_BAD_REQUEST)

        email = request.data.get('email', '').strip().lower()
        username = request.data.get('username', '').strip().lower()
        password = request.data.get('password', '')
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()

        if not all([email, username, password]):
            return error_response(code="VALIDATION_ERROR", message="Email, username, and password are required.", status_code=status.HTTP_400_BAD_REQUEST)

        # 1. Email OTP Verification Lock (Server-side Enforcement)
        is_verified = EmailVerificationOTP.objects.filter(
            email=email,
            is_verified=True
        ).exists()
        if not is_verified:
            return error_response(
                code="EMAIL_NOT_VERIFIED",
                message="Email address has not been verified. Please request and verify the 6-digit OTP code before completing admin registration.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 2. First Name & Last Name Sanitization & Length Limits
        if first_name and not re.match(r"^[A-Za-z\s'-]{1,50}$", first_name):
            return error_response(
                code="INVALID_FIRST_NAME",
                message="First name can only contain alphabetic letters, hyphens, and spaces (max 50 characters).",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        if last_name and not re.match(r"^[A-Za-z\s'-]{1,50}$", last_name):
            return error_response(
                code="INVALID_LAST_NAME",
                message="Last name can only contain alphabetic letters, hyphens, and spaces (max 50 characters).",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 3. Username Validation & Length Limits
        if len(username) < 3 or len(username) > 30:
            return error_response(
                code="INVALID_USERNAME_LENGTH",
                message="Username must be between 3 and 30 characters.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        if not re.match(r"^[a-z0-9_-]+$", username):
            return error_response(
                code="INVALID_USERNAME_CHARS",
                message="Username can only contain small letters, numbers, and underscores.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 4. Email Length & Uniqueness
        if len(email) > 254:
            return error_response(
                code="EMAIL_TOO_LONG",
                message="Email address cannot exceed 254 characters.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(email__iexact=email).exists():
            return error_response(code="EMAIL_TAKEN", message="An account with this email is already registered.", status_code=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username__iexact=username).exists():
            return error_response(code="USERNAME_TAKEN", message="Username is already taken. Please choose a different username.", status_code=status.HTTP_400_BAD_REQUEST)

        # 5. Password Complexity & Length Validation
        if len(password) < 8 or len(password) > 128:
            return error_response(
                code="INVALID_PASSWORD_LENGTH",
                message="Password must be between 8 and 128 characters long.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        if not re.search(r'[A-Z]', password):
            return error_response(code="PASSWORD_NO_UPPER", message="Password must contain at least one capital letter (A-Z).", status_code=status.HTTP_400_BAD_REQUEST)
        if not re.search(r'[a-z]', password):
            return error_response(code="PASSWORD_NO_LOWER", message="Password must contain at least one small letter (a-z).", status_code=status.HTTP_400_BAD_REQUEST)
        if not re.search(r'\d', password):
            return error_response(code="PASSWORD_NO_DIGIT", message="Password must contain at least one number (0-9).", status_code=status.HTTP_400_BAD_REQUEST)
        if not re.search(r'[@$!%*?&#^()_+\-=\[\]{};:\'",.<>\/\\|`~]', password):
            return error_response(code="PASSWORD_NO_SPECIAL", message="Password must contain at least one special symbol.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(password)
        except Exception as e:
            return error_response(code="PASSWORD_WEAK", message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=True # Admins are staff
        )

        # Assign Role based on invite
        role, _ = Role.objects.get_or_create(name=invite.role)
        UserRole.objects.get_or_create(user=user, role=role)

        # Mark invite as used
        invite.is_used = True
        invite.save()

        # Consume verified OTP record
        EmailVerificationOTP.objects.filter(email=email).delete()

        return success_response(
            data={"id": str(user.id), "username": user.username, "email": user.email},
            message="Admin user registered successfully. You can now login.",
            status_code=status.HTTP_201_CREATED
        )


class GenerateTOTPSecretView(APIView):
    """
    POST /api/v1/auth/admin/totp/generate/
    Authenticated admins. Generates a new TOTP secret and returns provisioning URI.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        
        # Always generate a new secret if setup is requested
        secret = pyotp.random_base32()
        user.totp_secret = secret
        user.is_totp_enabled = False # Needs verification first
        user.save()

        # Get provisioning URI
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=user.email, issuer_name="OffensiveGrid")

        return success_response(
            data={"secret": secret, "uri": uri},
            message="TOTP secret generated. Please scan the QR code."
        )


class VerifyTOTPSetupView(APIView):
    """
    POST /api/v1/auth/admin/totp/verify/
    Authenticated admins. Verifies the first OTP and enables TOTP.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        otp = request.data.get('otp', '').strip()

        if not user.totp_secret:
            return error_response(code="NO_SECRET", message="Please generate a TOTP secret first.", status_code=status.HTTP_400_BAD_REQUEST)

        if not otp:
            return error_response(code="MISSING_OTP", message="Please provide the 6-digit OTP.", status_code=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(user.totp_secret)
        if totp.verify(otp):
            user.is_totp_enabled = True
            user.save()
            return success_response(message="Two-Factor Authentication enabled successfully!")
        
        return error_response(code="INVALID_OTP", message="Invalid OTP. Please try again.", status_code=status.HTTP_400_BAD_REQUEST)
