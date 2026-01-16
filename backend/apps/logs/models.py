from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class ActivityLog(models.Model):
    """Comprehensive user activity logging for all system actions"""

    class Action(models.TextChoices):
        # Authentication
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        LOGIN_FAILED = 'LOGIN_FAILED', 'Login Failed'
        PASSWORD_CHANGED = 'PASSWORD_CHANGED', 'Password Changed'
        PASSWORD_RESET = 'PASSWORD_RESET', 'Password Reset'

        # CRUD Operations
        CREATE = 'CREATE', 'Create'
        READ = 'READ', 'Read/View'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'

        # Survey Operations
        SURVEY_SUBMIT = 'SURVEY_SUBMIT', 'Survey Submitted'
        SURVEY_ASSIGN = 'SURVEY_ASSIGN', 'Survey Assigned'
        SURVEY_VERIFY = 'SURVEY_VERIFY', 'Survey Verified'
        SURVEY_REJECT = 'SURVEY_REJECT', 'Survey Rejected'

        # Data Operations
        EXPORT = 'EXPORT', 'Data Export'
        IMPORT = 'IMPORT', 'Data Import'
        BULK_UPDATE = 'BULK_UPDATE', 'Bulk Update'
        BULK_DELETE = 'BULK_DELETE', 'Bulk Delete'

        # File Operations
        FILE_UPLOAD = 'FILE_UPLOAD', 'File Upload'
        FILE_DOWNLOAD = 'FILE_DOWNLOAD', 'File Download'
        FILE_DELETE = 'FILE_DELETE', 'File Delete'

        # Configuration
        SETTINGS_CHANGE = 'SETTINGS_CHANGE', 'Settings Changed'
        ROLE_ASSIGNED = 'ROLE_ASSIGNED', 'Role Assigned'
        PERMISSION_CHANGED = 'PERMISSION_CHANGED', 'Permission Changed'

    class Severity(models.TextChoices):
        INFO = 'INFO', 'Information'
        WARNING = 'WARNING', 'Warning'
        ERROR = 'ERROR', 'Error'
        CRITICAL = 'CRITICAL', 'Critical'

    # User Information
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    username = models.CharField(max_length=150, db_index=True)  # Store username in case user is deleted

    # Action Details
    action = models.CharField(max_length=50, choices=Action.choices, db_index=True)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.INFO)
    description = models.TextField()

    # Related Object (Generic Foreign Key)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    # Model Information
    model_name = models.CharField(max_length=100, blank=True, db_index=True)
    object_repr = models.CharField(max_length=200, blank=True)  # String representation of object

    # Request Information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_method = models.CharField(max_length=10, blank=True)  # GET, POST, PUT, DELETE
    request_path = models.CharField(max_length=500, blank=True)

    # Additional Data
    changes = models.JSONField(null=True, blank=True)  # Before/after values
    metadata = models.JSONField(null=True, blank=True)  # Additional context

    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['severity', '-timestamp']),
            models.Index(fields=['model_name', '-timestamp']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['ip_address', '-timestamp']),
        ]
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'

    def __str__(self):
        return f"{self.username} - {self.get_action_display()} at {self.timestamp}"


class VerificationLog(models.Model):
    """Detailed logs for survey verification workflow"""

    class Action(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Survey Submitted for Verification'
        ASSIGNED = 'ASSIGNED', 'Assigned to Verifier'
        REASSIGNED = 'REASSIGNED', 'Reassigned to Different Verifier'
        VERIFIED = 'VERIFIED', 'Verified and Approved'
        REJECTED = 'REJECTED', 'Rejected'
        RESUBMITTED = 'RESUBMITTED', 'Resubmitted After Rejection'
        COMMENT_ADDED = 'COMMENT_ADDED', 'Comment Added'
        ATTACHMENT_ADDED = 'ATTACHMENT_ADDED', 'Attachment Added'
        ATTACHMENT_REMOVED = 'ATTACHMENT_REMOVED', 'Attachment Removed'

    # Survey Reference
    survey = models.ForeignKey(
        'survey.Survey',
        on_delete=models.CASCADE,
        related_name='verification_logs'
    )

    # Action Details
    action = models.CharField(max_length=50, choices=Action.choices, db_index=True)
    performed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='verification_actions'
    )

    # Status Change
    previous_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20, blank=True)

    # Verifier Information
    previous_verifier = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='previous_verifications'
    )
    new_verifier = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_verifications'
    )

    # Details
    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    # Data Changes
    field_changes = models.JSONField(null=True, blank=True)  # Specific field modifications

    # Time Tracking
    time_taken_minutes = models.PositiveIntegerField(null=True, blank=True)  # Time from submission to verification

    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'verification_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['survey', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['performed_by', '-timestamp']),
            models.Index(fields=['new_verifier', '-timestamp']),
        ]
        verbose_name = 'Verification Log'
        verbose_name_plural = 'Verification Logs'

    def __str__(self):
        return f"{self.get_action_display()} - Survey #{self.survey_id} at {self.timestamp}"


class DataChangeLog(models.Model):
    """Comprehensive audit trail for all data modifications"""

    class Operation(models.TextChoices):
        INSERT = 'INSERT', 'Insert'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        BULK_INSERT = 'BULK_INSERT', 'Bulk Insert'
        BULK_UPDATE = 'BULK_UPDATE', 'Bulk Update'
        BULK_DELETE = 'BULK_DELETE', 'Bulk Delete'

    # User Information
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='data_changes'
    )
    username = models.CharField(max_length=150, db_index=True)

    # Object Information
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)

    # Model Details
    model_name = models.CharField(max_length=100, db_index=True)
    app_label = models.CharField(max_length=100)

    # Operation Details
    operation = models.CharField(max_length=20, choices=Operation.choices, db_index=True)

    # Data Changes
    old_values = models.JSONField(null=True, blank=True)  # Previous state
    new_values = models.JSONField(null=True, blank=True)  # Current state
    changed_fields = models.JSONField(null=True, blank=True)  # List of changed field names

    # Additional Context
    reason = models.TextField(blank=True)  # Why the change was made
    metadata = models.JSONField(null=True, blank=True)

    # Request Information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    request_path = models.CharField(max_length=500, blank=True)

    # Bulk Operation Details
    is_bulk_operation = models.BooleanField(default=False)
    affected_count = models.PositiveIntegerField(default=1)  # Number of records affected

    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'data_change_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['model_name', '-timestamp']),
            models.Index(fields=['operation', '-timestamp']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['is_bulk_operation', '-timestamp']),
        ]
        verbose_name = 'Data Change Log'
        verbose_name_plural = 'Data Change Logs'

    def __str__(self):
        return f"{self.username} - {self.get_operation_display()} {self.model_name} at {self.timestamp}"


class SystemError(models.Model):
    """System error and exception logging"""

    class Severity(models.TextChoices):
        DEBUG = 'DEBUG', 'Debug'
        INFO = 'INFO', 'Information'
        WARNING = 'WARNING', 'Warning'
        ERROR = 'ERROR', 'Error'
        CRITICAL = 'CRITICAL', 'Critical'

    class ErrorType(models.TextChoices):
        VALIDATION = 'VALIDATION', 'Validation Error'
        DATABASE = 'DATABASE', 'Database Error'
        API = 'API', 'API Error'
        AUTHENTICATION = 'AUTHENTICATION', 'Authentication Error'
        PERMISSION = 'PERMISSION', 'Permission Error'
        FILE_SYSTEM = 'FILE_SYSTEM', 'File System Error'
        EXTERNAL_SERVICE = 'EXTERNAL_SERVICE', 'External Service Error'
        CONFIGURATION = 'CONFIGURATION', 'Configuration Error'
        RUNTIME = 'RUNTIME', 'Runtime Error'
        UNKNOWN = 'UNKNOWN', 'Unknown Error'

    # Error Classification
    severity = models.CharField(max_length=20, choices=Severity.choices, db_index=True)
    error_type = models.CharField(max_length=50, choices=ErrorType.choices, db_index=True)

    # Error Details
    error_code = models.CharField(max_length=50, blank=True, db_index=True)
    error_message = models.TextField()
    exception_type = models.CharField(max_length=200, blank=True)  # e.g., ValueError, KeyError

    # Stack Trace
    stack_trace = models.TextField(blank=True)

    # Context
    module = models.CharField(max_length=200, blank=True)  # Python module where error occurred
    function = models.CharField(max_length=200, blank=True)  # Function where error occurred
    line_number = models.PositiveIntegerField(null=True, blank=True)

    # User Information (if applicable)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_errors'
    )
    username = models.CharField(max_length=150, blank=True)

    # Request Information
    request_method = models.CharField(max_length=10, blank=True)
    request_path = models.CharField(max_length=500, blank=True, db_index=True)
    request_data = models.JSONField(null=True, blank=True)  # Request parameters

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Additional Context
    metadata = models.JSONField(null=True, blank=True)

    # Resolution
    is_resolved = models.BooleanField(default=False, db_index=True)
    resolved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_errors'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)

    # Occurrence Tracking
    occurrence_count = models.PositiveIntegerField(default=1)  # How many times this error occurred
    first_occurred_at = models.DateTimeField(auto_now_add=True)
    last_occurred_at = models.DateTimeField(auto_now=True)

    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'system_errors'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['severity', '-timestamp']),
            models.Index(fields=['error_type', '-timestamp']),
            models.Index(fields=['is_resolved', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['error_code']),
        ]
        verbose_name = 'System Error'
        verbose_name_plural = 'System Errors'

    def __str__(self):
        return f"{self.get_severity_display()} - {self.error_message[:50]} at {self.timestamp}"


class ImportExportLog(models.Model):
    """Logging for data import and export operations"""

    class Operation(models.TextChoices):
        IMPORT = 'IMPORT', 'Import'
        EXPORT = 'EXPORT', 'Export'

    class Status(models.TextChoices):
        INITIATED = 'INITIATED', 'Initiated'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED', 'Partially Completed'

    class Format(models.TextChoices):
        CSV = 'CSV', 'CSV'
        EXCEL = 'EXCEL', 'Excel (XLSX)'
        JSON = 'JSON', 'JSON'
        XML = 'XML', 'XML'
        PDF = 'PDF', 'PDF'

    # Operation Details
    operation = models.CharField(max_length=20, choices=Operation.choices, db_index=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.INITIATED, db_index=True)

    # User Information
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='import_export_logs'
    )
    username = models.CharField(max_length=150)

    # Data Details
    model_name = models.CharField(max_length=100, db_index=True)
    file_format = models.CharField(max_length=20, choices=Format.choices)

    # File Information
    file_name = models.CharField(max_length=500)
    file_path = models.CharField(max_length=1000, blank=True)  # Storage path
    file_size = models.BigIntegerField(null=True, blank=True)  # Size in bytes

    # Processing Statistics
    total_records = models.PositiveIntegerField(default=0)
    successful_records = models.PositiveIntegerField(default=0)
    failed_records = models.PositiveIntegerField(default=0)
    skipped_records = models.PositiveIntegerField(default=0)

    # Errors and Warnings
    errors = models.JSONField(null=True, blank=True)  # List of errors
    warnings = models.JSONField(null=True, blank=True)  # List of warnings

    # Processing Details
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    # Filters and Parameters
    filters = models.JSONField(null=True, blank=True)  # Export filters
    options = models.JSONField(null=True, blank=True)  # Import/export options

    # Additional Information
    notes = models.TextField(blank=True)
    metadata = models.JSONField(null=True, blank=True)

    # Request Information
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'import_export_logs'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', '-started_at']),
            models.Index(fields=['operation', '-started_at']),
            models.Index(fields=['status', '-started_at']),
            models.Index(fields=['model_name', '-started_at']),
        ]
        verbose_name = 'Import/Export Log'
        verbose_name_plural = 'Import/Export Logs'

    def __str__(self):
        return f"{self.get_operation_display()} - {self.model_name} by {self.username} at {self.started_at}"

    @property
    def success_rate(self):
        """Calculate success rate percentage"""
        if self.total_records > 0:
            return (self.successful_records / self.total_records) * 100
        return 0
