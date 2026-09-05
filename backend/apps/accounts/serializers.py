"""
Serializers for Authentication, User Management, and Roles in OffensiveGrid.
"""
import re
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Role, UserRole, RoleType, InstructorUpgradeRequest


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']


class UserProfileSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    primary_role = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'avatar_url',
            'is_active',
            'is_verified',
            'has_paid_access',
            'roles',
            'primary_role',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'email', 'has_paid_access', 'roles', 'primary_role', 'created_at', 'updated_at']

    def get_roles(self, obj):
        return obj.role_names


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=True,
        min_length=3,
        max_length=150,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="This username is already taken. Please choose a different username by adding small letters and numbers (e.g. shadow_hunter99)."
            )
        ]
    )
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="An account with this email address already exists. Please sign in or use another email."
            )
        ]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8,
        max_length=128
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8,
        max_length=128
    )
    tokens = serializers.SerializerMethodField(read_only=True)
    user = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            'email',
            'username',
            'first_name',
            'last_name',
            'password',
            'confirm_password',
            'tokens',
            'user',
        ]

    def validate_email(self, value):
        return value.strip().lower()

    def validate_first_name(self, value):
        cleaned = value.strip()
        if cleaned and not re.match(r"^[A-Za-z\s'-]{1,50}$", cleaned):
            raise serializers.ValidationError("First name can only contain alphabetic letters, hyphens, and spaces (max 50 characters).")
        return cleaned

    def validate_last_name(self, value):
        cleaned = value.strip()
        if cleaned and not re.match(r"^[A-Za-z\s'-]{1,50}$", cleaned):
            raise serializers.ValidationError("Last name can only contain alphabetic letters, hyphens, and spaces (max 50 characters).")
        return cleaned

    def validate_username(self, value):
        cleaned = value.strip().lower()
        if len(cleaned) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        if len(cleaned) > 30:
            raise serializers.ValidationError("Username cannot exceed 30 characters.")
        if not cleaned.replace('_', '').replace('-', '').isalnum():
            raise serializers.ValidationError("Username can only contain small letters, numbers, and underscores.")
        return cleaned

    def validate(self, attrs):
        # 1. Email OTP Verification Lock (Server-side Enforcement)
        email = attrs.get('email', '').strip().lower()
        from .models import EmailVerificationOTP
        is_verified = EmailVerificationOTP.objects.filter(
            email=email,
            is_verified=True
        ).exists()

        if not is_verified:
            raise serializers.ValidationError({
                'email': "Email address has not been verified. Please request and verify the 6-digit OTP code before completing registration."
            })

        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if password != confirm_password:
            raise serializers.ValidationError({'confirm_password': "Passwords do not match."})

        # Password complexity rules (small letters, capital letters, numbers, special characters)
        if len(password) < 8:
            raise serializers.ValidationError({'password': "Password must be at least 8 characters long."})
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError({'password': "Password must contain at least one capital letter (A-Z)."})
        if not re.search(r'[a-z]', password):
            raise serializers.ValidationError({'password': "Password must contain at least one small letter (a-z)."})
        if not re.search(r'\d', password):
            raise serializers.ValidationError({'password': "Password must contain at least one number (0-9)."})
        if not re.search(r'[@$!%*?&#^()_+\-=\[\]{};:\'",.<>\/\\|`~]', password):
            raise serializers.ValidationError({'password': "Password must contain at least one special symbol (e.g. @, #, $, %, !)."})

        validate_password(password)
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        # Consume the verified OTP record so it cannot be reused
        from .models import EmailVerificationOTP
        EmailVerificationOTP.objects.filter(email=user.email).delete()

        self._created_user = user
        return user

    def get_user(self, obj):
        user = getattr(self, '_created_user', obj)
        return UserProfileSerializer(user).data

    def get_tokens(self, obj):
        user = getattr(self, '_created_user', obj)
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=True, max_length=254)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'}, max_length=128)
    otp = serializers.CharField(required=False, allow_blank=True, write_only=True, max_length=6)

    def validate(self, attrs):
        email_or_username = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        # Support login with either email or username
        user = None
        if '@' in email_or_username:
            try:
                user_obj = User.objects.get(email__iexact=email_or_username)
                if user_obj.check_password(password):
                    user = user_obj
            except User.DoesNotExist:
                user = None
        else:
            try:
                user_obj = User.objects.get(username__iexact=email_or_username)
                if user_obj.check_password(password):
                    user = user_obj
            except User.DoesNotExist:
                user = None

        if not user:
            raise serializers.ValidationError("Invalid email/username or password.")

        if not user.is_active:
            raise serializers.ValidationError("This user account has been disabled.")

        # 2FA / TOTP Check for Admins
        is_admin = user.roles.filter(name__in=[RoleType.SUPER_ADMIN, RoleType.ADMIN]).exists()
        
        requires_totp_setup = False
        if is_admin:
            if user.is_totp_enabled:
                otp = attrs.get('otp', '').strip()
                if not otp:
                    raise serializers.ValidationError({
                        "otp": "2FA is required. Please enter your 6-digit code.",
                        "code": "otp_required"
                    })
                
                import pyotp
                totp = pyotp.TOTP(user.totp_secret)
                if not totp.verify(otp):
                    raise serializers.ValidationError({
                        "otp": "Invalid 2FA code. Please try again.",
                        "code": "invalid_otp"
                    })
            else:
                requires_totp_setup = True

        refresh = RefreshToken.for_user(user)
        return {
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'requires_totp_setup': requires_totp_setup
        }


class InstructorUpgradeRequestSerializer(serializers.ModelSerializer):
    experience_summary = serializers.CharField(max_length=100)

    class Meta:
        model = InstructorUpgradeRequest
        fields = ['id', 'user', 'experience_summary', 'portfolio_url', 'status', 'is_seen', 'created_at']
        read_only_fields = ['id', 'user', 'status', 'is_seen', 'created_at']


class AdminInstructorUpgradeRequestSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    reviewed_by = UserProfileSerializer(read_only=True)
    user_performance = serializers.SerializerMethodField()

    class Meta:
        model = InstructorUpgradeRequest
        fields = '__all__'
        
    def get_user_performance(self, obj):
        from apps.scoring.models import UserScore
        from apps.scenarios.models import Scenario
        from apps.submissions.models import Submission
        from django.db.models import Sum
        
        # Get user's global score
        try:
            score = UserScore.objects.get(user=obj.user, competition__isnull=True)
            total_points = score.total_score
            solved_count = score.solved_count
        except UserScore.DoesNotExist:
            total_points = 0
            solved_count = 0
            
        # Get total available points
        total_available = Scenario.objects.filter(status='PUBLISHED').aggregate(total=Sum('points'))['total'] or 0
        
        percentage = 0
        if total_available > 0:
            percentage = round((total_points / total_available) * 100, 1)

        # Calculate Precision
        correct_subs = Submission.objects.filter(user=obj.user, is_correct=True).count()
        failed_subs = Submission.objects.filter(user=obj.user, is_correct=False).count()
        total_attempts = correct_subs + failed_subs
        precision = round((correct_subs / total_attempts) * 100) if total_attempts > 0 else 0
            
        return {
            "score": total_points,
            "solved": solved_count,
            "failed": failed_subs,
            "percentage": percentage,
            "precision": precision,
            "total_available": total_available
        }
