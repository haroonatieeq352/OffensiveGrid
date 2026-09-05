from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryListView,
    DifficultyListView,
    ScenarioListView,
    ScenarioDetailView,
    AdminScenarioViewSet,
    AdminCategoryViewSet,
    AdminDifficultyViewSet,
)

app_name = 'scenarios'

router = DefaultRouter()
router.register(r'admin/scenarios', AdminScenarioViewSet, basename='admin-scenarios')
router.register(r'admin/categories', AdminCategoryViewSet, basename='admin-categories')
router.register(r'admin/difficulties', AdminDifficultyViewSet, basename='admin-difficulties')

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('difficulties/', DifficultyListView.as_view(), name='difficulty_list'),
    path('', ScenarioListView.as_view(), name='scenario_list'),
    path('<slug:slug>/', ScenarioDetailView.as_view(), name='scenario_detail'),
    path('', include(router.urls)),
]
