from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    CustomTokenRefreshView,
    MeView,
    UserListView,
    UserStatusToggleView,
    SendEmailOTPView,
    VerifyEmailOTPView,
    StudentUpgradeRequestView,
    AdminUpgradeRequestListView,
    AdminUpgradeProcessView,
    AdminPendingInstructorStatsView,
    AdminUpgradeMarkSeenView,
    RevokeInstructorRoleView,
    PasswordResetRequestView,
    PasswordResetVerifyOTPView,
    PasswordResetConfirmView,
    GoogleLoginView,
)
from .admin_views import (
    GenerateInviteKeyView,
    AdminRegisterView,
    GenerateTOTPSecretView,
    VerifyTOTPSetupView,
)

app_name = 'accounts'

urlpatterns = [
    # Public Auth & Verification
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('send-email-otp/', SendEmailOTPView.as_view(), name='send_email_otp'),
    path('verify-email-otp/', VerifyEmailOTPView.as_view(), name='verify_email_otp'),
    
    # Password Recovery Flow
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/verify-otp/', PasswordResetVerifyOTPView.as_view(), name='password_reset_verify_otp'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Authenticated User
    path('me/', MeView.as_view(), name='me'),
    
    # Admin Auth & Setup
    path('admin/invite/generate/', GenerateInviteKeyView.as_view(), name='generate_invite_key'),
    path('admin/register/', AdminRegisterView.as_view(), name='admin_register'),
    path('admin/totp/generate/', GenerateTOTPSecretView.as_view(), name='generate_totp_secret'),
    path('admin/totp/verify/', VerifyTOTPSetupView.as_view(), name='verify_totp_setup'),
    
    # Admin User Directory
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<uuid:user_id>/toggle-status/', UserStatusToggleView.as_view(), name='user_toggle_status'),
    path('users/<uuid:user_id>/revoke-instructor/', RevokeInstructorRoleView.as_view(), name='revoke_instructor'),

    # Instructor Requests
    path('instructor-requests/submit/', StudentUpgradeRequestView.as_view(), name='submit_instructor_request'),
    path('admin/instructor-requests/', AdminUpgradeRequestListView.as_view(), name='admin_instructor_requests'),
    path('admin/instructor-requests/stats/', AdminPendingInstructorStatsView.as_view(), name='admin_instructor_requests_stats'),
    path('admin/instructor-requests/<uuid:pk>/mark-seen/', AdminUpgradeMarkSeenView.as_view(), name='mark_seen_instructor_request'),
    path('admin/instructor-requests/<uuid:pk>/process/', AdminUpgradeProcessView.as_view(), name='process_instructor_request'),
]
