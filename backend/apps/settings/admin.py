from django.contrib import admin
from .models import SystemSettings


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """Admin interface for System Settings"""

    fieldsets = (
        ('Application Settings', {
            'fields': ('app_name', 'app_description', 'app_logo', 'app_favicon')
        }),
        ('Email Settings', {
            'fields': ('email_notifications_enabled', 'email_from_address', 'email_from_name')
        }),
        ('Security Settings', {
            'fields': ('session_timeout', 'password_min_length', 'require_email_verification', 'enable_two_factor_auth')
        }),
        ('Data & Privacy', {
            'fields': ('data_retention_days', 'enable_audit_logs')
        }),
        ('Survey Settings', {
            'fields': ('survey_auto_approval', 'survey_draft_expiry_days')
        }),
        ('Pagination Settings', {
            'fields': ('default_page_size', 'max_page_size')
        }),
        ('Maintenance Mode', {
            'fields': ('maintenance_mode', 'maintenance_message')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at', 'updated_by')

    def has_add_permission(self, request):
        """Prevent adding new settings (singleton)"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deleting settings"""
        return False
