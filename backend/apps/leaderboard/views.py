from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q, Sum
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from apps.core.responses import success_response
from apps.accounts.models import User, RoleType
from apps.accounts.permissions import IsAdmin
from apps.scoring.models import UserScore, SolvedScenario
from apps.submissions.models import Submission
from apps.competitions.models import Competition


class GlobalLeaderboardView(APIView):
    """
    GET /api/v1/leaderboard/
    Retrieves the global platform rankings.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        scores = (
            UserScore.objects.filter(competition__isnull=True, total_score__gt=0)
            .select_related('user')
            .order_by('-total_score', 'last_solve_time', '-solved_count')[:100]
        )

        leaderboard_data = []
        for index, item in enumerate(scores, start=1):
            leaderboard_data.append({
                "rank": index,
                "user_id": str(item.user.id),
                "username": item.user.username,
                "full_name": item.user.full_name,
                "avatar_url": item.user.avatar_url,
                "total_score": item.total_score,
                "solved_count": item.solved_count,
                "last_solve_time": item.last_solve_time.isoformat() if item.last_solve_time else None,
            })

        return success_response(
            data=leaderboard_data,
            message="Global leaderboard retrieved successfully."
        )


class CompetitionLeaderboardView(APIView):
    """
    GET /api/v1/leaderboard/<slug:competition_slug>/
    Retrieves the live or frozen leaderboard for a specific competition.
    """
    permission_classes = [AllowAny]

    def get(self, request, competition_slug, *args, **kwargs):
        competition = get_object_or_404(Competition, slug=competition_slug)
        scores = (
            UserScore.objects.filter(competition=competition, total_score__gt=0)
            .select_related('user')
            .order_by('-total_score', 'last_solve_time', '-solved_count')[:100]
        )

        leaderboard_data = []
        for index, item in enumerate(scores, start=1):
            leaderboard_data.append({
                "rank": index,
                "user_id": str(item.user.id),
                "username": item.user.username,
                "full_name": item.user.full_name,
                "avatar_url": item.user.avatar_url,
                "total_score": item.total_score,
                "solved_count": item.solved_count,
                "last_solve_time": item.last_solve_time.isoformat() if item.last_solve_time else None,
            })

        return success_response(
            data={
                "competition": {
                    "id": str(competition.id),
                    "title": competition.title,
                    "slug": competition.slug,
                    "status": competition.status,
                    "remaining_seconds": competition.remaining_seconds,
                },
                "rankings": leaderboard_data,
            },
            message=f"Leaderboard for {competition.title} retrieved successfully."
        )


class AdminStudentTelemetryView(APIView):
    """
    GET /api/v1/leaderboard/admin/student-telemetry/
    Comprehensive student live intelligence: Solves vs Fails, Velocity Race curves, and Top-3 Podium determination.
    """
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        competition_slug = request.query_params.get('competition')
        competition = None
        if competition_slug:
            competition = Competition.objects.filter(slug=competition_slug).first()

        # Fetch all trainees
        students_qs = User.objects.filter(
            Q(roles__name=RoleType.STUDENT) | Q(is_staff=False, is_superuser=False)
        ).distinct()

        # Preload scores
        scores_filter = Q(competition=competition) if competition else Q(competition__isnull=True)
        scores_map = {
            us.user_id: us
            for us in UserScore.objects.filter(scores_filter).select_related('user')
        }

        # Preload submissions aggregation per student
        subs_filter = Q(competition=competition) if competition else Q()
        submissions = Submission.objects.filter(subs_filter)

        # Use user_scores for accurate solved count
        # solves_per_user is no longer calculated from submissions to avoid counting duplicate correct attempts


        fails_per_user = dict(
            submissions.filter(is_correct=False)
            .values('user_id')
            .annotate(cnt=Count('id'))
            .values_list('user_id', 'cnt')
        )

        student_telemetry_list = []
        for student in students_qs:
            user_score = scores_map.get(student.id)
            total_score = user_score.total_score if user_score else 0
            last_solve_time = user_score.last_solve_time if user_score else None

            solves = user_score.solved_count if user_score else 0
            fails = fails_per_user.get(student.id, 0)
            total_attempts = solves + fails
            accuracy_rate = round((solves / total_attempts) * 100, 1) if total_attempts > 0 else 0.0

            student_telemetry_list.append({
                "user_id": str(student.id),
                "username": student.username,
                "email": student.email,
                "full_name": student.full_name,
                "avatar_url": student.avatar_url,
                "total_score": total_score,
                "solves": solves,
                "fails": fails,
                "total_attempts": total_attempts,
                "accuracy_rate": accuracy_rate,
                "last_solve_time": last_solve_time.isoformat() if last_solve_time else None,
                "raw_last_solve": last_solve_time,
                "is_active": student.is_active,
                "has_paid_access": student.has_paid_access,
            })

        # Sort by total_score DESC, raw_last_solve ASC (None last), solves DESC
        def sort_key(item):
            # For tie-breaking: score DESC, last_solve ASC
            score_neg = -item["total_score"]
            solves_neg = -item["solves"]
            time_val = item["raw_last_solve"].timestamp() if item["raw_last_solve"] else 9999999999
            return (score_neg, time_val, solves_neg)

        student_telemetry_list.sort(key=sort_key)

        # Assign ranks and status
        for idx, student in enumerate(student_telemetry_list, start=1):
            student["rank"] = idx
            del student["raw_last_solve"]

            # Velocity Status
            if student["total_score"] > 0 and idx <= 3:
                student["status"] = "LEADING"
                student["status_label"] = "🚀 Leading Pack"
            elif student["total_score"] > 0 and student["accuracy_rate"] >= 50:
                student["status"] = "ASCENDING"
                student["status_label"] = "⚡ Accelerating"
            elif student["fails"] > student["solves"] and student["total_attempts"] > 0:
                student["status"] = "STRUGGLING"
                student["status_label"] = "⚠️ Struggling (High Fails)"
            elif student["total_attempts"] == 0:
                student["status"] = "INACTIVE"
                student["status_label"] = "⏸️ Not Started"
            else:
                student["status"] = "STEADY"
                student["status_label"] = "🎯 Steady Pace"

        # Top 3 Podium Construction
        top_3_podium = []
        medals = [
            {"position": 1, "medal": "🥇", "title": "1st Place Champion", "color": "gold", "tier": "Gold Winner"},
            {"position": 2, "medal": "🥈", "title": "2nd Place Runner-Up", "color": "silver", "tier": "Silver Finalist"},
            {"position": 3, "medal": "🥉", "title": "3rd Place Bronze", "color": "bronze", "tier": "Bronze Finalist"},
        ]

        for i in range(min(3, len(student_telemetry_list))):
            s = student_telemetry_list[i]
            m = medals[i]
            top_3_podium.append({
                **m,
                "user_id": s["user_id"],
                "username": s["username"],
                "email": s["email"],
                "full_name": s["full_name"],
                "avatar_url": s["avatar_url"],
                "total_score": s["total_score"],
                "solves": s["solves"],
                "fails": s["fails"],
                "accuracy_rate": s["accuracy_rate"],
                "is_winner_eligible": s["total_score"] > 0,
            })

        # Global Platform Telemetry Aggregate
        total_solves_count = sum(s["solves"] for s in student_telemetry_list)
        total_fails_count = sum(s["fails"] for s in student_telemetry_list)
        total_all_attempts = total_solves_count + total_fails_count
        global_accuracy = (
            round((total_solves_count / total_all_attempts) * 100, 1) if total_all_attempts > 0 else 0.0
        )
        active_trainees_count = sum(1 for s in student_telemetry_list if s["total_attempts"] > 0)

        # Race Trajectory Simulation / Points Progression Timeline (REAL DATA)
        top_students = student_telemetry_list[:5]
        top_student_ids = [s["user_id"] for s in top_students]
        top_usernames = [s["username"] for s in top_students]
        
        race_timeline = []
        
        # Initial starting point at 0 for everyone
        initial_point = {"time": "Start"}
        for u in top_usernames:
            initial_point[u] = 0
        race_timeline.append(initial_point)

        # Get all actual historical solves for these top 5 students
        solves_filter = Q(user_id__in=top_student_ids)
        if competition:
            solves_filter &= Q(competition=competition)
        else:
            solves_filter &= Q(competition__isnull=True)

        historical_solves = SolvedScenario.objects.filter(solves_filter).select_related('user').order_by('solved_at')

        # Keep a running score for each student
        current_scores = {u: 0 for u in top_usernames}
        
        for solve in historical_solves:
            username = solve.user.username
            if username in current_scores:
                current_scores[username] += solve.awarded_points
                # Format time string nicely (e.g., 14:30)
                time_str = solve.solved_at.astimezone().strftime('%H:%M')
                
                point_data = {"time": time_str}
                for u in top_usernames:
                    point_data[u] = current_scores[u]
                
                race_timeline.append(point_data)

        # Ensure the chart line reaches "Live" (Current Time) by duplicating the last state
        if len(race_timeline) > 1:
            live_point = {"time": "Live"}
            for u in top_usernames:
                live_point[u] = current_scores[u]
            race_timeline.append(live_point)

        return success_response(
            data={
                "students": student_telemetry_list,
                "top_3_podium": top_3_podium,
                "race_timeline": race_timeline,
                "top_student_usernames": top_usernames,
                "global_stats": {
                    "total_students": len(student_telemetry_list),
                    "active_trainees": active_trainees_count,
                    "total_solves": total_solves_count,
                    "total_fails": total_fails_count,
                    "total_attempts": total_all_attempts,
                    "global_accuracy_rate": global_accuracy,
                }
            },
            message="Admin student telemetry and race intelligence retrieved successfully."
        )
