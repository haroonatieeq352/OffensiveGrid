import os
from rest_framework import serializers
from .models import PaymentRequest, PaymentStatus, PaymentMethod, RequestType, PaymentSettings
from apps.accounts.serializers import UserProfileSerializer

class PaymentSettingsSerializer(serializers.ModelSerializer):
    pro_plan_amount = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        min_value=0, 
        max_value=999999
    )

    class Meta:
        model = PaymentSettings
        fields = ['pro_plan_amount']


class PaymentRequestCreateSerializer(serializers.ModelSerializer):
    notes = serializers.CharField(max_length=500, allow_blank=True, required=False)

    class Meta:
        model = PaymentRequest
        fields = [
            'id',
            'scenario',
            'request_type',
            'amount',
            'payment_method',
            'sender_name',
            'whatsapp_number',
            'transaction_id',
            'screenshot_url',
            'screenshot_image',
            'notes',
            'status',
            'is_seen',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'is_seen', 'created_at']

    def validate_screenshot_image(self, value):
        if value:
            # Security VAPT check: Restrict size to 5MB to prevent DoS
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("File size cannot exceed 5MB.")
            
            # Security VAPT check: Strictly restrict extensions to prevent RCE
            ext = os.path.splitext(value.name)[1].lower()
            valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
            if ext not in valid_extensions:
                raise serializers.ValidationError("Only screenshot images (JPG, PNG, WEBP) are allowed. Executable or malicious files are strictly blocked.")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        return PaymentRequest.objects.create(user=user, **validated_data)


class PaymentRequestAdminSerializer(serializers.ModelSerializer):
    user_details = UserProfileSerializer(source='user', read_only=True)
    scenario_title = serializers.CharField(source='scenario.title', read_only=True, default='Full Pro Membership')
    screenshot_image_url = serializers.SerializerMethodField()

    class Meta:
        model = PaymentRequest
        fields = [
            'id',
            'user',
            'user_details',
            'scenario',
            'scenario_title',
            'request_type',
            'amount',
            'payment_method',
            'sender_name',
            'whatsapp_number',
            'transaction_id',
            'screenshot_url',
            'screenshot_image',
            'screenshot_image_url',
            'notes',
            'status',
            'is_seen',
            'admin_notes',
            'reviewed_by',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_screenshot_image_url(self, obj):
        if obj.screenshot_image:
            return obj.screenshot_image.url
        return obj.screenshot_url or None
