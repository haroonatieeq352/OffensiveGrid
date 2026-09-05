from django.contrib import admin
from .models import SolvedScenario, UserScore


@admin.register(SolvedScenario)
class SolvedScenarioAdmin(admin.ModelAdmin):
    list_display = ['user', 'scenario', 'competition', 'awarded_points', 'solved_at']
    list_filter = ['competition', 'scenario__category', 'scenario__difficulty']
    search_fields = ['user__username', 'user__email', 'scenario__title']


@admin.register(UserScore)
class UserScoreAdmin(admin.ModelAdmin):
    list_display = ['user', 'competition', 'total_score', 'solved_count', 'last_solve_time']
    list_filter = ['competition']
    search_fields = ['user__username', 'user__email']
    ordering = ['-total_score', 'last_solve_time']
