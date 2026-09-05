from django.contrib import admin
from .models import Category, Scenario, Flag, ScenarioFile


class FlagInline(admin.TabularInline):
    model = Flag
    extra = 1


class ScenarioFileInline(admin.TabularInline):
    model = ScenarioFile
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'created_at']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Scenario)
class ScenarioAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'difficulty', 'points', 'status', 'is_paid', 'created_at']
    list_filter = ['category', 'difficulty', 'status', 'is_paid']
    search_fields = ['title', 'description', 'instructions']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [FlagInline, ScenarioFileInline]
