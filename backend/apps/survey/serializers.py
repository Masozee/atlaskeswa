from rest_framework import serializers
from .models import Survey, SurveyAttachment, SurveyAuditLog
from apps.directory.serializers import ServiceListSerializer


class SurveyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for survey listing"""

    service_name = serializers.CharField(source='service.name', read_only=True)
    service_city = serializers.CharField(source='service.city', read_only=True)
    surveyor_name = serializers.SerializerMethodField()
    verifier_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    occupancy_rate = serializers.ReadOnlyField()

    class Meta:
        model = Survey
        fields = [
            'id', 'service', 'service_name', 'service_city', 'survey_date',
            'surveyor', 'surveyor_name', 'verification_status', 'status_display',
            'assigned_verifier', 'verifier_name', 'occupancy_rate',
            'total_patients_served', 'latitude', 'longitude', 'location_accuracy',
            'created_at'
        ]

    def get_surveyor_name(self, obj):
        return obj.surveyor.get_full_name() or obj.surveyor.email

    def get_verifier_name(self, obj):
        if obj.assigned_verifier:
            return obj.assigned_verifier.get_full_name() or obj.assigned_verifier.email
        return None


class SurveyDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for survey"""

    service = ServiceListSerializer(read_only=True)
    surveyor_name = serializers.SerializerMethodField()
    verifier_name = serializers.SerializerMethodField()
    verified_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    occupancy_rate = serializers.ReadOnlyField()
    total_professional_staff = serializers.ReadOnlyField()

    class Meta:
        model = Survey
        fields = [
            'id', 'service', 'survey_date', 'survey_period_start', 'survey_period_end',
            'latitude', 'longitude', 'location_accuracy',
            'surveyor', 'surveyor_name', 'surveyor_notes', 'verification_status',
            'status_display', 'assigned_verifier', 'verifier_name', 'verified_by',
            'verified_by_name', 'verified_at', 'verifier_notes', 'rejection_reason',
            'current_bed_capacity', 'beds_occupied', 'occupancy_rate',
            'current_staff_count', 'current_psychiatrist_count', 'current_psychologist_count',
            'current_nurse_count', 'current_social_worker_count', 'total_professional_staff',
            'total_patients_served', 'new_patients', 'returning_patients',
            'patients_male', 'patients_female', 'patients_age_0_17', 'patients_age_18_64',
            'patients_age_65_plus', 'patient_satisfaction_score', 'average_wait_time_days',
            'monthly_budget', 'bpjs_patients', 'private_insurance_patients', 'self_pay_patients',
            'challenges_faced', 'improvements_needed', 'additional_notes',
            'created_at', 'updated_at', 'submitted_at'
        ]
        read_only_fields = ['id', 'surveyor', 'verified_by', 'verified_at', 'created_at', 'updated_at', 'submitted_at']

    def get_surveyor_name(self, obj):
        return obj.surveyor.get_full_name() or obj.surveyor.email

    def get_verifier_name(self, obj):
        if obj.assigned_verifier:
            return obj.assigned_verifier.get_full_name() or obj.assigned_verifier.email
        return None

    def get_verified_by_name(self, obj):
        if obj.verified_by:
            return obj.verified_by.get_full_name() or obj.verified_by.email
        return None


class SurveyCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating surveys"""

    class Meta:
        model = Survey
        fields = [
            'service', 'survey_date', 'survey_period_start', 'survey_period_end',
            'latitude', 'longitude', 'location_accuracy',
            'surveyor_notes', 'current_bed_capacity', 'beds_occupied',
            'current_staff_count', 'current_psychiatrist_count', 'current_psychologist_count',
            'current_nurse_count', 'current_social_worker_count',
            'total_patients_served', 'new_patients', 'returning_patients',
            'patients_male', 'patients_female', 'patients_age_0_17', 'patients_age_18_64',
            'patients_age_65_plus', 'patient_satisfaction_score', 'average_wait_time_days',
            'monthly_budget', 'bpjs_patients', 'private_insurance_patients', 'self_pay_patients',
            'challenges_faced', 'improvements_needed', 'additional_notes'
        ]


class SurveySubmitSerializer(serializers.Serializer):
    """Serializer for submitting survey"""
    pass


class SurveyVerifySerializer(serializers.Serializer):
    """Serializer for verifying/rejecting survey"""

    action = serializers.ChoiceField(choices=['verify', 'reject'], required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['action'] == 'reject' and not attrs.get('rejection_reason'):
            raise serializers.ValidationError({"rejection_reason": "Rejection reason is required when rejecting"})
        return attrs


class SurveyAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for survey attachments"""

    uploaded_by_name = serializers.SerializerMethodField()
    attachment_type_display = serializers.CharField(source='get_attachment_type_display', read_only=True)

    class Meta:
        model = SurveyAttachment
        fields = [
            'id', 'survey', 'file', 'attachment_type', 'attachment_type_display',
            'description', 'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.email
        return None


class SurveyAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for survey audit logs"""

    user_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = SurveyAuditLog
        fields = [
            'id', 'survey', 'action', 'action_display', 'user', 'user_name',
            'previous_status', 'new_status', 'changes', 'notes', 'timestamp'
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return None
