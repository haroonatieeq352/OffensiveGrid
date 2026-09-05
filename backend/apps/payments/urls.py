from django.urls import path
from .views import (
    StudentPaymentRequestView,
    AdminPaymentRequestListView,
    AdminPendingPaymentStatsView,
    AdminMarkSeenView,
    AdminSendInvoiceView,
    AdminApprovePaymentView,
    AdminRevokePaymentView,
    AdminRejectPaymentView,
    PaymentSettingsView,
)

app_name = 'payments'

urlpatterns = [
    path('settings/', PaymentSettingsView.as_view(), name='payment_settings'),
    path('request/', StudentPaymentRequestView.as_view(), name='student_payment_request'),
    path('admin/requests/', AdminPaymentRequestListView.as_view(), name='admin_payment_requests'),
    path('admin/stats/', AdminPendingPaymentStatsView.as_view(), name='admin_payment_stats'),
    path('admin/requests/<uuid:request_id>/mark-seen/', AdminMarkSeenView.as_view(), name='admin_mark_seen'),
    path('admin/requests/<uuid:request_id>/send-invoice/', AdminSendInvoiceView.as_view(), name='admin_send_invoice'),
    path('admin/requests/<uuid:request_id>/approve/', AdminApprovePaymentView.as_view(), name='admin_approve_payment'),
    path('admin/requests/<uuid:request_id>/revoke/', AdminRevokePaymentView.as_view(), name='admin_revoke_payment'),
    path('admin/requests/<uuid:request_id>/reject/', AdminRejectPaymentView.as_view(), name='admin_reject_payment'),
]
