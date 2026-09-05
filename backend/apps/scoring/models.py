from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedUUIDModel


class SolvedScenario(TimeStampedUUIDModel):
    """
    Guarantees unique solve records to prevent score replay / duplicate points.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solved_scenarios',
        db_index=True
    )
    scenario = models.ForeignKey(
        'scenarios.Scenario',
        on_delete=models.CASCADE,
        related_name='solves',
        db_index=True
    )
    competition = models.ForeignKey(
        'competitions.Competition',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='solves',
        db_index=True
    )
    awarded_points = models.PositiveIntegerField(default=0)
    solved_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'solved_scenarios'
        unique_together = ('user', 'scenario', 'competition')
        verbose_name = 'Solved Scenario'
        verbose_name_plural = 'Solved Scenarios'
        ordering = ['-solved_at']

    def __str__(self):
        comp_str = f" in {self.competition.title}" if self.competition else " (Global)"
        return f"{self.user.username} solved {self.scenario.title} for {self.awarded_points} pts{comp_str}"


class UserScore(TimeStampedUUIDModel):
    """
    Accumulated score cache per user for global platform or specific competitions.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scores',
        db_index=True
    )
    competition = models.ForeignKey(
        'competitions.Competition',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='user_scores',
        db_index=True
    )
    total_score = models.PositiveIntegerField(default=0, db_index=True)
    solved_count = models.PositiveIntegerField(default=0)
    last_solve_time = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = 'user_scores'
        unique_together = ('user', 'competition')
        verbose_name = 'User Score'
        verbose_name_plural = 'User Scores'
        ordering = ['-total_score', 'last_solve_time']

    def __str__(self):
        comp_str = f" ({self.competition.title})" if self.competition else " (Global)"
        return f"{self.user.username}: {self.total_score} pts ({self.solved_count} solved){comp_str}"
