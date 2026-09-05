from django.contrib import admin
from .models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['user', 'scenario', 'is_correct', 'awarded_points', 'attempt_number', 'created_at']
    list_filter = ['is_correct', 'scenario__category', 'scenario__difficulty']
    search_fields = ['user__username', 'user__email', 'scenario__title', 'submitted_flag']
    actions = ['reset_attempts']

    @admin.action(description="Reset Attempts (Give Chance) - Deletes selected failed submissions")
    def reset_attempts(self, request, queryset):
        # We only want to delete failed submissions to reset their count
        # Deleting a correct submission would revoke their points, which is usually not what "give chance" means
        failed_qs = queryset.filter(is_correct=False)
        count = failed_qs.count()
        failed_qs.delete()
        self.message_user(request, f"Successfully reset {count} failed attempts. The user(s) can now try again.")
