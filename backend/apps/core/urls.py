from django.urls import path
from .views import license_status, activate_license

app_name = 'core'

urlpatterns = [
    path('status/', license_status, name='license_status'),
    path('activate/', activate_license, name='activate_license'),
]
