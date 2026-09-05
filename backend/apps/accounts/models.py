import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from apps.core.models import TimeStampedUUIDModel


class RoleType(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    ADMIN = 'ADMIN', 'Admin'
    INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
    STUDENT = 'STUDENT', 'Student'


class Role(TimeStampedUUIDModel):
    """
    Defines system roles for Role-Based Access Control (RBAC).
    """
    name = models.CharField(
        max_length=50,
        choices=RoleType.choices,
        unique=True,
        db_index=True
    )
    description = models.TextField(blank=True, default='')

    def __str__(self):
        return self.get_name_display()


class CustomUserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifier for authentication.
    """
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('An email address is required.')
        if not username:
            raise ValueError('A unique username is required.')
            
        email = self.normalize_email(email).lower()
        username = username.strip().lower()
        
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)
        
        user = self.model(email=email, username=username, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
            
        user.save(using=self._db)
        
        # Assign STUDENT role by default if not superuser/staff
        if not user.is_superuser:
            student_role, _ = Role.objects.get_or_create(
                name=RoleType.STUDENT,
                defaults={'description': 'Standard student trainee role with scenario & flag submission access.'}
            )
            UserRole.objects.get_or_create(user=user, role=student_role)
            
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        user = self.create_user(email, username, password, **extra_fields)
        
        # Ensure Super Admin role is attached
        super_admin_role, _ = Role.objects.get_or_create(
            name=RoleType.SUPER_ADMIN,
            defaults={'description': 'Global system administrator with unrestricted privileges.'}
        )
        UserRole.objects.get_or_create(user=user, role=super_admin_role)
        
        return user


class User(AbstractBaseUser, PermissionsMixin, TimeStampedUUIDModel):
    """
    Custom user model adhering to the OffensiveGrid specification.
    Email is used as the primary login credential with a unique username handle.
    """
    email = models.EmailField(unique=True, max_length=255, db_index=True)
    username = models.CharField(unique=True, max_length=150, db_index=True)
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')
    avatar_url = models.URLField(max_length=1000, blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=True)
    
    # 2FA Fields
    totp_secret = models.CharField(max_length=32, blank=True, null=True, help_text="Secret key for Google Authenticator TOTP")
    is_totp_enabled = models.BooleanField(default=False, help_text="Is 2FA enabled for this user?")
    has_paid_access = models.BooleanField(default=False, help_text='Grants access to play paid/pro scenarios')
    
    roles = models.ManyToManyField(
        Role,
        through='UserRole',
        through_fields=('user', 'role'),
        related_name='users',
        blank=True
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.email})"

    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.username

    @property
    def role_names(self):
        """Returns list of assigned role name strings."""
        return list(self.roles.values_list('name', flat=True))

    @property
    def primary_role(self):
        """Returns the highest priority role name assigned to the user."""
        roles = self.role_names
        if RoleType.SUPER_ADMIN in roles or self.is_superuser:
            return RoleType.SUPER_ADMIN
        if RoleType.ADMIN in roles:
            return RoleType.ADMIN
        if RoleType.INSTRUCTOR in roles:
            return RoleType.INSTRUCTOR
        return RoleType.STUDENT

    @property
    def is_super_admin(self):
        return self.is_superuser or RoleType.SUPER_ADMIN in self.role_names

    @property
    def is_admin_user(self):
        return self.is_super_admin or RoleType.ADMIN in self.role_names

    @property
    def is_instructor(self):
        return self.is_admin_user or RoleType.INSTRUCTOR in self.role_names

    @property
    def is_student(self):
        return RoleType.STUDENT in self.role_names or not self.role_names


class UserRole(TimeStampedUUIDModel):
    """
    Explicit junction model linking Users to Roles with assignment audit metadata.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_roles',
        db_index=True
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='user_roles',
        db_index=True
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_roles'
    )

    class Meta:
        db_table = 'user_roles'
        unique_together = ('user', 'role')
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'

    def __str__(self):
        return f"{self.user.username} -> {self.role.name}"


class EmailVerificationOTP(TimeStampedUUIDModel):
    """
    Stores 6-digit one-time passcodes for pre-registration trainee email verification.
    """
    email = models.EmailField(db_index=True)
    otp_code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'email_verification_otps'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} -> {self.otp_code} (Verified: {self.is_verified})"


class AdminInviteKey(TimeStampedUUIDModel):
    """
    Secure one-time use invite keys generated by Super Admins to create new Admin users.
    """
    key = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_invites')
    role = models.CharField(max_length=50, choices=RoleType.choices, default=RoleType.ADMIN)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'admin_invite_keys'
        ordering = ['-created_at']

    def __str__(self):
        return f"Invite {self.key} (Used: {self.is_used})"


class InstructorUpgradeRequest(TimeStampedUUIDModel):
    """
    Stores requests from students applying to become instructors.
    """
    class RequestStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        REVOKED = 'REVOKED', 'Revoked'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='instructor_requests')
    experience_summary = models.TextField(help_text="Applicant's cybersecurity and teaching experience.")
    portfolio_url = models.URLField(blank=True, help_text="Link to GitHub, LinkedIn, or personal website.")
    status = models.CharField(max_length=20, choices=RequestStatus.choices, default=RequestStatus.PENDING)
    is_seen = models.BooleanField(default=False, help_text="Indicates if the superadmin has viewed this request.")
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='reviewed_instructor_requests')
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'instructor_upgrade_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.status}"


class PasswordResetOTP(TimeStampedUUIDModel):
    """
    Stores 6-digit OTP codes and temporary reset tokens for secure password recovery.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_resets')
    otp_code = models.CharField(max_length=6)
    reset_token = models.CharField(max_length=128, blank=True, null=True, unique=True, db_index=True)
    is_verified = models.BooleanField(default=False)
    is_used = models.BooleanField(default=False)
    failed_attempts = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField()
    token_expires_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'password_reset_otps'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} -> Reset OTP (Verified: {self.is_verified}, Used: {self.is_used})"

