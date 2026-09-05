from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedUUIDModel


class Difficulty(TimeStampedUUIDModel):
    name = models.CharField(max_length=50, unique=True, db_index=True)
    level_value = models.PositiveIntegerField(default=10, help_text='Numeric value for sorting (e.g., 10=Easy, 20=Medium)')
    color_code = models.CharField(max_length=50, default='emerald', help_text='Tailwind color prefix (e.g., emerald, amber, red)')

    class Meta:
        db_table = 'difficulties'
        verbose_name = 'Difficulty'
        verbose_name_plural = 'Difficulties'
        ordering = ['level_value']

    def __str__(self):
        return self.name


class ScenarioStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PUBLISHED = 'PUBLISHED', 'Published'
    ARCHIVED = 'ARCHIVED', 'Archived'


class Category(TimeStampedUUIDModel):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=50, default='Shield', help_text='Lucide icon name')

    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Scenario(TimeStampedUUIDModel):
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(help_text='Short description or briefing')
    instructions = models.TextField(help_text='Detailed markdown mission briefing')
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='scenarios'
    )
    difficulty = models.ForeignKey(
        Difficulty,
        on_delete=models.PROTECT,
        related_name='scenarios',
        null=True,
        blank=True
    )
    points = models.PositiveIntegerField(default=100, help_text='Base points awarded for first solve')
    target_url = models.URLField(max_length=1000, blank=True, null=True, help_text='Target environment sandbox URL')
    max_attempts = models.PositiveIntegerField(default=0, help_text='0 = unlimited attempts allowed')
    time_limit_minutes = models.PositiveIntegerField(default=0, help_text='0 = no time limit')
    is_paid = models.BooleanField(default=False, help_text='Restricted to paid trainees')
    status = models.CharField(
        max_length=20,
        choices=ScenarioStatus.choices,
        default=ScenarioStatus.PUBLISHED,
        db_index=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_scenarios'
    )

    class Meta:
        db_table = 'scenarios'
        verbose_name = 'Scenario'
        verbose_name_plural = 'Scenarios'
        ordering = ['-created_at']

    def __str__(self):
        difficulty_name = self.difficulty.name if self.difficulty else "Unknown"
        return f"[{difficulty_name}] {self.title} ({self.points} pts)"


class Flag(TimeStampedUUIDModel):
    scenario = models.ForeignKey(
        Scenario,
        on_delete=models.CASCADE,
        related_name='flags'
    )
    flag_value = models.CharField(max_length=255, help_text='e.g. CTF{secret_flag_value}')
    is_case_sensitive = models.BooleanField(default=True)
    is_regex = models.BooleanField(default=False)

    class Meta:
        db_table = 'flags'
        verbose_name = 'Flag'
        verbose_name_plural = 'Flags'

    def __str__(self):
        return f"Flag for {self.scenario.title}"


class ScenarioFile(TimeStampedUUIDModel):
    scenario = models.ForeignKey(
        Scenario,
        on_delete=models.CASCADE,
        related_name='files'
    )
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=1000, help_text='Supabase storage key or relative path')
    file_size_bytes = models.BigIntegerField(default=0)
    file_type = models.CharField(max_length=100, default='application/pdf')
    is_public = models.BooleanField(default=True)

    class Meta:
        db_table = 'scenario_files'
        verbose_name = 'Scenario File'
        verbose_name_plural = 'Scenario Files'

    def __str__(self):
        return f"{self.file_name} ({self.scenario.title})"
