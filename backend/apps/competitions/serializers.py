from rest_framework import serializers
from .models import Competition, CompetitionScenario, CompetitionStatus, TournamentConfig, StudentTournamentSession
from apps.scenarios.serializers import ScenarioListSerializer


class CompetitionScenarioSerializer(serializers.ModelSerializer):
    scenario = ScenarioListSerializer(read_only=True)

    class Meta:
        model = CompetitionScenario
        fields = ['id', 'scenario', 'custom_points', 'order_index']


class CompetitionListSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(source='is_currently_active', read_only=True)
    remaining_seconds = serializers.IntegerField(read_only=True)
    scenario_count = serializers.IntegerField(source='scenarios.count', read_only=True)

    class Meta:
        model = Competition
        fields = [
            'id',
            'title',
            'slug',
            'description',
            'start_time',
            'end_time',
            'status',
            'is_public',
            'is_active',
            'remaining_seconds',
            'scenario_count',
            'created_at',
        ]


class CompetitionDetailSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(source='is_currently_active', read_only=True)
    remaining_seconds = serializers.IntegerField(read_only=True)
    competition_scenarios = CompetitionScenarioSerializer(many=True, read_only=True)

    class Meta:
        model = Competition
        fields = [
            'id',
            'title',
            'slug',
            'description',
            'start_time',
            'end_time',
            'status',
            'is_public',
            'is_active',
            'remaining_seconds',
            'competition_scenarios',
            'created_at',
        ]


class TournamentConfigSerializer(serializers.ModelSerializer):
    duration_minutes = serializers.IntegerField(min_value=1, max_value=43200) # Max 30 days

    class Meta:
        model = TournamentConfig
        fields = ['duration_minutes', 'is_active']


class StudentTournamentSessionSerializer(serializers.ModelSerializer):
    remaining_seconds = serializers.IntegerField(read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = StudentTournamentSession
        fields = ['start_time', 'duration_minutes', 'remaining_seconds', 'is_active']

    def get_is_active(self, obj):
        return TournamentConfig.get_config().is_active
