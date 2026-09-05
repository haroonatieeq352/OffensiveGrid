from django.urls import path
from .views import FileUploadView, FileDownloadTokenView, SecureFileDownloadView

app_name = 'files'

urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='file_upload'),
    path('<uuid:file_id>/token/', FileDownloadTokenView.as_view(), name='file_token'),
    path('download/<str:token>/', SecureFileDownloadView.as_view(), name='file_download'),
]
