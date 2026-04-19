from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import (
    Survey, SurveyAttachment, SurveyAuditLog,
    GeographicUnit, SurveyTemplate, QuestionSection, Question,
    QuestionChoice, DynamicSurveyResponse, QuestionAnswer
)
from .resources import QuestionChoiceResource


# =============================================================================
# GEOGRAPHIC UNITS ADMIN
# =============================================================================

@admin.register(GeographicUnit)
class GeographicUnitAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'level', 'parent', 'is_active')
    list_filter = ('level', 'is_active')
    search_fields = ('code', 'name')
    ordering = ('level', 'code')
    raw_id_fields = ('parent',)


# =============================================================================
# DYNAMIC QUESTIONNAIRE ADMIN
# =============================================================================

class QuestionSectionInline(admin.TabularInline):
    model = QuestionSection
    extra = 1
    ordering = ('order',)


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    ordering = ('order',)
    fields = ('code', 'question_text', 'answer_type', 'is_required', 'order')


class QuestionChoiceInline(admin.TabularInline):
    model = QuestionChoice
    extra = 3
    ordering = ('order',)


class QuestionAnswerInline(admin.TabularInline):
    model = QuestionAnswer
    extra = 0
    readonly_fields = ('question', 'created_at')
    can_delete = False


@admin.register(SurveyTemplate)
class SurveyTemplateAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'template_type', 'target_mtc', 'version', 'is_active', 'created_at')
    list_filter = ('template_type', 'is_active')
    search_fields = ('code', 'name', 'description')
    ordering = ('template_type', 'code')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [QuestionSectionInline]
    raw_id_fields = ('target_mtc', 'created_by')

    fieldsets = (
        ('Template Information', {
            'fields': ('code', 'name', 'description', 'version')
        }),
        ('Classification', {
            'fields': ('template_type', 'target_mtc')
        }),
        ('Status', {
            'fields': ('is_active', 'created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(QuestionSection)
class QuestionSectionAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'template', 'order')
    list_filter = ('template',)
    search_fields = ('code', 'name')
    ordering = ('template', 'order')
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('code', 'section', 'answer_type', 'is_required', 'mtc_code', 'order')
    list_filter = ('answer_type', 'is_required', 'section__template')
    search_fields = ('code', 'question_text', 'keterangan')
    ordering = ('section', 'order')
    raw_id_fields = ('mtc_code',)
    inlines = [QuestionChoiceInline]

    fieldsets = (
        ('Question Information', {
            'fields': ('section', 'code', 'question_text', 'order')
        }),
        ('Answer Configuration', {
            'fields': ('answer_type', 'is_required', 'validation_rules')
        }),
        ('DESDE-LTC Integration', {
            'fields': ('mtc_code', 'desde_ltc_description')
        }),
        ('Help Text', {
            'fields': ('keterangan',)
        }),
        ('Logic', {
            'fields': ('show_condition', 'skip_logic'),
            'classes': ('collapse',)
        }),
    )


@admin.register(QuestionChoice)
class QuestionChoiceAdmin(ImportExportModelAdmin):
    resource_classes = [QuestionChoiceResource]
    list_display = ('question', 'value', 'label', 'mtc_code', 'bsic', 'order', 'has_other_input')
    list_filter = ('has_other_input', 'question__section__template')
    search_fields = ('value', 'label', 'question__code')
    ordering = ('question', 'order')
    raw_id_fields = ('question', 'mtc_code', 'bsic')


@admin.register(DynamicSurveyResponse)
class DynamicSurveyResponseAdmin(admin.ModelAdmin):
    list_display = ('template', 'service', 'survey_date', 'surveyor', 'verification_status', 'created_at')
    list_filter = ('verification_status', 'template', 'survey_date')
    search_fields = ('service__name', 'surveyor__username', 'surveyor_notes')
    ordering = ('-survey_date',)
    readonly_fields = ('created_at', 'updated_at', 'submitted_at', 'verified_at')
    raw_id_fields = ('template', 'linked_survey', 'service', 'surveyor', 'assigned_verifier', 'verified_by')
    inlines = [QuestionAnswerInline]
    filter_horizontal = ('derived_mtc_codes',)

    fieldsets = (
        ('Response Information', {
            'fields': ('template', 'linked_survey', 'service', 'survey_date')
        }),
        ('Surveyor', {
            'fields': ('surveyor', 'surveyor_notes')
        }),
        ('Verification Workflow', {
            'fields': ('verification_status', 'assigned_verifier', 'verified_by', 'verified_at', 'verifier_notes', 'rejection_reason')
        }),
        ('GPS Location', {
            'fields': ('latitude', 'longitude', 'location_accuracy'),
            'classes': ('collapse',)
        }),
        ('Derived MTC Codes', {
            'fields': ('derived_mtc_codes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'submitted_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(QuestionAnswer)
class QuestionAnswerAdmin(admin.ModelAdmin):
    list_display = ('response', 'question', 'get_answer_preview', 'derived_mtc', 'created_at')
    list_filter = ('question__answer_type', 'response__template')
    search_fields = ('response__service__name', 'question__code', 'text_value')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('response', 'question', 'geographic_unit', 'derived_mtc')
    filter_horizontal = ('selected_choices',)

    def get_answer_preview(self, obj):
        """Show a preview of the answer value"""
        if obj.text_value:
            return obj.text_value[:50] + '...' if len(obj.text_value) > 50 else obj.text_value
        if obj.number_value is not None:
            return str(obj.number_value)
        if obj.boolean_value is not None:
            return 'Ya' if obj.boolean_value else 'Tidak'
        if obj.date_value:
            return str(obj.date_value)
        if obj.coverage_level:
            return obj.get_coverage_level_display()
        return '-'
    get_answer_preview.short_description = 'Answer'


# =============================================================================
# EXISTING STRUCTURED SURVEY ADMIN
# =============================================================================

class SurveyAttachmentInline(admin.TabularInline):
    model = SurveyAttachment
    extra = 0
    readonly_fields = ('uploaded_by', 'uploaded_at')


class SurveyAuditLogInline(admin.TabularInline):
    model = SurveyAuditLog
    extra = 0
    readonly_fields = ('action', 'user', 'previous_status', 'new_status', 'changes', 'notes', 'timestamp')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ('service', 'survey_date', 'surveyor', 'verification_status', 'assigned_verifier', 'created_at')
    list_filter = ('verification_status', 'survey_date', 'created_at')
    search_fields = ('service__name', 'surveyor__username', 'surveyor_notes', 'verifier_notes')
    ordering = ('-survey_date',)
    readonly_fields = ('created_at', 'updated_at', 'submitted_at', 'verified_at')
    inlines = [SurveyAttachmentInline, SurveyAuditLogInline]

    fieldsets = (
        ('Survey Information', {
            'fields': ('service', 'survey_date', 'survey_period_start', 'survey_period_end', 'surveyor', 'surveyor_notes')
        }),
        ('Verification Workflow', {
            'fields': ('verification_status', 'assigned_verifier', 'verified_by', 'verified_at', 'verifier_notes', 'rejection_reason')
        }),
        ('Capacity Data', {
            'fields': ('current_bed_capacity', 'beds_occupied')
        }),
        ('Staffing Data', {
            'fields': ('current_staff_count', 'current_psychiatrist_count', 'current_psychologist_count', 'current_nurse_count', 'current_social_worker_count')
        }),
        ('Service Utilization', {
            'fields': ('total_patients_served', 'new_patients', 'returning_patients')
        }),
        ('Patient Demographics', {
            'fields': ('patients_male', 'patients_female', 'patients_age_0_17', 'patients_age_18_64', 'patients_age_65_plus')
        }),
        ('Quality Indicators', {
            'fields': ('patient_satisfaction_score', 'average_wait_time_days')
        }),
        ('Financial Data', {
            'fields': ('monthly_budget', 'bpjs_patients', 'private_insurance_patients', 'self_pay_patients')
        }),
        ('Additional Information', {
            'fields': ('challenges_faced', 'improvements_needed', 'additional_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'submitted_at')
        }),
    )


@admin.register(SurveyAttachment)
class SurveyAttachmentAdmin(admin.ModelAdmin):
    list_display = ('survey', 'attachment_type', 'description', 'uploaded_by', 'uploaded_at')
    list_filter = ('attachment_type', 'uploaded_at')
    search_fields = ('survey__service__name', 'description')
    readonly_fields = ('uploaded_by', 'uploaded_at')
    ordering = ('-uploaded_at',)


@admin.register(SurveyAuditLog)
class SurveyAuditLogAdmin(admin.ModelAdmin):
    list_display = ('survey', 'action', 'user', 'previous_status', 'new_status', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('survey__service__name', 'user__username', 'notes')
    readonly_fields = ('survey', 'action', 'user', 'previous_status', 'new_status', 'changes', 'notes', 'timestamp')
    ordering = ('-timestamp',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
