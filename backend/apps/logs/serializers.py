from rest_framework import serializers
from .models import ActivityLog, VerificationLog, DataChangeLog, SystemError, ImportExportLog


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for activity logs"""

    user_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_name', 'username', 'action', 'action_display',
            'severity', 'severity_display', 'description', 'model_name', 'object_repr',
            'ip_address', 'request_method', 'request_path', 'changes', 'metadata', 'timestamp'
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return obj.username


class VerificationLogSerializer(serializers.ModelSerializer):
    """Serializer for verification logs"""

    survey_id = serializers.IntegerField(source='survey.id', read_only=True)
    service_name = serializers.CharField(source='survey.service.name', read_only=True)
    performed_by_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = VerificationLog
        fields = [
            'id', 'survey', 'survey_id', 'service_name', 'action', 'action_display',
            'performed_by', 'performed_by_name', 'previous_status', 'new_status',
            'previous_verifier', 'new_verifier', 'notes', 'rejection_reason',
            'field_changes', 'time_taken_minutes', 'timestamp'
        ]
        read_only_fields = fields

    def get_performed_by_name(self, obj):
        if obj.performed_by:
            return obj.performed_by.get_full_name() or obj.performed_by.email
        return None


class DataChangeLogSerializer(serializers.ModelSerializer):
    """Serializer for data change logs"""

    user_name = serializers.SerializerMethodField()
    operation_display = serializers.CharField(source='get_operation_display', read_only=True)

    class Meta:
        model = DataChangeLog
        fields = [
            'id', 'user', 'user_name', 'username', 'model_name', 'app_label',
            'operation', 'operation_display', 'object_id', 'object_repr',
            'old_values', 'new_values', 'changed_fields', 'reason', 'metadata',
            'is_bulk_operation', 'affected_count', 'timestamp'
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return obj.username


class SystemErrorSerializer(serializers.ModelSerializer):
    """Serializer for system errors"""

    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    error_type_display = serializers.CharField(source='get_error_type_display', read_only=True)
    user_name = serializers.SerializerMethodField()
    resolved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SystemError
        fields = [
            'id', 'severity', 'severity_display', 'error_type', 'error_type_display',
            'error_code', 'error_message', 'exception_type', 'stack_trace',
            'module', 'function', 'line_number', 'user', 'user_name', 'username',
            'request_method', 'request_path', 'request_data', 'is_resolved',
            'resolved_by', 'resolved_by_name', 'resolved_at', 'resolution_notes',
            'occurrence_count', 'first_occurred_at', 'last_occurred_at', 'timestamp'
        ]
        read_only_fields = [
            'id', 'severity', 'error_type', 'error_code', 'error_message',
            'exception_type', 'stack_trace', 'module', 'function', 'line_number',
            'user', 'username', 'request_method', 'request_path', 'request_data',
            'occurrence_count', 'first_occurred_at', 'last_occurred_at', 'timestamp'
        ]

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return obj.username

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return obj.resolved_by.get_full_name() or obj.resolved_by.email
        return None


class ImportExportLogSerializer(serializers.ModelSerializer):
    """Serializer for import/export logs"""

    operation_display = serializers.CharField(source='get_operation_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    format_display = serializers.CharField(source='get_file_format_display', read_only=True)
    user_name = serializers.SerializerMethodField()
    success_rate = serializers.ReadOnlyField()

    class Meta:
        model = ImportExportLog
        fields = [
            'id', 'operation', 'operation_display', 'status', 'status_display',
            'user', 'user_name', 'username', 'model_name', 'file_format', 'format_display',
            'file_name', 'file_path', 'file_size', 'total_records', 'successful_records',
            'failed_records', 'skipped_records', 'success_rate', 'errors', 'warnings',
            'started_at', 'completed_at', 'duration_seconds', 'filters', 'options',
            'notes', 'metadata'
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return obj.username
