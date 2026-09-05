import re
from django.db import transaction
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.core.exceptions import AttemptLimitExceeded, ScenarioAlreadySolved, CompetitionNotActive
from apps.scenarios.models import Scenario, Flag, ScenarioStatus
from apps.competitions.models import Competition, CompetitionStatus
from apps.scoring.models import SolvedScenario, UserScore
from .models import Submission


class FlagSubmissionService:
    """
    Core business logic engine for flag verification, attempt limiting,
    atomic score accrual, and real-time leaderboard broadcast.
    """

    @classmethod
    @transaction.atomic
    def process_submission(cls, user, scenario_id, submitted_flag, competition_id=None, ip_address=None):
        submitted_flag = submitted_flag.strip()

        # 1. Fetch Scenario
        try:
            scenario = Scenario.objects.select_for_update().get(
                id=scenario_id,
                status=ScenarioStatus.PUBLISHED
            )
        except Scenario.DoesNotExist:
            raise ScenarioAlreadySolved("Scenario not found or is not currently published.")

        # 2. Check Competition status if linked
        competition = None
        if competition_id:
            try:
                competition = Competition.objects.get(id=competition_id)
                if not competition.is_currently_active:
                    raise CompetitionNotActive("The competition is not currently active.")
            except Competition.DoesNotExist:
                raise CompetitionNotActive("Competition not found.")

        # 3. Check if already solved (Duplicate solve prevention)
        already_solved = SolvedScenario.objects.filter(
            user=user,
            scenario=scenario,
            competition=competition
        ).exists()

        if already_solved:
            raise ScenarioAlreadySolved("You have already captured the flag for this scenario.")

        # 4. Check Paid Scenario Access
        if scenario.is_paid and not (user.is_staff or getattr(user, 'has_paid_access', False)):
            raise AttemptLimitExceeded(
                "This is a Paid / Pro scenario. Please upgrade to OffensiveGrid Pro or submit your payment verification to play."
            )

        # 5. Check Attempt Limit Quota
        prior_attempts = Submission.objects.filter(
            user=user,
            scenario=scenario,
            competition=competition
        ).count()

        if scenario.max_attempts > 0 and prior_attempts >= scenario.max_attempts:
            raise AttemptLimitExceeded(
                f"Maximum attempt quota of {scenario.max_attempts} attempts reached for this scenario."
            )

        attempt_number = prior_attempts + 1

        # 5. Evaluate Flag Validity
        flags = Flag.objects.filter(scenario=scenario)
        is_correct = False

        for flag_obj in flags:
            expected = flag_obj.flag_value.strip()
            if flag_obj.is_regex:
                flags_regex = 0 if flag_obj.is_case_sensitive else re.IGNORECASE
                if re.fullmatch(expected, submitted_flag, flags=flags_regex):
                    is_correct = True
                    break
            else:
                if flag_obj.is_case_sensitive:
                    if submitted_flag == expected:
                        is_correct = True
                        break
                else:
                    if submitted_flag.lower() == expected.lower():
                        is_correct = True
                        break

        # 6. Record Attempt in Submissions Log
        awarded_points = scenario.points if is_correct else 0
        submission = Submission.objects.create(
            user=user,
            scenario=scenario,
            competition=competition,
            submitted_flag=submitted_flag,
            is_correct=is_correct,
            awarded_points=awarded_points,
            attempt_number=attempt_number,
            ip_address=ip_address
        )

        # 7. Process Points & Accrual if Correct
        now = timezone.now()
        remaining_attempts = (scenario.max_attempts - attempt_number) if scenario.max_attempts > 0 else None

        if is_correct:
            # Create Solved Record
            SolvedScenario.objects.create(
                user=user,
                scenario=scenario,
                competition=competition,
                awarded_points=awarded_points
            )

            # Update Global UserScore
            user_score, _ = UserScore.objects.select_for_update().get_or_create(
                user=user,
                competition=None,
                defaults={'total_score': 0, 'solved_count': 0}
            )
            user_score.total_score += awarded_points
            user_score.solved_count += 1
            user_score.last_solve_time = now
            user_score.save()

            # If inside competition, update competition score
            if competition:
                comp_score, _ = UserScore.objects.select_for_update().get_or_create(
                    user=user,
                    competition=competition,
                    defaults={'total_score': 0, 'solved_count': 0}
                )
                comp_score.total_score += awarded_points
                comp_score.solved_count += 1
                comp_score.last_solve_time = now
                comp_score.save()

            # Broadcast WebSocket Leaderboard Notification
            cls._broadcast_solve(user, scenario, awarded_points, competition)

            return {
                "is_correct": True,
                "awarded_points": awarded_points,
                "total_score": user_score.total_score,
                "attempt_number": attempt_number,
                "remaining_attempts": remaining_attempts,
                "message": f"Congratulations! Flag accepted. +{awarded_points} points awarded!"
            }

        return {
            "is_correct": False,
            "awarded_points": 0,
            "attempt_number": attempt_number,
            "remaining_attempts": remaining_attempts,
            "message": "Incorrect flag. Keep analyzing the challenge target!"
        }

    @staticmethod
    def _broadcast_solve(user, scenario, points, competition=None):
        """Dispatches real-time WebSocket event to all connected trainees."""
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                group_name = f"leaderboard_competition_{competition.slug}" if competition else "leaderboard_global"
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        "type": "leaderboard_update",
                        "payload": {
                            "event": "SOLVE_RECORDED",
                            "username": user.username,
                            "scenario_title": scenario.title,
                            "points": points,
                            "timestamp": timezone.now().isoformat()
                        }
                    }
                )
        except Exception:
            pass
