from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.accounts.permissions import IsAdmin
from .serializers import (
    CompetitionListSerializer,
    CompetitionDetailSerializer,
    TournamentConfigSerializer,
    StudentTournamentSessionSerializer
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import F
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Competition, CompetitionScenario, TournamentConfig, StudentTournamentSession


class CompetitionListView(generics.ListAPIView):
    """
    GET /api/v1/competitions/
    Lists all public competitions.
    """
    permission_classes = [AllowAny]
    serializer_class = CompetitionListSerializer
    queryset = Competition.objects.filter(is_public=True).prefetch_related('scenarios')
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['start_time', 'end_time', 'created_at']
    ordering = ['-start_time']


class CompetitionDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/competitions/<slug:slug>/
    Retrieves full competition details with scenarios and server timer metadata.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CompetitionDetailSerializer
    lookup_field = 'slug'
    queryset = Competition.objects.prefetch_related('competition_scenarios__scenario__category')


class AdminCompetitionViewSet(viewsets.ModelViewSet):
    """
    CRUD for administrators to manage competitions and schedule tournaments.
    """
    permission_classes = [IsAdmin]
    serializer_class = CompetitionDetailSerializer
    queryset = Competition.objects.all().prefetch_related('competition_scenarios__scenario')
    lookup_field = 'id'

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TournamentConfigView(APIView):
    """
    GET /api/v1/competitions/tournament-config/
    POST /api/v1/competitions/tournament-config/ (Admin Only)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        config = TournamentConfig.get_config()
        return Response(TournamentConfigSerializer(config).data)

    def post(self, request):
        config = TournamentConfig.get_config()
        
        # Check current state before saving
        was_active = config.is_active
        
        serializer = TournamentConfigSerializer(config, data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                config = serializer.save()
                
                # If we are pausing the tournament
                if was_active and not config.is_active:
                    StudentTournamentSession.objects.filter(
                        last_paused_at__isnull=True
                    ).update(last_paused_at=timezone.now())
                    
                # If we are resuming the tournament
                elif not was_active and config.is_active:
                    # For all sessions that were paused, calculate the elapsed pause duration
                    # We have to fetch them to calculate accurately, or use DB functions.
                    now = timezone.now()
                    sessions = StudentTournamentSession.objects.filter(last_paused_at__isnull=False)
                    for session in sessions:
                        paused_duration = int((now - session.last_paused_at).total_seconds())
                        session.total_paused_seconds += paused_duration
                        session.last_paused_at = None
                        session.save()
                        
                # Broadcast state change to all clients
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    'leaderboard_global',
                    {
                        'type': 'leaderboard_update',
                        'payload': {
                            'event': 'TOURNAMENT_STATE_CHANGED'
                        }
                    }
                )
                        
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TournamentResetView(APIView):
    """
    POST /api/v1/competitions/tournament-config/reset-sessions/ (Admin Only)
    Deletes all active student sessions, effectively resetting the tournament.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        count, _ = StudentTournamentSession.objects.all().delete()
        config = TournamentConfig.get_config()
        config.is_active = True
        config.save()
        
        # Broadcast state change to all clients
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'leaderboard_global',
            {
                'type': 'leaderboard_update',
                'payload': {
                    'event': 'TOURNAMENT_STATE_CHANGED'
                }
            }
        )
        
        return Response({"detail": f"Reset successful. {count} sessions deleted. Tournament is active."})


class StudentSessionView(APIView):
    """
    GET /api/v1/competitions/my-session/
    POST /api/v1/competitions/start-session/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            session = StudentTournamentSession.objects.get(user=request.user)
            return Response(StudentTournamentSessionSerializer(session).data)
        except StudentTournamentSession.DoesNotExist:
            return Response({"detail": "Session not started"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        if StudentTournamentSession.objects.filter(user=request.user).exists():
            return Response({"detail": "Session already started"}, status=status.HTTP_400_BAD_REQUEST)
        
        config = TournamentConfig.get_config()
        if not config.is_active:
            return Response({"detail": "Tournament is currently stopped. You cannot start a session."}, status=status.HTTP_403_FORBIDDEN)
            
        session = StudentTournamentSession.objects.create(
            user=request.user,
            duration_minutes=config.duration_minutes
        )
        return Response(StudentTournamentSessionSerializer(session).data, status=status.HTTP_201_CREATED)
