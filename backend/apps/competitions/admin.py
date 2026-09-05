from django.contrib import admin
from .models import Competition, CompetitionScenario


class CompetitionScenarioInline(admin.TabularInline):
    model = CompetitionScenario
    extra = 1


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'start_time', 'end_time', 'is_public', 'created_at']
    list_filter = ['status', 'is_public']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [CompetitionScenarioInline]
