from rest_framework import generics, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Exists, OuterRef, Subquery, Value, IntegerField

from apps.core.responses import success_response
from apps.accounts.permissions import IsInstructor
from .models import Category, Difficulty, Scenario, Flag, ScenarioFile, ScenarioStatus
from .serializers import (
    CategorySerializer,
    DifficultySerializer,
    ScenarioListSerializer,
    ScenarioDetailSerializer,
    AdminScenarioSerializer,
)


class CategoryListView(generics.ListAPIView):
    """
    GET /api/v1/scenarios/categories/
    Lists all challenge categories with scenario counts.
    """
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    pagination_class = None
    queryset = Category.objects.annotate(
        scenario_count=Count('scenarios')
    ).order_by('name')


class DifficultyListView(generics.ListAPIView):
    """
    GET /api/v1/scenarios/difficulties/
    Lists all difficulty levels.
    """
    permission_classes = [AllowAny]
    serializer_class = DifficultySerializer
    pagination_class = None
    queryset = Difficulty.objects.all()


class AdminCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstructor]
    serializer_class = CategorySerializer
    queryset = Category.objects.annotate(scenario_count=Count('scenarios')).order_by('name')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        scenario_count = instance.scenarios.count()
        if scenario_count > 0:
            scenario_titles = list(instance.scenarios.values_list('title', flat=True)[:3])
            titles_str = ", ".join(f"'{t}'" for t in scenario_titles)
            if scenario_count > 3:
                titles_str += f" and {scenario_count - 3} more"
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "CATEGORY_IN_USE",
                        "message": f"Cannot delete category '{instance.name}' because it is linked to {scenario_count} scenario(s): {titles_str}. Please reassign or delete these scenarios first.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class AdminDifficultyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstructor]
    serializer_class = DifficultySerializer
    queryset = Difficulty.objects.annotate(scenario_count=Count('scenarios')).order_by('level_value')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        scenario_count = instance.scenarios.count()
        if scenario_count > 0:
            scenario_titles = list(instance.scenarios.values_list('title', flat=True)[:3])
            titles_str = ", ".join(f"'{t}'" for t in scenario_titles)
            if scenario_count > 3:
                titles_str += f" and {scenario_count - 3} more"
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "DIFFICULTY_IN_USE",
                        "message": f"Cannot delete difficulty '{instance.name}' because it is linked to {scenario_count} scenario(s): {titles_str}. Please reassign or delete these scenarios first.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

class ScenarioListView(generics.ListAPIView):
    """
    GET /api/v1/scenarios/
    Lists published scenarios with filtering by category, difficulty, search.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ScenarioListSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['points', 'created_at', 'difficulty']
    ordering = ['points']

    def get_queryset(self):
        user = self.request.user
        queryset = Scenario.objects.filter(status=ScenarioStatus.PUBLISHED).select_related('category')
        
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
            
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty.upper())
            
        if user.is_authenticated:
            from apps.scoring.models import SolvedScenario
            from apps.submissions.models import Submission
            
            is_solved_subquery = SolvedScenario.objects.filter(
                user=user,
                scenario=OuterRef('pk')
            )
            attempts_subquery = Submission.objects.filter(
                user=user,
                scenario=OuterRef('pk')
            ).values('scenario').annotate(cnt=Count('id')).values('cnt')
            
            queryset = queryset.annotate(
                is_solved=Exists(is_solved_subquery),
                attempts_used=Subquery(attempts_subquery, output_field=IntegerField())
            )
            
        return queryset


class ScenarioDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/scenarios/<slug:slug>/
    Retrieves full scenario details and mission instructions.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ScenarioDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        queryset = Scenario.objects.filter(status=ScenarioStatus.PUBLISHED).select_related('category').prefetch_related('files')

        if user.is_authenticated:
            from apps.scoring.models import SolvedScenario
            from apps.submissions.models import Submission
            
            is_solved_subquery = SolvedScenario.objects.filter(
                user=user,
                scenario=OuterRef('pk')
            )
            attempts_subquery = Submission.objects.filter(
                user=user,
                scenario=OuterRef('pk')
            ).values('scenario').annotate(cnt=Count('id')).values('cnt')
            
            queryset = queryset.annotate(
                is_solved=Exists(is_solved_subquery),
                attempts_used=Subquery(attempts_subquery, output_field=IntegerField())
            )
        return queryset


class AdminScenarioViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Admins to create, edit, publish, and delete scenarios.
    """
    permission_classes = [IsInstructor]
    serializer_class = AdminScenarioSerializer
    pagination_class = None
    queryset = Scenario.objects.all().select_related('category').prefetch_related('flags', 'files').order_by('-created_at')
    lookup_field = 'id'

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
