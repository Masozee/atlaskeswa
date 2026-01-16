from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class SystemSettings(models.Model):
    """Global system settings - singleton model"""

    # Application Settings
    app_name = models.CharField(max_length=100, default='Yakkum')
    app_description = models.TextField(blank=True)
    app_logo = models.ImageField(upload_to='settings/', blank=True, null=True)
    app_favicon = models.ImageField(upload_to='settings/', blank=True, null=True)

    # Email Settings
    email_notifications_enabled = models.BooleanField(default=True)
    email_from_address = models.EmailField(default='noreply@yakkum.id')
    email_from_name = models.CharField(max_length=100, default='Yakkum')

    # Security Settings
    session_timeout = models.IntegerField(
        default=30,
        validators=[MinValueValidator(5), MaxValueValidator(1440)],
        help_text='Session timeout in minutes (5-1440)'
    )
    password_min_length = models.IntegerField(
        default=8,
        validators=[MinValueValidator(6), MaxValueValidator(32)]
    )
    require_email_verification = models.BooleanField(default=False)
    enable_two_factor_auth = models.BooleanField(default=False)

    # Data & Privacy Settings
    data_retention_days = models.IntegerField(
        default=365,
        validators=[MinValueValidator(30), MaxValueValidator(3650)],
        help_text='Number of days to retain data (30-3650)'
    )
    enable_audit_logs = models.BooleanField(default=True)

    # Survey Settings
    survey_auto_approval = models.BooleanField(
        default=False,
        help_text='Auto-approve surveys without verification'
    )
    survey_draft_expiry_days = models.IntegerField(
        default=30,
        validators=[MinValueValidator(7), MaxValueValidator(180)]
    )

    # Pagination Settings
    default_page_size = models.IntegerField(
        default=10,
        validators=[MinValueValidator(5), MaxValueValidator(100)]
    )
    max_page_size = models.IntegerField(
        default=100,
        validators=[MinValueValidator(10), MaxValueValidator(500)]
    )

    # Maintenance Mode
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.TextField(
        blank=True,
        default='System is under maintenance. Please try again later.'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='settings_updates'
    )

    class Meta:
        db_table = 'system_settings'
        verbose_name = 'System Settings'
        verbose_name_plural = 'System Settings'

    def save(self, *args, **kwargs):
        """Ensure only one instance exists (singleton pattern)"""
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """Load settings, create if doesn't exist"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"System Settings - {self.app_name}"
