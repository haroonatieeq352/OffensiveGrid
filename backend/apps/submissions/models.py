from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedUUIDModel


class Submission(TimeStampedUUIDModel):
    """
    Records every flag attempt made by a user.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions',
        db_index=True
    )
    scenario = models.ForeignKey(
        'scenarios.Scenario',
        on_delete=models.CASCADE,
        related_name='submissions',
        db_index=True
    )
    competition = models.ForeignKey(
        'competitions.Competition',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submissions',
        db_index=True
    )
    submitted_flag = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False, db_index=True)
    awarded_points = models.PositiveIntegerField(default=0)
    attempt_number = models.PositiveIntegerField(default=1)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'submissions'
        verbose_name = 'Submission'
        verbose_name_plural = 'Submissions'
        ordering = ['-created_at']

    def __str__(self):
        status_text = "CORRECT" if self.is_correct else "FAILED"
        return f"{self.user.username} - {self.scenario.title} ({status_text})"
