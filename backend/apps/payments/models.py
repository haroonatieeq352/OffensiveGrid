from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedUUIDModel
from apps.scenarios.models import Scenario


class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Verification'
    INVOICE_SENT = 'INVOICE_SENT', 'Invoice Details Sent via WhatsApp/Email'
    APPROVED = 'APPROVED', 'Approved & Pro Access Granted'
    REVOKED = 'REVOKED', 'Pro Access Revoked / Expired'
    REJECTED = 'REJECTED', 'Rejected'


class RequestType(models.TextChoices):
    INQUIRY = 'INQUIRY', 'Invoice / Bank Details Inquiry'
    PAYMENT_PROOF = 'PAYMENT_PROOF', 'Payment Receipt Proof'


class PaymentMethod(models.TextChoices):
    BANK_TRANSFER = 'BANK_TRANSFER', 'Direct Bank / IBAN Transfer'
    EASYPAISA = 'EASYPAISA', 'Easypaisa Mobile Account'
    JAZZ_CASH = 'JAZZ_CASH', 'JazzCash Account'
    RAAST = 'RAAST', 'Raast Instant Pay'
    OTHER = 'OTHER', 'Other / Corporate Invoice'


class PaymentRequest(TimeStampedUUIDModel):
    """
    Tracks trainee inquiries for banking details and payment verification requests for OffensiveGrid Pro access.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_requests'
    )
    scenario = models.ForeignKey(
        Scenario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_requests',
        help_text='Specific scenario, or leave blank for full Pro platform unlock'
    )
    request_type = models.CharField(
        max_length=30,
        choices=RequestType.choices,
        default=RequestType.INQUIRY,
        help_text='Whether this is an initial bank inquiry or an uploaded payment receipt'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=2500.00,
        help_text='Amount in PKR'
    )
    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        default=PaymentMethod.BANK_TRANSFER
    )
    sender_name = models.CharField(max_length=150, help_text='Name of trainee / sender account')
    whatsapp_number = models.CharField(max_length=50, help_text='WhatsApp / Phone for invoice confirmation')
    transaction_id = models.CharField(max_length=150, blank=True, help_text='Bank transaction or ref ID')
    screenshot_url = models.TextField(blank=True, help_text='External image link if provided')
    screenshot_image = models.FileField(upload_to='payment_receipts/', blank=True, null=True, help_text='Uploaded receipt image file')
    notes = models.TextField(blank=True, help_text='Additional inquiry notes or requirements from trainee')
    
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )
    is_seen = models.BooleanField(
        default=False,
        db_index=True,
        help_text='Whether admin has viewed this notification'
    )
    admin_notes = models.TextField(blank=True, help_text='Reason for approval/rejection or revocation note')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_payments'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payment_requests'
        verbose_name = 'Payment Verification & Pro Inquiry'
        verbose_name_plural = 'Payment Verification & Pro Inquiries'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.request_type} - {self.status}] {self.user.username} ({self.payment_method})"

class PaymentSettings(TimeStampedUUIDModel):
    """
    Singleton model to store global payment settings like the dynamic Pro Subscription price.
    """
    pro_plan_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=2500.00,
        help_text="Global price for the Pro All-Access membership in PKR"
    )

    class Meta:
        db_table = 'payment_settings'
        verbose_name = 'Payment Setting'
        verbose_name_plural = 'Payment Settings'

    @classmethod
    def get_settings(cls):
        obj = cls.objects.first()
        if not obj:
            obj = cls.objects.create(pro_plan_amount=2500.00)
        return obj

    def __str__(self):
        return f"Pro Plan Amount: {self.pro_plan_amount} PKR"
