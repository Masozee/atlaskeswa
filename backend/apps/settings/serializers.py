from rest_framework import serializers
from .models import SystemSettings


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for System Settings"""

    updated_by_email = serializers.CharField(source='updated_by.email', read_only=True)
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SystemSettings
        fields = [
            'id',
            # Application Settings
            'app_name',
            'app_description',
            'app_logo',
            'app_favicon',
            # Email Settings
            'email_notifications_enabled',
            'email_from_address',
            'email_from_name',
            # Security Settings
            'session_timeout',
            'password_min_length',
            'require_email_verification',
            'enable_two_factor_auth',
            # Data & Privacy Settings
            'data_retention_days',
            'enable_audit_logs',
            # Survey Settings
            'survey_auto_approval',
            'survey_draft_expiry_days',
            # Pagination Settings
            'default_page_size',
            'max_page_size',
            # Maintenance Mode
            'maintenance_mode',
            'maintenance_message',
            # Metadata
            'created_at',
            'updated_at',
            'updated_by',
            'updated_by_email',
            'updated_by_name',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by']

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return obj.updated_by.get_full_name() or obj.updated_by.email
        return None

    def update(self, instance, validated_data):
        """Update settings and track who made the change"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            instance.updated_by = request.user
        return super().update(instance, validated_data)
