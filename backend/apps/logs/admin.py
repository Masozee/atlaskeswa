from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import ActivityLog, VerificationLog, DataChangeLog, SystemError, ImportExportLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'username', 'action', 'severity', 'model_name', 'description_short', 'ip_address')
    list_filter = ('action', 'severity', 'model_name', 'timestamp')
    search_fields = ('username', 'description', 'model_name', 'object_repr', 'ip_address')
    readonly_fields = ('user', 'username', 'action', 'severity', 'description', 'content_type', 'object_id',
                       'model_name', 'object_repr', 'ip_address', 'user_agent', 'request_method', 'request_path',
                       'changes', 'metadata', 'timestamp', 'related_object_link')
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'username', 'ip_address')
        }),
        ('Action Details', {
            'fields': ('action', 'severity', 'description', 'timestamp')
        }),
        ('Related Object', {
            'fields': ('content_type', 'object_id', 'related_object_link', 'model_name', 'object_repr')
        }),
        ('Request Information', {
            'fields': ('request_method', 'request_path', 'user_agent')
        }),
        ('Additional Data', {
            'fields': ('changes', 'metadata'),
            'classes': ('collapse',)
        }),
    )

    def description_short(self, obj):
        return obj.description[:75] + '...' if len(obj.description) > 75 else obj.description
    description_short.short_description = 'Description'

    def related_object_link(self, obj):
        if obj.content_type and obj.object_id:
            try:
                url = reverse(f'admin:{obj.content_type.app_label}_{obj.content_type.model}_change',
                              args=[obj.object_id])
                return format_html('<a href="{}">{}</a>', url, obj.object_repr or f'{obj.model_name} #{obj.object_id}')
            except:
                return obj.object_repr or f'{obj.model_name} #{obj.object_id}'
        return '-'
    related_object_link.short_description = 'Related Object'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(VerificationLog)
class VerificationLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'survey_link', 'action', 'performed_by', 'previous_status', 'new_status', 'new_verifier')
    list_filter = ('action', 'new_status', 'timestamp')
    search_fields = ('survey__service__name', 'performed_by__username', 'notes', 'rejection_reason')
    readonly_fields = ('survey', 'action', 'performed_by', 'previous_status', 'new_status', 'previous_verifier',
                       'new_verifier', 'notes', 'rejection_reason', 'field_changes', 'time_taken_minutes',
                       'ip_address', 'timestamp')
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'

    fieldsets = (
        ('Survey Information', {
            'fields': ('survey', 'timestamp')
        }),
        ('Action Details', {
            'fields': ('action', 'performed_by', 'time_taken_minutes')
        }),
        ('Status Change', {
            'fields': ('previous_status', 'new_status')
        }),
        ('Verifier Change', {
            'fields': ('previous_verifier', 'new_verifier')
        }),
        ('Details', {
            'fields': ('notes', 'rejection_reason')
        }),
        ('Data Changes', {
            'fields': ('field_changes',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('ip_address',)
        }),
    )

    def survey_link(self, obj):
        url = reverse('admin:survey_survey_change', args=[obj.survey.id])
        return format_html('<a href="{}">{}</a>', url, obj.survey)
    survey_link.short_description = 'Survey'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(DataChangeLog)
class DataChangeLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'username', 'operation', 'model_name', 'object_repr', 'is_bulk_operation',
                    'affected_count', 'changed_fields_display')
    list_filter = ('operation', 'model_name', 'is_bulk_operation', 'timestamp')
    search_fields = ('username', 'model_name', 'object_repr', 'reason')
    readonly_fields = ('user', 'username', 'content_type', 'object_id', 'object_repr', 'model_name', 'app_label',
                       'operation', 'old_values', 'new_values', 'changed_fields', 'reason', 'metadata',
                       'ip_address', 'request_path', 'is_bulk_operation', 'affected_count', 'timestamp',
                       'related_object_link')
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'username', 'ip_address')
        }),
        ('Object Information', {
            'fields': ('content_type', 'object_id', 'related_object_link', 'object_repr', 'model_name', 'app_label')
        }),
        ('Operation Details', {
            'fields': ('operation', 'is_bulk_operation', 'affected_count', 'timestamp')
        }),
        ('Data Changes', {
            'fields': ('changed_fields', 'old_values', 'new_values')
        }),
        ('Additional Context', {
            'fields': ('reason', 'request_path', 'metadata'),
            'classes': ('collapse',)
        }),
    )

    def changed_fields_display(self, obj):
        if obj.changed_fields:
            fields = obj.changed_fields if isinstance(obj.changed_fields, list) else []
            return ', '.join(fields[:5]) + ('...' if len(fields) > 5 else '')
        return '-'
    changed_fields_display.short_description = 'Changed Fields'

    def related_object_link(self, obj):
        if obj.content_type and obj.object_id:
            try:
                url = reverse(f'admin:{obj.app_label}_{obj.content_type.model}_change', args=[obj.object_id])
                return format_html('<a href="{}">{}</a>', url, obj.object_repr or f'{obj.model_name} #{obj.object_id}')
            except:
                return obj.object_repr or f'{obj.model_name} #{obj.object_id}'
        return '-'
    related_object_link.short_description = 'Related Object'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(SystemError)
class SystemErrorAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'severity_badge', 'error_type', 'error_message_short', 'username', 'request_path',
                    'is_resolved', 'occurrence_count')
    list_filter = ('severity', 'error_type', 'is_resolved', 'timestamp', 'last_occurred_at')
    search_fields = ('error_message', 'error_code', 'exception_type', 'username', 'request_path')
    readonly_fields = ('severity', 'error_type', 'error_code', 'error_message', 'exception_type', 'stack_trace',
                       'module', 'function', 'line_number', 'user', 'username', 'request_method', 'request_path',
                       'request_data', 'ip_address', 'user_agent', 'metadata', 'occurrence_count',
                       'first_occurred_at', 'last_occurred_at', 'timestamp')
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'

    fieldsets = (
        ('Error Classification', {
            'fields': ('severity', 'error_type', 'error_code', 'timestamp')
        }),
        ('Error Details', {
            'fields': ('error_message', 'exception_type')
        }),
        ('Stack Trace', {
            'fields': ('stack_trace',),
            'classes': ('collapse',)
        }),
        ('Context', {
            'fields': ('module', 'function', 'line_number')
        }),
        ('User Information', {
            'fields': ('user', 'username', 'ip_address', 'user_agent')
        }),
        ('Request Information', {
            'fields': ('request_method', 'request_path', 'request_data'),
            'classes': ('collapse',)
        }),
        ('Occurrence Tracking', {
            'fields': ('occurrence_count', 'first_occurred_at', 'last_occurred_at')
        }),
        ('Resolution', {
            'fields': ('is_resolved', 'resolved_by', 'resolved_at', 'resolution_notes')
        }),
        ('Additional Data', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )

    def severity_badge(self, obj):
        colors = {
            'DEBUG': 'gray',
            'INFO': 'blue',
            'WARNING': 'orange',
            'ERROR': 'red',
            'CRITICAL': 'darkred',
        }
        color = colors.get(obj.severity, 'black')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_severity_display()
        )
    severity_badge.short_description = 'Severity'

    def error_message_short(self, obj):
        return obj.error_message[:100] + '...' if len(obj.error_message) > 100 else obj.error_message
    error_message_short.short_description = 'Error Message'

    def has_add_permission(self, request):
        return False


@admin.register(ImportExportLog)
class ImportExportLogAdmin(admin.ModelAdmin):
    list_display = ('started_at', 'operation', 'status_badge', 'model_name', 'file_format', 'username',
                    'total_records', 'successful_records', 'failed_records', 'success_rate_display', 'duration_display')
    list_filter = ('operation', 'status', 'file_format', 'model_name', 'started_at')
    search_fields = ('username', 'model_name', 'file_name', 'notes')
    readonly_fields = ('operation', 'status', 'user', 'username', 'model_name', 'file_format', 'file_name',
                       'file_path', 'file_size', 'total_records', 'successful_records', 'failed_records',
                       'skipped_records', 'errors', 'warnings', 'started_at', 'completed_at', 'duration_seconds',
                       'filters', 'options', 'metadata', 'ip_address', 'success_rate_display', 'file_size_display')
    ordering = ('-started_at',)
    date_hierarchy = 'started_at'

    fieldsets = (
        ('Operation Details', {
            'fields': ('operation', 'status', 'model_name', 'file_format')
        }),
        ('User Information', {
            'fields': ('user', 'username', 'ip_address')
        }),
        ('File Information', {
            'fields': ('file_name', 'file_path', 'file_size', 'file_size_display')
        }),
        ('Processing Statistics', {
            'fields': ('total_records', 'successful_records', 'failed_records', 'skipped_records', 'success_rate_display')
        }),
        ('Errors and Warnings', {
            'fields': ('errors', 'warnings'),
            'classes': ('collapse',)
        }),
        ('Timing', {
            'fields': ('started_at', 'completed_at', 'duration_seconds')
        }),
        ('Configuration', {
            'fields': ('filters', 'options'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'metadata'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        colors = {
            'INITIATED': 'gray',
            'IN_PROGRESS': 'blue',
            'COMPLETED': 'green',
            'FAILED': 'red',
            'PARTIALLY_COMPLETED': 'orange',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def success_rate_display(self, obj):
        rate = obj.success_rate
        color = 'green' if rate >= 90 else 'orange' if rate >= 70 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color, rate
        )
    success_rate_display.short_description = 'Success Rate'

    def duration_display(self, obj):
        if obj.duration_seconds:
            minutes = obj.duration_seconds // 60
            seconds = obj.duration_seconds % 60
            return f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"
        return '-'
    duration_display.short_description = 'Duration'

    def file_size_display(self, obj):
        if obj.file_size:
            # Convert bytes to human readable format
            size = obj.file_size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.2f} {unit}"
                size /= 1024.0
            return f"{size:.2f} TB"
        return '-'
    file_size_display.short_description = 'File Size'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser  # Only superusers can mark as resolved
