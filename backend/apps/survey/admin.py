from django.contrib import admin
from .models import Survey, SurveyAttachment, SurveyAuditLog


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
