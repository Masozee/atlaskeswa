from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Survey(models.Model):
    """Survey data collection for services with verification workflow"""

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    # Related Service
    service = models.ForeignKey(
        'directory.Service',
        on_delete=models.PROTECT,
        related_name='surveys'
    )

    # Survey Metadata
    survey_date = models.DateField(db_index=True)
    survey_period_start = models.DateField()
    survey_period_end = models.DateField()

    # GPS Location (captured during survey)
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="GPS latitude coordinate"
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="GPS longitude coordinate"
    )
    location_accuracy = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="GPS accuracy in meters"
    )

    # Surveyor Information
    surveyor = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='surveys_conducted',
        limit_choices_to={'role': 'SURVEYOR'}
    )
    surveyor_notes = models.TextField(blank=True)

    # Verification Workflow
    verification_status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True
    )
    assigned_verifier = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='surveys_to_verify',
        limit_choices_to={'role': 'VERIFIER'}
    )
    verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='surveys_verified',
        limit_choices_to={'role': 'VERIFIER'}
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verifier_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    # Service Data (Snapshot at survey time)
    # Capacity
    current_bed_capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    beds_occupied = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )

    # Staffing
    current_staff_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    current_psychiatrist_count = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    current_psychologist_count = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    current_nurse_count = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    current_social_worker_count = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Service Utilization
    total_patients_served = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    new_patients = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    returning_patients = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Patient Demographics
    patients_male = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    patients_female = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    patients_age_0_17 = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    patients_age_18_64 = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    patients_age_65_plus = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Quality Indicators
    patient_satisfaction_score = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    average_wait_time_days = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )

    # Financial Data
    monthly_budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    bpjs_patients = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    private_insurance_patients = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    self_pay_patients = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Additional Information
    challenges_faced = models.TextField(blank=True)
    improvements_needed = models.TextField(blank=True)
    additional_notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'surveys'
        ordering = ['-survey_date']
        indexes = [
            models.Index(fields=['service', '-survey_date']),
            models.Index(fields=['surveyor', '-survey_date']),
            models.Index(fields=['verification_status', '-survey_date']),
            models.Index(fields=['assigned_verifier', 'verification_status']),
        ]
        unique_together = [['service', 'survey_date']]

    def __str__(self):
        return f"Survey for {self.service.name} on {self.survey_date}"

    @property
    def occupancy_rate(self):
        """Calculate bed occupancy rate"""
        if self.current_bed_capacity and self.current_bed_capacity > 0:
            return (self.beds_occupied / self.current_bed_capacity) * 100
        return None

    @property
    def total_professional_staff(self):
        """Total count of professional staff at survey time"""
        return (
            self.current_psychiatrist_count +
            self.current_psychologist_count +
            self.current_nurse_count +
            self.current_social_worker_count
        )


class SurveyAttachment(models.Model):
    """File attachments for surveys (photos, documents)"""

    class AttachmentType(models.TextChoices):
        PHOTO = 'PHOTO', 'Photo'
        DOCUMENT = 'DOCUMENT', 'Document'
        OTHER = 'OTHER', 'Other'

    survey = models.ForeignKey(
        Survey,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(upload_to='survey_attachments/%Y/%m/')
    attachment_type = models.CharField(
        max_length=20,
        choices=AttachmentType.choices,
        default=AttachmentType.PHOTO
    )
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'survey_attachments'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.get_attachment_type_display()} for Survey #{self.survey_id}"


class SurveyAuditLog(models.Model):
    """Audit trail for survey changes and verification workflow"""

    class Action(models.TextChoices):
        CREATED = 'CREATED', 'Created'
        UPDATED = 'UPDATED', 'Updated'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        ASSIGNED = 'ASSIGNED', 'Assigned to Verifier'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'
        RESUBMITTED = 'RESUBMITTED', 'Resubmitted'

    survey = models.ForeignKey(
        Survey,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True
    )
    previous_status = models.CharField(
        max_length=20,
        choices=Survey.Status.choices,
        blank=True
    )
    new_status = models.CharField(
        max_length=20,
        choices=Survey.Status.choices,
        blank=True
    )
    changes = models.JSONField(null=True, blank=True)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'survey_audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['survey', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.get_action_display()} - Survey #{self.survey_id} at {self.timestamp}"
