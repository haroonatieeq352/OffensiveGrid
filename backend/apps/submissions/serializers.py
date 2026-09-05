from rest_framework import serializers
from .models import Submission


class SubmitFlagSerializer(serializers.Serializer):
    scenario_id = serializers.UUIDField(required=True)
    flag = serializers.CharField(required=True, max_length=255, trim_whitespace=True)
    competition_id = serializers.UUIDField(required=False, allow_null=True)


class SubmissionHistorySerializer(serializers.ModelSerializer):
    scenario_title = serializers.CharField(source='scenario.title', read_only=True)
    scenario_difficulty = serializers.CharField(source='scenario.difficulty', read_only=True)
    submitted_flag = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            'id',
            'scenario_id',
            'scenario_title',
            'scenario_difficulty',
            'submitted_flag',
            'is_correct',
            'awarded_points',
            'attempt_number',
            'created_at',
        ]
        read_only_fields = fields

    def get_submitted_flag(self, obj):
        # Anti-leak & security protection: Mask flags to prevent student cheat-sharing
        return "••••••••••••••••"
