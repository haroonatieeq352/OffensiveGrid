from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from apps.core.responses import success_response, error_response
from .serializers import SubmitFlagSerializer, SubmissionHistorySerializer
from .services import FlagSubmissionService
from .models import Submission


class SubmitFlagView(APIView):
    """
    POST /api/v1/submissions/submit/
    Validates a submitted flag against scenario flags and updates scores atomically.
    Throttled to prevent brute-force guessing attacks.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'flag_submit'

    def post(self, request, *args, **kwargs):
        serializer = SubmitFlagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        scenario_id = serializer.validated_data['scenario_id']
        flag = serializer.validated_data['flag']
        competition_id = serializer.validated_data.get('competition_id')
        ip_address = request.META.get('REMOTE_ADDR')

        result = FlagSubmissionService.process_submission(
            user=request.user,
            scenario_id=scenario_id,
            submitted_flag=flag,
            competition_id=competition_id,
            ip_address=ip_address
        )

        return success_response(
            data=result,
            message=result['message']
        )


class MySubmissionsView(generics.ListAPIView):
    """
    GET /api/v1/submissions/my/
    Lists personal flag attempt history for the logged-in student.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SubmissionHistorySerializer

    def get_queryset(self):
        return Submission.objects.filter(user=self.request.user).select_related('scenario')


class AdminFailedSubmissionsListView(APIView):
    """
    GET /api/v1/submissions/admin/failed/
    Lists all failed submissions aggregated by user and scenario for admins.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from apps.accounts.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return error_response(message="Permission denied.", status_code=403)
            
        from django.db.models import Count, Max
        failed_attempts = Submission.objects.filter(is_correct=False).values(
            'user_id', 'user__username', 'user__first_name', 'user__last_name', 'scenario_id', 'scenario__title', 'scenario__max_attempts'
        ).annotate(
            attempts=Count('id'),
            last_attempt=Max('created_at')
        ).order_by('-last_attempt')

        # Filter only those that have a strict limit and have reached or exceeded it, 
        # or just return all failed attempts so admin can see.
        # Returning all failed grouped data.
        return success_response(data=list(failed_attempts))


class AdminSubmissionResetView(APIView):
    """
    POST /api/v1/submissions/admin/reset/
    Resets (deletes) failed attempts for a specific user and scenario.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from apps.accounts.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return error_response(message="Permission denied.", status_code=403)
            
        user_id = request.data.get('user_id')
        scenario_id = request.data.get('scenario_id')

        if not user_id or not scenario_id:
            return error_response(message="user_id and scenario_id are required.", status_code=400)

        # Find one failed submission and delete it to give 1 chance
        submission_to_delete = Submission.objects.filter(
            user_id=user_id, 
            scenario_id=scenario_id, 
            is_correct=False
        ).order_by('-created_at').first()

        if submission_to_delete:
            submission_to_delete.delete()
            return success_response(
                message="Granted +1 attempt chance successfully. Trainee can now submit another flag."
            )
        else:
            return error_response(
                message="No failed attempts found to reset for this user and scenario.",
                status_code=400
            )
