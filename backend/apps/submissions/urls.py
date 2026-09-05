from django.urls import path
from .views import SubmitFlagView, MySubmissionsView, AdminFailedSubmissionsListView, AdminSubmissionResetView

app_name = 'submissions'

urlpatterns = [
    path('submit/', SubmitFlagView.as_view(), name='submit_flag'),
    path('my/', MySubmissionsView.as_view(), name='my_submissions'),
    path('admin/failed/', AdminFailedSubmissionsListView.as_view(), name='admin_failed_submissions'),
    path('admin/reset/', AdminSubmissionResetView.as_view(), name='admin_reset_attempts'),
]
