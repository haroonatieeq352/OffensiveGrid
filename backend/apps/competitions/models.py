from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import TimeStampedUUIDModel


class CompetitionStatus(models.TextChoices):
    UPCOMING = 'UPCOMING', 'Upcoming'
    ACTIVE = 'ACTIVE', 'Active'
    PAUSED = 'PAUSED', 'Paused'
    ENDED = 'ENDED', 'Ended'


class Competition(TimeStampedUUIDModel):
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default='')
    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField(db_index=True)
    status = models.CharField(
        max_length=20,
        choices=CompetitionStatus.choices,
        default=CompetitionStatus.UPCOMING,
        db_index=True
    )
    is_public = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_competitions'
    )
    scenarios = models.ManyToManyField(
        'scenarios.Scenario',
        through='CompetitionScenario',
        related_name='competitions',
        blank=True
    )

    class Meta:
        db_table = 'competitions'
        verbose_name = 'Competition'
        verbose_name_plural = 'Competitions'
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    @property
    def is_currently_active(self):
        now = timezone.now()
        return self.status == CompetitionStatus.ACTIVE and self.start_time <= now <= self.end_time

    @property
    def remaining_seconds(self):
        now = timezone.now()
        if now < self.start_time:
            return int((self.start_time - now).total_seconds())
        if self.start_time <= now <= self.end_time:
            return int((self.end_time - now).total_seconds())
        return 0


class CompetitionScenario(TimeStampedUUIDModel):
    competition = models.ForeignKey(
        Competition,
        on_delete=models.CASCADE,
        related_name='competition_scenarios'
    )
    scenario = models.ForeignKey(
        'scenarios.Scenario',
        on_delete=models.CASCADE,
        related_name='competition_scenarios'
    )
    custom_points = models.PositiveIntegerField(null=True, blank=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'competition_scenarios'
        unique_together = ('competition', 'scenario')
        ordering = ['order_index']

    def __str__(self):
        return f"{self.competition.title} - {self.scenario.title}"


class TournamentConfig(TimeStampedUUIDModel):
    """
    Singleton config model for global tournament settings like duration.
    """
    duration_minutes = models.PositiveIntegerField(default=240, help_text="Total duration of the tournament in minutes.")
    is_active = models.BooleanField(default=True, help_text="Whether the tournament is active or stopped by an admin.")

    class Meta:
        db_table = 'tournament_config'
        verbose_name = 'Tournament Config'
        verbose_name_plural = 'Tournament Configs'

    def __str__(self):
        return f"Global Config ({self.duration_minutes} mins)"

    @classmethod
    def get_config(cls):
        config, created = cls.objects.get_or_create(id='00000000-0000-0000-0000-000000000001', defaults={'duration_minutes': 240})
        return config


class StudentTournamentSession(TimeStampedUUIDModel):
    """
    Tracks an individual student's active tournament session start time and duration.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tournament_session',
        db_index=True
    )
    start_time = models.DateTimeField(auto_now_add=True, db_index=True)
    duration_minutes = models.PositiveIntegerField(help_text="Snapshot of duration config when the user started.")
    total_paused_seconds = models.PositiveIntegerField(default=0, help_text="Total time the session was paused globally.")
    last_paused_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when the tournament was paused.")

    class Meta:
        db_table = 'student_tournament_sessions'
        verbose_name = 'Student Tournament Session'
        verbose_name_plural = 'Student Tournament Sessions'
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.user.username} Session (Started: {self.start_time})"

    @property
    def remaining_seconds(self):
        now = timezone.now()
        elapsed_seconds = int((now - self.start_time).total_seconds()) - self.total_paused_seconds
        
        # If currently paused, don't count the time since it was paused
        if self.last_paused_at:
            paused_duration = int((now - self.last_paused_at).total_seconds())
            elapsed_seconds -= paused_duration
            
        total_seconds = self.duration_minutes * 60
        return max(0, total_seconds - elapsed_seconds)
