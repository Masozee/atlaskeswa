# Plan: Dynamic Questionnaire System for DESDE-LTC Survey

## Overview

Extend the existing survey system with a flexible, dynamic questionnaire that supports the DESDE-LTC classification framework. This plan builds upon and integrates with existing models rather than replacing them.

## Existing Models Analysis

### Currently Available (Keep As-Is)

| Model | Location | Purpose |
|-------|----------|---------|
| `Survey` | `apps/survey/models.py` | Structured survey with hardcoded fields (capacity, staffing, demographics) |
| `SurveyAttachment` | `apps/survey/models.py` | File attachments for surveys |
| `SurveyAuditLog` | `apps/survey/models.py` | Audit trail for survey changes |
| `MainTypeOfCare` | `apps/directory/models.py` | DESDE-LTC MTC classification hierarchy (R, D, O, A, I) |
| `BasicStableInputsOfCare` | `apps/directory/models.py` | DESDE-LTC BSIC classification |
| `Service` | `apps/directory/models.py` | Service directory with MTC/BSIC FKs |

### Key Observations

1. **Survey model** already has verification workflow, GPS, surveyor info - reuse this pattern
2. **MainTypeOfCare model** already stores DESDE-LTC codes with hierarchy (parent FK) - link questions to this
3. **Service model** links to MTC/BSIC - survey responses should also link to derived MTC codes

## New Models to Add

All new models go in `apps/survey/models.py` to extend the existing survey functionality.

### 1. SurveyTemplate (Kuesioner Template)

```python
class SurveyTemplate(models.Model):
    """Template for dynamic questionnaires - complements the structured Survey model"""

    name = models.CharField(max_length=200)  # e.g., "Kuesioner OMMHA - Kode R"
    code = models.CharField(max_length=50, unique=True, db_index=True)  # e.g., "OMMHA_R_V1"
    description = models.TextField(blank=True)
    version = models.CharField(max_length=20, default="1.0")

    # Which MTC codes does this template help determine?
    # e.g., Template for "R" questions links to the R-type MTC
    target_mtc = models.ForeignKey(
        'directory.MainTypeOfCare',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='survey_templates',
        help_text='The MTC type this template helps classify (R, D, O, A, I)'
    )

    # Template type based on existing MTC service_delivery_type
    TEMPLATE_TYPES = [
        ('RESIDENTIAL', 'Rawat Inap (R)'),
        ('DAY_CARE', 'Rawat Harian (D)'),
        ('OUTPATIENT', 'Rawat Jalan (O)'),
        ('ACCESSIBILITY', 'Aksesibilitas (A)'),
        ('INFORMATION', 'Informasi (I)'),
        ('BASIC_DATA', 'Data Dasar'),
        ('GENERAL', 'Umum'),
    ]
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES, default='GENERAL')

    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'survey_templates'
        ordering = ['template_type', 'name']

    def __str__(self):
        return f"{self.code} - {self.name}"
```

### 2. QuestionSection (Bagian Pertanyaan)

```python
class QuestionSection(models.Model):
    """Sections to group questions within a template"""

    template = models.ForeignKey(
        SurveyTemplate,
        on_delete=models.CASCADE,
        related_name='sections'
    )

    code = models.CharField(max_length=50)  # e.g., "DATA_DASAR", "LAYANAN_R"
    name = models.CharField(max_length=200)  # e.g., "Data Dasar", "Layanan Rawat Inap"
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

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
```

### 3. Question (Pertanyaan)

```python
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

    section = models.ForeignKey(
        QuestionSection,
        on_delete=models.CASCADE,
        related_name='questions'
    )

    # Question identification
    code = models.CharField(max_length=50, db_index=True)  # e.g., "Q1", "RQ1", "Q17A"
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'survey_questions'
        ordering = ['section', 'order']
        unique_together = ['section', 'code']

    def __str__(self):
        return f"{self.code}: {self.question_text[:50]}"
```

### 4. QuestionChoice (Pilihan Jawaban)

```python
class QuestionChoice(models.Model):
    """Choices for single/multiple choice questions"""

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='choices'
    )

    value = models.CharField(max_length=100)  # Internal value
    label = models.TextField()  # Display text
    order = models.PositiveIntegerField(default=0)

    # Link choice to MTC code (e.g., selecting "Akut 24 Jam Intensif" → R1)
    mtc_code = models.ForeignKey(
        'directory.MainTypeOfCare',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='question_choices',
        help_text='MTC code derived when this choice is selected'
    )

    # Keterangan for this specific choice
    keterangan = models.TextField(blank=True)

    # Skip logic for this choice
    next_question_code = models.CharField(max_length=50, blank=True)

    # If selecting this requires additional text input ("Lainnya, sebutkan...")
    has_other_input = models.BooleanField(default=False)
    other_input_label = models.CharField(max_length=100, blank=True, default='Sebutkan')

    class Meta:
        db_table = 'survey_question_choices'
        ordering = ['question', 'order']

    def __str__(self):
        return f"{self.question.code} - {self.label[:30]}"
```

### 5. DynamicSurveyResponse (Respon Survei Dinamis)

This model complements the existing `Survey` model for dynamic questionnaire responses.

```python
class DynamicSurveyResponse(models.Model):
    """
    Dynamic survey response - extends the concept of existing Survey model.
    Can be linked to an existing Survey for additional dynamic questions,
    or used standalone for pure dynamic questionnaires.
    """

    # Use same status choices as existing Survey model for consistency
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

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
    survey_date = models.DateField(db_index=True)
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
    submitted_at = models.DateTimeField(null=True, blank=True)

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
```

### 6. QuestionAnswer (Jawaban Pertanyaan)

```python
class QuestionAnswer(models.Model):
    """Individual answers to questions"""

    response = models.ForeignKey(
        DynamicSurveyResponse,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.PROTECT,
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
        'GeographicUnit',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='answers'
    )

    # For coverage level questions
    COVERAGE_CHOICES = [
        ('DESA_KELURAHAN', 'Desa/Kelurahan'),
        ('KECAMATAN', 'Kecamatan'),
        ('KABUPATEN_KOTA', 'Kabupaten/Kota'),
        ('PROVINSI', 'Provinsi'),
        ('NASIONAL', 'Nasional'),
    ]
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'survey_question_answers'
        unique_together = ['response', 'question']
        ordering = ['response', 'question__section__order', 'question__order']

    def __str__(self):
        return f"Answer to {self.question.code} in Response #{self.response_id}"
```

### 7. GeographicUnit (Wilayah Administratif)

```python
class GeographicUnit(models.Model):
    """Indonesian administrative geographic units for dropdown selections"""

    class Level(models.TextChoices):
        PROVINSI = 'PROVINSI', 'Provinsi'
        KABUPATEN_KOTA = 'KABUPATEN_KOTA', 'Kabupaten/Kota'
        KECAMATAN = 'KECAMATAN', 'Kecamatan'
        DESA_KELURAHAN = 'DESA_KELURAHAN', 'Desa/Kelurahan'

    # BPS code (Badan Pusat Statistik)
    code = models.CharField(max_length=20, unique=True, db_index=True)  # e.g., "33", "33.05", "33.05.01"
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
```

## Integration with Existing Models

### Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXISTING MODELS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐         ┌──────────────────┐                      │
│  │ MainTypeOfCare   │◄────────│ Service          │                      │
│  │ (MTC codes)      │         │                  │                      │
│  │ R, D, O, A, I    │         │ - mtc (FK)       │                      │
│  │ R1, R2, R3...    │         │ - bsic (FK)      │                      │
│  └────────┬─────────┘         └────────┬─────────┘                      │
│           │                            │                                 │
│           │ parent (self-ref)          │                                 │
│           ▼                            │                                 │
│  ┌──────────────────┐                  │                                 │
│  │ Survey           │◄─────────────────┘                                │
│  │ (Structured)     │                                                    │
│  │ - service (FK)   │                                                    │
│  │ - surveyor       │                                                    │
│  │ - status         │                                                    │
│  │ - hardcoded      │                                                    │
│  │   fields         │                                                    │
│  └────────┬─────────┘                                                    │
│           │                                                              │
└───────────┼──────────────────────────────────────────────────────────────┘
            │
            │ linked_survey (optional)
            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          NEW MODELS                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐                                                    │
│  │ SurveyTemplate   │         ┌──────────────────┐                      │
│  │                  │◄────────│ QuestionSection  │                      │
│  │ - target_mtc(FK) │         │                  │                      │
│  │ - template_type  │         │ - template (FK)  │                      │
│  └────────┬─────────┘         └────────┬─────────┘                      │
│           │                            │                                 │
│           │                            ▼                                 │
│           │                   ┌──────────────────┐                      │
│           │                   │ Question         │                      │
│           │                   │                  │                      │
│           │                   │ - section (FK)   │                      │
│           │                   │ - mtc_code (FK)  │◄──── Links to MTC    │
│           │                   │ - answer_type    │                      │
│           │                   │ - keterangan     │                      │
│           │                   └────────┬─────────┘                      │
│           │                            │                                 │
│           │                            ▼                                 │
│           │                   ┌──────────────────┐                      │
│           │                   │ QuestionChoice   │                      │
│           │                   │                  │                      │
│           │                   │ - question (FK)  │                      │
│           │                   │ - mtc_code (FK)  │◄──── Links to MTC    │
│           │                   │ - keterangan     │                      │
│           │                   └──────────────────┘                      │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ DynamicSurveyResponse                                             │   │
│  │                                                                   │   │
│  │ - template (FK)                                                   │   │
│  │ - linked_survey (FK, optional) ────► Can extend existing Survey  │   │
│  │ - service (FK, optional)                                          │   │
│  │ - derived_mtc_codes (M2M) ─────────► MTC codes from answers      │   │
│  │ - surveyor, status, GPS... (same pattern as Survey)               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐         ┌──────────────────┐                      │
│  │ QuestionAnswer   │         │ GeographicUnit   │                      │
│  │                  │         │                  │                      │
│  │ - response (FK)  │         │ - code (BPS)     │                      │
│  │ - question (FK)  │────────►│ - parent (self)  │                      │
│  │ - derived_mtc    │         │ - level          │                      │
│  │ - geo_unit (FK)  │         │                  │                      │
│  └──────────────────┘         └──────────────────┘                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Why Separate `DynamicSurveyResponse` Instead of Extending `Survey`?

- **Existing Survey** has many hardcoded fields (bed_capacity, staff_count, patient demographics) that are specific to structured data collection
- **DynamicSurveyResponse** is fully flexible with JSON-based answers
- They can be **linked** via `linked_survey` FK when you want both structured + dynamic data
- This preserves backward compatibility with existing Survey data

### 2. MTC Code Integration

Questions and choices directly link to the existing `MainTypeOfCare` model:
- `Question.mtc_code` → which MTC this question helps determine
- `QuestionChoice.mtc_code` → specific MTC code when this choice is selected
- `DynamicSurveyResponse.derived_mtc_codes` → M2M to store all derived codes
- `QuestionAnswer.derived_mtc` → MTC code from individual answer

### 3. Geographic Units

- Separate `GeographicUnit` model for cascading dropdowns
- Follows Indonesian administrative hierarchy (Provinsi → Kabupaten/Kota → Kecamatan → Desa/Kelurahan)
- Uses BPS (Badan Pusat Statistik) codes for standardization
- `QuestionAnswer.geographic_unit` links to selected location

## Answer Types Summary

| Type | Description | Storage Field | Example Use |
|------|-------------|---------------|-------------|
| `TEXT` | Short text | `text_value` | Nama Fasilitas |
| `TEXTAREA` | Long text | `text_value` | Alamat, Keterangan |
| `NUMBER` | Decimal | `number_value` | Persentase |
| `INTEGER` | Whole number | `number_value` | Jumlah Tempat Tidur |
| `DATE` | Date | `date_value` | Tanggal Berdiri |
| `TIME` | Time | `time_value` | Jam Buka |
| `BOOLEAN` | Yes/No | `boolean_value` | Apakah tersedia? |
| `SINGLE_CHOICE` | Radio | `selected_choices` | Jenis Fasilitas |
| `MULTIPLE_CHOICE` | Checkbox | `selected_choices` | Layanan yang tersedia |
| `GEO_PROVINSI` | Province dropdown | `geographic_unit` | Pilih Provinsi |
| `GEO_KABUPATEN` | Regency dropdown | `geographic_unit` | Pilih Kabupaten |
| `GEO_KECAMATAN` | District dropdown | `geographic_unit` | Pilih Kecamatan |
| `GEO_DESA` | Village dropdown | `geographic_unit` | Pilih Desa |
| `GEO_FULL` | Full address cascade | `geographic_unit` | Alamat Lengkap |
| `COVERAGE_LEVEL` | Coverage selector | `coverage_level` | Q16 - Cakupan Wilayah |
| `PHONE` | Phone number | `text_value` | Nomor Telepon |
| `EMAIL` | Email | `text_value` | Email |
| `URL` | Website URL | `text_value` | Website |
| `FILE` | File upload | `file` | Dokumen pendukung |
| `GPS` | Coordinates | `gps_latitude`, `gps_longitude` | Lokasi GPS |
| `STAFF_TABLE` | Staff data table | `table_data` | Data staf per jabatan |
| `DIAGNOSIS_TABLE` | Diagnosis table | `table_data` | Data diagnosis pasien |

## Implementation Steps

### Phase 1: Models & Migrations

```bash
# In backend directory
1. Add new models to apps/survey/models.py
2. python manage.py makemigrations survey
3. python manage.py migrate
```

**Files to modify:**
- `backend/apps/survey/models.py` - Add 7 new models

### Phase 2: Admin Interface

**Files to create/modify:**
- `backend/apps/survey/admin.py` - Add admin classes for all new models

```python
# Inline editing for questions in sections
class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1

class QuestionChoiceInline(admin.TabularInline):
    model = QuestionChoice
    extra = 3

@admin.register(SurveyTemplate)
class SurveyTemplateAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'template_type', 'version', 'is_active']
    list_filter = ['template_type', 'is_active']
    search_fields = ['code', 'name']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['code', 'section', 'answer_type', 'is_required', 'mtc_code']
    list_filter = ['answer_type', 'section__template']
    search_fields = ['code', 'question_text']
    inlines = [QuestionChoiceInline]
```

### Phase 3: Seed Data

**Files to create:**
- `backend/seed/seed_geographic_units.py` - Populate Kebumen geographic data
- `backend/seed/seed_desde_ltc_template.py` - Create DESDE-LTC questionnaire template

### Phase 4: API Serializers & ViewSets

**Files to create:**
- `backend/apps/survey/serializers_dynamic.py` - Serializers for new models
- `backend/apps/survey/views_dynamic.py` - ViewSets with RBAC

### Phase 5: Frontend Components

**Files to create:**
- `frontend/components/survey/dynamic-survey-form.tsx` - Main form component
- `frontend/components/survey/question-types/` - Individual question type components
- `frontend/hooks/use-dynamic-survey.ts` - Survey state management
- `frontend/lib/survey-logic.ts` - Conditional logic engine

## Example: DESDE-LTC R (Residential) Template

```python
# seed/seed_desde_ltc_template.py

# Create template
template_r = SurveyTemplate.objects.create(
    code='OMMHA_R_V1',
    name='Kuesioner OMMHA - Layanan Rawat Inap (Kode R)',
    description='Kuesioner untuk mengklasifikasi layanan rawat inap kesehatan jiwa',
    version='1.0',
    template_type='RESIDENTIAL',
    target_mtc=MainTypeOfCare.objects.get(code='R'),
)

# Create section
section_r = QuestionSection.objects.create(
    template=template_r,
    code='LAYANAN_R',
    name='Layanan Rawat Inap',
    order=1,
)

# Create questions
q_r1 = Question.objects.create(
    section=section_r,
    code='RQ1',
    question_text='Apakah fasilitas ini menyediakan layanan rawat inap untuk pasien dengan gangguan jiwa?',
    answer_type=Question.AnswerType.SINGLE_CHOICE,
    is_required=True,
    mtc_code=MainTypeOfCare.objects.get(code='R'),
    keterangan='Layanan rawat inap adalah layanan kesehatan jiwa yang menyediakan tempat tinggal sementara...',
    order=1,
)

# Create choices with MTC code derivation
QuestionChoice.objects.create(
    question=q_r1,
    value='YA',
    label='Ya',
    order=1,
    next_question_code='RQ2',
)
QuestionChoice.objects.create(
    question=q_r1,
    value='TIDAK',
    label='Tidak',
    order=2,
    next_question_code='DQ1',  # Skip to Day Care questions
)
```

## Questions Resolved

1. **Geographic units stored as FK references** → Yes, using `GeographicUnit` model with FK in `QuestionAnswer`
2. **Multiple languages** → Not in initial scope, can add `translations` JSONField later
3. **Template versioning** → `version` field on `SurveyTemplate`, responses linked to specific template
4. **Offline mobile** → Future scope, design supports it via JSON sync

## Next Steps

After plan approval:
1. Implement models in `backend/apps/survey/models.py`
2. Create and run migrations
3. Set up Django admin
4. Create seed scripts for Kebumen geographic data
5. Create DESDE-LTC template seed script
