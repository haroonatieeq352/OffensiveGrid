from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.core.responses import success_response, error_response
from apps.accounts.permissions import IsSuperAdmin
from apps.audit.services import AuditService
from .models import PaymentRequest, PaymentStatus, RequestType, PaymentSettings
from .serializers import PaymentRequestCreateSerializer, PaymentRequestAdminSerializer, PaymentSettingsSerializer


class StudentPaymentRequestView(generics.ListCreateAPIView):
    """
    POST /api/v1/payments/request/
    Trainee submits an upgrade interest inquiry OR payment receipt screenshot file.

    GET /api/v1/payments/request/
    Trainee lists their recent payment requests.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentRequestCreateSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return PaymentRequest.objects.filter(user=self.request.user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        # Override the amount with the official settings to prevent frontend tampering
        settings = PaymentSettings.get_settings()
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        payment_request = serializer.save(amount=settings.pro_plan_amount)

        # Audit log creation
        AuditService.log(
            user=request.user,
            action=f"PAYMENT_{payment_request.request_type}_SUBMITTED",
            resource_type="PaymentRequest",
            resource_id=str(payment_request.id),
            details={
                "request_type": payment_request.request_type,
                "amount": str(payment_request.amount),
                "payment_method": payment_request.payment_method,
                "whatsapp_number": payment_request.whatsapp_number,
                "has_screenshot_file": bool(payment_request.screenshot_image),
            },
            request=request
        )

        msg = (
            "Your payment screenshot has been uploaded for verification! Admin will review and unlock Pro access."
            if payment_request.request_type == RequestType.PAYMENT_PROOF
            else "Your Pro membership inquiry has been received! Our team will reach out via WhatsApp/Email with official bank credentials."
        )

        return success_response(
            data=PaymentRequestAdminSerializer(payment_request, context={'request': request}).data,
            message=msg,
            status_code=status.HTTP_201_CREATED
        )


class AdminPaymentRequestListView(generics.ListAPIView):
    """
    GET /api/v1/payments/admin/requests/
    Admin API to list and filter all pending, invoice sent, approved, and revoked payment requests.
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = PaymentRequestAdminSerializer
    queryset = PaymentRequest.objects.select_related('user', 'scenario').all().order_by('-created_at')
    pagination_class = None
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['user__username', 'user__email', 'whatsapp_number', 'transaction_id', 'sender_name']
    ordering_fields = ['created_at', 'amount', 'status', 'request_type', 'is_seen']


class AdminPendingPaymentStatsView(APIView):
    """
    GET /api/v1/payments/admin/stats/
    Admin API to check live unread / pending inquiries & payment verifications for navbar notification bell.
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request, *args, **kwargs):
        unseen_qs = PaymentRequest.objects.filter(
            is_seen=False,
            status__in=[PaymentStatus.PENDING, PaymentStatus.INVOICE_SENT]
        ).select_related('user')
        
        pending_count = unseen_qs.count()
        recent_pending = PaymentRequestAdminSerializer(unseen_qs[:6], many=True, context={'request': request}).data

        inquiries_count = unseen_qs.filter(request_type=RequestType.INQUIRY).count()
        proofs_count = unseen_qs.filter(request_type=RequestType.PAYMENT_PROOF).count()

        return success_response(
            data={
                "pending_count": pending_count,
                "inquiries_count": inquiries_count,
                "proofs_count": proofs_count,
                "recent_requests": recent_pending,
            },
            message="Payment statistics retrieved."
        )


class AdminMarkSeenView(APIView):
    """
    POST /api/v1/payments/admin/requests/<uuid:request_id>/mark-seen/
    Marks a payment request or inquiry as seen by the administrator.
    """
    permission_classes = [IsSuperAdmin]

    def post(self, request, request_id, *args, **kwargs):
        payment_req = get_object_or_404(PaymentRequest, id=request_id)
        if not payment_req.is_seen:
            payment_req.is_seen = True
            payment_req.save(update_fields=['is_seen'])

        return success_response(
            data={"id": str(payment_req.id), "is_seen": True},
            message="Notification marked as read."
        )


class AdminSendInvoiceView(APIView):
    """
    POST /api/v1/payments/admin/requests/<uuid:request_id>/send-invoice/
    Admin marks inquiry as 'Invoice Details Sent via WhatsApp/Email'.
    """
    permission_classes = [IsSuperAdmin]

    def post(self, request, request_id, *args, **kwargs):
        payment_req = get_object_or_404(PaymentRequest, id=request_id)
        payment_req.status = PaymentStatus.INVOICE_SENT
        payment_req.is_seen = True
        payment_req.reviewed_by = request.user
        payment_req.reviewed_at = timezone.now()
        payment_req.admin_notes = request.data.get('admin_notes', 'Official bank credentials sent to trainee via WhatsApp/Email.')
        payment_req.save()

        AuditService.log(
            user=request.user,
            action="INVOICE_DETAILS_SENT",
            resource_type="PaymentRequest",
            resource_id=str(payment_req.id),
            details={
                "student_username": payment_req.user.username,
                "whatsapp": payment_req.whatsapp_number,
            },
            request=request
        )

        return success_response(
            data=PaymentRequestAdminSerializer(payment_req, context={'request': request}).data,
            message=f"Marked invoice sent for {payment_req.user.username}. Waiting for payment receipt."
        )


class AdminApprovePaymentView(APIView):
    """
    POST /api/v1/payments/admin/requests/<uuid:request_id>/approve/
    Admin approves payment and grants full Pro / Paid scenario access to the student.
    """
    permission_classes = [IsSuperAdmin]

    def post(self, request, request_id, *args, **kwargs):
        payment_req = get_object_or_404(PaymentRequest, id=request_id)
        
        if payment_req.request_type == RequestType.INQUIRY:
            return error_response(
                error_code="INVALID_APPROVAL",
                message="Cannot approve an inquiry. Only payment proof receipts can be approved to grant Pro access.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        payment_req.status = PaymentStatus.APPROVED
        payment_req.is_seen = True
        payment_req.reviewed_by = request.user
        payment_req.reviewed_at = timezone.now()
        payment_req.admin_notes = request.data.get('admin_notes', 'Payment verified and approved.')
        payment_req.save()

        # Grant student Pro Access
        student = payment_req.user
        student.has_paid_access = True
        student.save(update_fields=['has_paid_access'])

        # Audit log approval
        AuditService.log(
            user=request.user,
            action="PRO_ACCESS_GRANTED",
            resource_type="User",
            resource_id=str(student.id),
            details={
                "student_username": student.username,
                "student_email": student.email,
                "payment_request_id": str(payment_req.id),
                "amount": str(payment_req.amount),
            },
            request=request
        )

        return success_response(
            data=PaymentRequestAdminSerializer(payment_req, context={'request': request}).data,
            message=f"Payment approved! User {student.username} now has full access to Paid CTF Scenarios."
        )


class AdminRevokePaymentView(APIView):
    """
    POST /api/v1/payments/admin/requests/<uuid:request_id>/revoke/
    Admin revokes or expires Pro subscription access from the student.
    """
    permission_classes = [IsSuperAdmin]

    def post(self, request, request_id, *args, **kwargs):
        payment_req = get_object_or_404(PaymentRequest, id=request_id)
        
        payment_req.status = PaymentStatus.REVOKED
        payment_req.reviewed_by = request.user
        payment_req.reviewed_at = timezone.now()
        payment_req.admin_notes = request.data.get('admin_notes', 'Pro membership subscription expired / revoked.')
        payment_req.save()

        # Revoke student Pro Access
        student = payment_req.user
        student.has_paid_access = False
        student.save(update_fields=['has_paid_access'])

        # Audit log revocation
        AuditService.log(
            user=request.user,
            action="PRO_ACCESS_REVOKED",
            resource_type="User",
            resource_id=str(student.id),
            details={
                "student_username": student.username,
                "student_email": student.email,
                "payment_request_id": str(payment_req.id),
                "reason": payment_req.admin_notes,
            },
            request=request
        )

        return success_response(
            data=PaymentRequestAdminSerializer(payment_req, context={'request': request}).data,
            message=f"Pro subscription revoked for {student.username}. User is reverted back to Free tier."
        )


class AdminRejectPaymentView(APIView):
    """
    POST /api/v1/payments/admin/requests/<uuid:request_id>/reject/
    Admin rejects payment request with an optional note.
    """
    permission_classes = [IsSuperAdmin]

    def post(self, request, request_id, *args, **kwargs):
        payment_req = get_object_or_404(PaymentRequest, id=request_id)
        
        payment_req.status = PaymentStatus.REJECTED
        payment_req.is_seen = True
        payment_req.reviewed_by = request.user
        payment_req.reviewed_at = timezone.now()
        payment_req.admin_notes = request.data.get('admin_notes', 'Payment verification failed or trainee canceled.')
        payment_req.save()

        # Audit log rejection
        AuditService.log(
            user=request.user,
            action="PAYMENT_REJECTED",
            resource_type="PaymentRequest",
            resource_id=str(payment_req.id),
            details={
                "student_username": payment_req.user.username,
                "reason": payment_req.admin_notes,
            },
            request=request
        )

        return success_response(
            data=PaymentRequestAdminSerializer(payment_req, context={'request': request}).data,
            message=f"Payment request rejected. Reason: {payment_req.admin_notes}"
        )


class PaymentSettingsView(APIView):
    """
    GET /api/v1/payments/settings/
    Public/Authenticated endpoint to get the current Pro plan amount.
    
    POST /api/v1/payments/settings/
    SuperAdmin endpoint to update the Pro plan amount.
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSuperAdmin()]
        return [IsAuthenticated()]

    def get(self, request, *args, **kwargs):
        settings = PaymentSettings.get_settings()
        return success_response(
            data=PaymentSettingsSerializer(settings).data,
            message="Payment settings retrieved."
        )

    def post(self, request, *args, **kwargs):
        settings = PaymentSettings.get_settings()
        serializer = PaymentSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=serializer.data,
                message="Pro plan pricing updated successfully."
            )
        return error_response(
            error_code="VALIDATION_ERROR",
            message="Invalid pricing data provided.",
            details=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )
