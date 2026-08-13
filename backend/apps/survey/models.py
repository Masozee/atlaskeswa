from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


# =============================================================================
# GEOGRAPHIC UNITS
# =============================================================================

class GeographicUnit(models.Model):
    """Indonesian administrative geographic units for dropdown selections"""

    class Level(models.TextChoices):
        PROVINSI = 'PROVINSI', 'Provinsi'
        KABUPATEN_KOTA = 'KABUPATEN_KOTA', 'Kabupaten/Kota'
        KECAMATAN = 'KECAMATAN', 'Kecamatan'
        DESA_KELURAHAN = 'DESA_KELURAHAN', 'Desa/Kelurahan'

    # BPS code (Badan Pusat Statistik)
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    level = models.CharField(max_length=20, choices=Level.choices, db_index=True)

    # Hierarchy
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )

    # Center coordinates (for map display)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=7, null=True, blank=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'geographic_units'
        ordering = ['level', 'name']
        indexes = [
            models.Index(fields=['level', 'parent']),
            models.Index(fields=['parent', 'name']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_level_display()})"

    def get_full_path(self):
        """Returns full path like 'Jawa Tengah > Kebumen > Gombong > Gombong'"""
        parts = [self.name]
        current = self.parent
        while current:
            parts.insert(0, current.name)
            current = current.parent
        return ' > '.join(parts)


# =============================================================================
# DYNAMIC QUESTIONNAIRE MODELS
# =============================================================================

class SurveyTemplate(models.Model):
    """Template for dynamic questionnaires - complements the structured Survey model"""

    TEMPLATE_TYPES = [
        ('RESIDENTIAL', 'Rawat Inap (R)'),
        ('DAY_CARE', 'Rawat Harian (D)'),
        ('OUTPATIENT', 'Rawat Jalan (O)'),
        ('ACCESSIBILITY', 'Aksesibilitas (A)'),
        ('INFORMATION', 'Informasi (I)'),
        ('BASIC_DATA', 'Data Dasar'),
        ('GENERAL', 'Umum'),
    ]

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    version = models.CharField(max_length=20, default="1.0")

    # Which MTC codes does this template help determine?
    target_mtc = models.ForeignKey(
        'directory.MainTypeOfCare',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='survey_templates',
        help_text='The MTC type this template helps classify (R, D, O, A, I)'
    )
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES, default='GENERAL')

    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'survey_templates'
        ordering = ['template_type', 'name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class QuestionSection(models.Model):
    """Sections to group questions within a template"""

    template = models.ForeignKey(
        SurveyTemplate,
        on_delete=models.CASCADE,
        related_name='sections'
    )

    code = models.CharField(max_length=50)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    # Introduction text for enumerator
    introduction_text = models.TextField(blank=True)

    # Conditional display
    show_condition = models.JSONField(
        null=True,
        blank=True,
        help_text='JSON condition: {"question_code": "Q3", "operator": "equals", "value": "KESEHATAN"}'
    )

    class Meta:
        db_table = 'survey_question_sections'
        ordering = ['template', 'order']
        unique_together = ['template', 'code']

    def __str__(self):
        return f"{self.template.code} - {self.name}"


class Question(models.Model):
    """Individual survey questions with DESDE-LTC integration"""

    class AnswerType(models.TextChoices):
        # Basic types
        TEXT = 'TEXT', 'Teks'
        TEXTAREA = 'TEXTAREA', 'Teks Panjang'
        NUMBER = 'NUMBER', 'Angka'
        INTEGER = 'INTEGER', 'Bilangan Bulat'
        DATE = 'DATE', 'Tanggal'
        TIME = 'TIME', 'Waktu'
        BOOLEAN = 'BOOLEAN', 'Ya/Tidak'

        # Choice types
        SINGLE_CHOICE = 'SINGLE_CHOICE', 'Pilihan Tunggal'
        MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', 'Pilihan Ganda'

        # Geographic types (cascading dropdowns)
        GEO_PROVINSI = 'GEO_PROVINSI', 'Pilih Provinsi'
        GEO_KABUPATEN = 'GEO_KABUPATEN', 'Pilih Kabupaten/Kota'
        GEO_KECAMATAN = 'GEO_KECAMATAN', 'Pilih Kecamatan'
        GEO_DESA = 'GEO_DESA', 'Pilih Desa/Kelurahan'
        GEO_FULL = 'GEO_FULL', 'Alamat Lengkap (Provinsi s/d Desa)'

        # Coverage level (for Q16-type questions)
        COVERAGE_LEVEL = 'COVERAGE_LEVEL', 'Tingkat Cakupan Wilayah'

        # Contact types
        PHONE = 'PHONE', 'Nomor Telepon'
        EMAIL = 'EMAIL', 'Email'
        URL = 'URL', 'Website'

        # Special types
        FILE = 'FILE', 'Upload File'
        GPS = 'GPS', 'Koordinat GPS'

        # Composite/Table types
        STAFF_TABLE = 'STAFF_TABLE', 'Tabel Data Staf'
        DIAGNOSIS_TABLE = 'DIAGNOSIS_TABLE', 'Tabel Diagnosis'
        REPEATING_TABLE = 'REPEATING_TABLE', 'Tabel Dinamis (baris berulang)'
        INTERVENTION_MATRIX = 'INTERVENTION_MATRIX', 'Matriks Intervensi (baris pilih + kolom detail)'

        # Operating hours / schedule table (e.g. "Senin 09:00-22:00")
        OPERATING_HOURS = 'OPERATING_HOURS', 'Tabel Jadwal'

        # Activity schedule table (custom kegiatan with start/end time)
        KEGIATAN_TABLE = 'KEGIATAN_TABLE', 'Tabel Kegiatan'

        # Matrix kegiatan: table with activity name and day(s) multi-select
        MATRIX_KEGIATAN = 'MATRIX_KEGIATAN', 'Matrix Kegiatan'

    section = models.ForeignKey(
        QuestionSection,
        on_delete=models.CASCADE,
        related_name='questions'
    )

    # Question identification
    code = models.CharField(max_length=50, db_index=True)
    question_text = models.TextField()

    # Answer configuration
    answer_type = models.CharField(max_length=30, choices=AnswerType.choices)
    is_required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    # DESDE-LTC Integration - Link to existing MTC model
    mtc_code = models.ForeignKey(
        'directory.MainTypeOfCare',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='questions',
        help_text='The MTC code this question helps determine'
    )
    desde_ltc_description = models.TextField(
        blank=True,
        help_text='DESDE-LTC specific description for this question'
    )

    # Introduction text (preamble shown before this question)
    introduction_text = models.TextField(blank=True, help_text='Contextual text displayed above this question')

    # Keterangan (Help text / Instructions for enumerator)
    keterangan = models.TextField(blank=True, help_text='Detailed explanation/instructions')

    # Validation rules
    validation_rules = models.JSONField(
        null=True,
        blank=True,
        help_text='JSON: {"min": 0, "max": 100, "pattern": "regex", "max_length": 500}'
    )

    # Conditional logic - when to show this question
    show_condition = models.JSONField(
        null=True,
        blank=True,
        help_text='JSON: {"question_code": "Q2", "operator": "equals", "value": "YA"}'
    )

    # Skip logic - where to go after answering
    skip_logic = models.JSONField(
        null=True,
        blank=True,
        help_text='JSON: [{"value": "YA", "goto": "RQ2"}, {"value": "TIDAK", "goto": "RQ5"}]'
    )

    # Table configuration for REPEATING_TABLE type
    table_config = models.JSONField(
        null=True,
        blank=True,
        help_text='JSON: {"columns": [{"code": "jabatan", "label": "Jabatan", "type": "text"}, {"code": "l", "label": "L", "type": "number"}]}'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'survey_questions'
        ordering = ['section', 'order']
        unique_together = ['section', 'code']

    def __str__(self):
        return f"{self.code}: {self.question_text[:50]}"


class QuestionChoice(models.Model):
    """Choices for single/multiple choice questions"""

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='choices'
    )

    value = models.CharField(max_length=100)
    label = models.TextField()
    order = models.PositiveIntegerField(default=0)

    # Link choice to BSIC code (from categories page)
    mtc_code = models.ForeignKey(
        'directory.BasicStableInputsOfCare',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='question_choices',
        help_text='BSIC code derived when this choice is selected'
    )

    # Keterangan for this specific choice
    keterangan = models.TextField(blank=True)

    # Skip logic for this choice
    next_question_code = models.CharField(max_length=50, blank=True)

    # If selecting this requires additional text input ("Lainnya, sebutkan...")
    has_other_input = models.BooleanField(default=False)
    other_input_label = models.CharField(max_length=100, blank=True, default='Sebutkan')
    OTHER_INPUT_TYPES = [
        ('text', 'Text'),
        ('date', 'Date'),
        ('integer', 'Integer'),
        ('decimal', 'Decimal'),
        ('phone', 'Phone'),
        ('email', 'Email'),
    ]
    other_input_type = models.CharField(
        max_length=20,
        blank=True,
        default='text',
        choices=OTHER_INPUT_TYPES,
        help_text='Data type for other input'
    )

    # DESDE-LTC classification fields
    cabang_mtc = models.CharField(max_length=50, blank=True, help_text='Cabang MTC')
    kode_desde_ltc = models.CharField(max_length=20, blank=True, help_text='Kode DESDE-LTC (e.g. R.1.1.3)')
    bsic = models.ForeignKey(
        'directory.BasicStableInputsOfCare',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bsic_question_choices',
        help_text='BSIC terkait pilihan ini'
    )

    class Meta:
        db_table = 'survey_question_choices'
        ordering = ['question', 'order']

    def __str__(self):
        return f"{self.question.code} - {self.label[:30]}"


class NotDeletedManager(models.Manager):
    """Default manager for soft-deletable models: hides trashed rows.

    Any queryset that forgets to filter on ``deleted_at`` fails safe by
    excluding trashed rows. Use ``all_objects`` to reach them (trash bin
    endpoints, Django admin, restore).
    """

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class DynamicSurveyResponse(models.Model):
    """
    Dynamic survey response - extends the concept of existing Survey model.
    Can be linked to an existing Survey for additional dynamic questions,
    or used standalone for pure dynamic questionnaires.

    Soft delete: ``delete()`` on this model is a real delete. Deleting through
    the API stamps ``deleted_at``/``deleted_by`` instead, which moves the row to
    the trash bin (see ``soft_delete``/``restore``).
    """

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draf'
        SUBMITTED = 'SUBMITTED', 'Diajukan'
        VERIFIED = 'VERIFIED', 'Terverifikasi'
        REJECTED = 'REJECTED', 'Ditolak'

    template = models.ForeignKey(
        SurveyTemplate,
        on_delete=models.PROTECT,
        related_name='responses'
    )

    # Link to existing Survey (optional - for extending structured surveys)
    linked_survey = models.ForeignKey(
        'Survey',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dynamic_responses',
        help_text='Link to structured survey if this extends it'
    )

    # Or link directly to Service (if standalone)
    service = models.ForeignKey(
        'directory.Service',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='dynamic_survey_responses'
    )

    # Surveyor info - same pattern as existing Survey model
    surveyor = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='dynamic_surveys_conducted',
        limit_choices_to={'role': 'SURVEYOR'}
    )
    survey_date = models.DateTimeField(db_index=True)
    surveyor_notes = models.TextField(blank=True)

    # Verification workflow - same pattern as existing Survey model
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
        related_name='dynamic_surveys_to_verify',
        limit_choices_to={'role': 'VERIFIER'}
    )
    verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dynamic_surveys_verified'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verifier_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    # Deletion request workflow
    deletion_requested = models.BooleanField(default=False, db_index=True)
    deletion_requested_at = models.DateTimeField(null=True, blank=True)
    deletion_requested_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deletion_requests_made'
    )
    deletion_reason = models.TextField(blank=True)

    # Soft delete (trash bin) - null means the response is live
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dynamic_surveys_deleted'
    )

    # GPS - same pattern as existing Survey model
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=7, null=True, blank=True)
    location_accuracy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Derived DESDE-LTC codes based on answers (ManyToMany to existing MTC)
    derived_mtc_codes = models.ManyToManyField(
        'directory.MainTypeOfCare',
        blank=True,
        related_name='derived_from_responses',
        help_text='MTC codes derived from questionnaire answers'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True, help_text='When the surveyor actually started filling out questions')
    submitted_at = models.DateTimeField(null=True, blank=True)

    # Declared first, so it is the default manager: every normal queryset,
    # reverse relation and filter excludes trashed rows.
    objects = NotDeletedManager()
    # Escape hatch for the trash bin, restore and Django admin.
    all_objects = models.Manager()

    class Meta:
        db_table = 'dynamic_survey_responses'
        ordering = ['-survey_date']
        indexes = [
            models.Index(fields=['template', '-survey_date']),
            models.Index(fields=['surveyor', '-survey_date']),
            models.Index(fields=['verification_status', '-survey_date']),
        ]

    def __str__(self):
        return f"Response to {self.template.code} on {self.survey_date}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self, user=None):
        """Move this response to the trash bin. Answers and photos are kept."""
        self.deleted_at = timezone.now()
        self.deleted_by = user if user and user.is_authenticated else None
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])

    def restore(self):
        """Bring this response back out of the trash bin.

        Clears the deletion-request flags too, otherwise a restored response
        immediately reappears in the verifier's deletion queue.
        """
        self.deleted_at = None
        self.deleted_by = None
        self.deletion_requested = False
        self.deletion_requested_at = None
        self.deletion_requested_by = None
        self.deletion_reason = ''
        self.save(update_fields=[
            'deleted_at', 'deleted_by', 'deletion_requested',
            'deletion_requested_at', 'deletion_requested_by',
            'deletion_reason', 'updated_at',
        ])


class QuestionAnswer(models.Model):
    """Individual answers to questions"""

    COVERAGE_CHOICES = [
        ('DESA_KELURAHAN', 'Desa/Kelurahan'),
        ('KECAMATAN', 'Kecamatan'),
        ('KABUPATEN_KOTA', 'Kabupaten/Kota'),
        ('PROVINSI', 'Provinsi'),
        ('NASIONAL', 'Nasional'),
    ]

    response = models.ForeignKey(
        DynamicSurveyResponse,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='answers'
    )

    # Answer values - use appropriate field based on question type
    text_value = models.TextField(blank=True)
    number_value = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    date_value = models.DateField(null=True, blank=True)
    time_value = models.TimeField(null=True, blank=True)
    boolean_value = models.BooleanField(null=True)

    # For choice questions - link to actual choices
    selected_choices = models.ManyToManyField(
        QuestionChoice,
        blank=True,
        related_name='selected_in_answers'
    )
    other_text = models.TextField(blank=True, help_text='For "Lainnya, sebutkan" answers')

    # For geographic questions - link to GeographicUnit
    geographic_unit = models.ForeignKey(
        GeographicUnit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='answers'
    )

    # For coverage level questions
    coverage_level = models.CharField(max_length=20, blank=True, choices=COVERAGE_CHOICES)

    # For file uploads
    file = models.FileField(upload_to='survey_answers/%Y/%m/', null=True, blank=True)

    # For GPS coordinates
    gps_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    gps_longitude = models.DecimalField(max_digits=11, decimal_places=7, null=True, blank=True)

    # For complex table data (staff, diagnosis, etc.)
    table_data = models.JSONField(null=True, blank=True)

    # Derived MTC code from this specific answer
    derived_mtc = models.ForeignKey(
        'directory.MainTypeOfCare',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='derived_from_answers',
        help_text='MTC code derived from this answer'
    )

    # MTC context for repeated detail questions (e.g. "R2", "R3.1.1")
    context_key = models.CharField(
        max_length=50, blank=True, default='',
        help_text='MTC context code for repeated detail questions (e.g. "R2", "R3.1.1")'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'survey_question_answers'
        unique_together = [['response', 'question', 'context_key']]
        ordering = ['response', 'question__section__order', 'question__order']

    def __str__(self):
        return f"Answer to {self.question.code} in Response #{self.response_id}"


# =============================================================================
# EXISTING STRUCTURED SURVEY MODELS
# =============================================================================

class Survey(models.Model):
    """Survey data collection for services with verification workflow"""

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draf'
        SUBMITTED = 'SUBMITTED', 'Diajukan'
        VERIFIED = 'VERIFIED', 'Terverifikasi'
        REJECTED = 'REJECTED', 'Ditolak'

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
        PHOTO = 'PHOTO', 'Foto'
        DOCUMENT = 'DOCUMENT', 'Dokumen'
        OTHER = 'OTHER', 'Lainnya'

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
        CREATED = 'CREATED', 'Dibuat'
        UPDATED = 'UPDATED', 'Diperbarui'
        SUBMITTED = 'SUBMITTED', 'Diajukan'
        ASSIGNED = 'ASSIGNED', 'Ditugaskan ke Verifikator'
        VERIFIED = 'VERIFIED', 'Diverifikasi'
        REJECTED = 'REJECTED', 'Ditolak'
        RESUBMITTED = 'RESUBMITTED', 'Diajukan Ulang'

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


# =============================================================================
# SURVEY PHOTOS (for DynamicSurveyResponse)
# =============================================================================

def survey_photo_upload_path(instance, filename):
    """Generate upload path: survey_photos/<survey_id>/<filename>"""
    ext = filename.split('.')[-1]
    new_filename = f"{instance.id or 'new'}_{timezone.now().strftime('%Y%m%d%H%M%S')}.{ext}"
    return f"survey_photos/{instance.survey_id}/{new_filename}"


class SurveyPhoto(models.Model):
    """Facility photos for DynamicSurveyResponse - added after survey completion"""

    survey = models.ForeignKey(
        DynamicSurveyResponse,
        on_delete=models.CASCADE,
        related_name='photos'
    )
    image = models.ImageField(upload_to=survey_photo_upload_path)
    caption = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_survey_photos'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'survey_photos'
        ordering = ['-uploaded_at']
        verbose_name = 'Survey Photo'
        verbose_name_plural = 'Survey Photos'

    def __str__(self):
        return f"Photo for Survey #{self.survey_id} - {self.caption[:30] or 'No caption'}"
