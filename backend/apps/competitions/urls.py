from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompetitionListView,
    CompetitionDetailView,
    AdminCompetitionViewSet,
    TournamentConfigView,
    TournamentResetView,
    StudentSessionView,
)

app_name = 'competitions'

router = DefaultRouter()
router.register(r'admin/competitions', AdminCompetitionViewSet, basename='admin-competitions')

urlpatterns = [
    path('tournament-config/', TournamentConfigView.as_view(), name='tournament-config'),
    path('tournament-config/reset-sessions/', TournamentResetView.as_view(), name='tournament-reset'),
    path('my-session/', StudentSessionView.as_view(), name='my-session'),
    path('start-session/', StudentSessionView.as_view(), name='start_session'),
    path('', CompetitionListView.as_view(), name='competition_list'),
    path('<slug:slug>/', CompetitionDetailView.as_view(), name='competition_detail'),
    path('', include(router.urls)),
]
