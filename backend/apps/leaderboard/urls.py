from django.urls import path
from .views import (
    GlobalLeaderboardView,
    CompetitionLeaderboardView,
    AdminStudentTelemetryView,
)

app_name = 'leaderboard'

urlpatterns = [
    path('', GlobalLeaderboardView.as_view(), name='global_leaderboard'),
    path('admin/student-telemetry/', AdminStudentTelemetryView.as_view(), name='admin_student_telemetry'),
    path('student-telemetry/', AdminStudentTelemetryView.as_view(), name='student_telemetry'),
    path('<slug:competition_slug>/', CompetitionLeaderboardView.as_view(), name='competition_leaderboard'),
]
