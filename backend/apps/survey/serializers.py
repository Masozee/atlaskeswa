from rest_framework import serializers
from .models import (
    Survey, SurveyAttachment, SurveyAuditLog,
    GeographicUnit, SurveyTemplate, QuestionSection, Question,
    QuestionChoice, DynamicSurveyResponse, QuestionAnswer
)
from apps.directory.serializers import ServiceListSerializer


# =============================================================================
# GEOGRAPHIC UNIT SERIALIZERS
# =============================================================================

class GeographicUnitSerializer(serializers.ModelSerializer):
    """Serializer for geographic units"""

    level_display = serializers.CharField(source='get_level_display', read_only=True)
    full_path = serializers.CharField(source='get_full_path', read_only=True)

    class Meta:
        model = GeographicUnit
        fields = [
            'id', 'code', 'name', 'level', 'level_display',
            'parent', 'latitude', 'longitude', 'is_active', 'full_path'
        ]


# =============================================================================
# DYNAMIC QUESTIONNAIRE SERIALIZERS
# =============================================================================

class QuestionChoiceSerializer(serializers.ModelSerializer):
    """Serializer for question choices"""

    mtc_code_display = serializers.SerializerMethodField()

    def get_mtc_code_display(self, obj):
        if obj.mtc_code:
            return f"{obj.mtc_code.code} — {obj.mtc_code.name}"
        return None

    class Meta:
        model = QuestionChoice
        fields = [
            'id', 'question', 'value', 'label', 'order', 'mtc_code', 'mtc_code_display',
            'keterangan', 'next_question_code', 'has_other_input', 'other_input_label',
            'cabang_mtc', 'kode_desde_ltc'
        ]
        read_only_fields = ['id']


class QuestionChoiceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating question choices"""

    class Meta:
        model = QuestionChoice
        fields = [
            'id', 'question', 'value', 'label', 'order', 'mtc_code',
            'keterangan', 'next_question_code', 'has_other_input', 'other_input_label',
            'cabang_mtc', 'kode_desde_ltc'
        ]
        read_only_fields = ['id']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for individual questions"""

    choices = QuestionChoiceSerializer(many=True, read_only=True)
    answer_type_display = serializers.CharField(source='get_answer_type_display', read_only=True)
    mtc_code_display = serializers.CharField(source='mtc_code.code', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    section_code = serializers.CharField(source='section.code', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'section', 'section_name', 'section_code', 'code', 'question_text',
            'answer_type', 'answer_type_display',
            'is_required', 'order', 'mtc_code', 'mtc_code_display',
            'desde_ltc_description', 'introduction_text', 'keterangan', 'validation_rules',
            'show_condition', 'skip_logic', 'choices'
        ]
        read_only_fields = ['id']


class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating questions"""

    class Meta:
        model = Question
        fields = [
            'id', 'section', 'code', 'question_text', 'answer_type',
            'is_required', 'order', 'mtc_code', 'desde_ltc_description',
            'introduction_text', 'keterangan', 'validation_rules', 'show_condition', 'skip_logic'
        ]
        read_only_fields = ['id']


class QuestionSectionSerializer(serializers.ModelSerializer):
    """Serializer for question sections"""

    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = QuestionSection
        fields = [
            'id', 'code', 'name', 'description', 'order',
            'introduction_text', 'show_condition', 'questions'
        ]


class QuestionSectionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating question sections"""

    class Meta:
        model = QuestionSection
        fields = [
            'id', 'template', 'code', 'name', 'description', 'order',
            'introduction_text', 'show_condition'
        ]
        read_only_fields = ['id']


class SurveyTemplateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for template listing"""

    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)
    total_questions = serializers.IntegerField(read_only=True)

    class Meta:
        model = SurveyTemplate
        fields = [
            'id', 'code', 'name', 'description', 'version',
            'template_type', 'template_type_display', 'target_mtc',
            'is_active', 'total_questions', 'created_at'
        ]


class SurveyTemplateDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with all sections and questions"""

    sections = QuestionSectionSerializer(many=True, read_only=True)
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)
    total_questions = serializers.IntegerField(read_only=True)

    class Meta:
        model = SurveyTemplate
        fields = [
            'id', 'code', 'name', 'description', 'version',
            'template_type', 'template_type_display', 'target_mtc',
            'is_active', 'total_questions', 'sections',
            'created_at', 'updated_at'
        ]


# =============================================================================
# DYNAMIC SURVEY RESPONSE SERIALIZERS
# =============================================================================

class QuestionAnswerSerializer(serializers.ModelSerializer):
    """Serializer for question answers"""

    question_code = serializers.CharField(source='question.code', read_only=True)
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    selected_choice_values = serializers.SerializerMethodField()
    geographic_unit_name = serializers.CharField(source='geographic_unit.get_full_path', read_only=True)

    class Meta:
        model = QuestionAnswer
        fields = [
            'id', 'question', 'question_code', 'question_text',
            'text_value', 'number_value', 'date_value', 'time_value', 'boolean_value',
            'selected_choices', 'selected_choice_values', 'other_text',
            'geographic_unit', 'geographic_unit_name', 'coverage_level',
            'file', 'gps_latitude', 'gps_longitude', 'table_data',
            'context_key', 'derived_mtc', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_selected_choice_values(self, obj):
        return list(obj.selected_choices.values_list('value', flat=True))


class DynamicSurveyResponseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for response listing"""

    template_name = serializers.CharField(source='template.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_city = serializers.CharField(source='service.city', read_only=True)
    surveyor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_verification_status_display', read_only=True)

    class Meta:
        model = DynamicSurveyResponse
        fields = [
            'id', 'template', 'template_name', 'service', 'service_name', 'service_city',
            'survey_date', 'surveyor', 'surveyor_name',
            'verification_status', 'status_display',
            'deletion_requested',
            'latitude', 'longitude', 'created_at'
        ]

    def get_surveyor_name(self, obj):
        return obj.surveyor.get_full_name() or obj.surveyor.email


class DynamicSurveyResponseDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with all answers"""

    template = SurveyTemplateListSerializer(read_only=True)
    service = ServiceListSerializer(read_only=True)
    answers = QuestionAnswerSerializer(many=True, read_only=True)
    surveyor_name = serializers.SerializerMethodField()
    verifier_name = serializers.SerializerMethodField()
    verified_by_name = serializers.SerializerMethodField()
    deletion_requested_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_verification_status_display', read_only=True)

    class Meta:
        model = DynamicSurveyResponse
        fields = [
            'id', 'template', 'linked_survey', 'service', 'survey_date',
            'surveyor', 'surveyor_name', 'surveyor_notes',
            'verification_status', 'status_display',
            'assigned_verifier', 'verifier_name',
            'verified_by', 'verified_by_name', 'verified_at',
            'verifier_notes', 'rejection_reason',
            'deletion_requested', 'deletion_requested_at',
            'deletion_requested_by', 'deletion_requested_by_name',
            'deletion_reason',
            'latitude', 'longitude', 'location_accuracy',
            'derived_mtc_codes', 'answers',
            'created_at', 'updated_at', 'submitted_at'
        ]
        read_only_fields = ['id', 'surveyor', 'verified_by', 'verified_at',
                            'deletion_requested', 'deletion_requested_at', 'deletion_requested_by',
                            'created_at', 'updated_at', 'submitted_at']

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

    def get_deletion_requested_by_name(self, obj):
        if obj.deletion_requested_by:
            return obj.deletion_requested_by.get_full_name() or obj.deletion_requested_by.email
        return None


class DynamicSurveyResponseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating survey responses"""

    answers = serializers.DictField(child=serializers.JSONField(), required=False, write_only=True)
    survey_period_start = serializers.DateField(required=False, write_only=True)
    survey_period_end = serializers.DateField(required=False, write_only=True)

    class Meta:
        model = DynamicSurveyResponse
        fields = [
            'id', 'template', 'service', 'survey_date',
            'survey_period_start', 'survey_period_end',
            'latitude', 'longitude', 'location_accuracy',
            'surveyor_notes', 'answers', 'verification_status', 'created_at'
        ]
        read_only_fields = ['id', 'verification_status', 'created_at']

    def create(self, validated_data):
        from django.utils import timezone

        answers_data = validated_data.pop('answers', {})
        # Remove survey period fields (they're for legacy compatibility)
        validated_data.pop('survey_period_start', None)
        validated_data.pop('survey_period_end', None)

        # Set surveyor from request
        validated_data['surveyor'] = self.context['request'].user

        # Automatically submit the survey when created from the form
        validated_data['verification_status'] = DynamicSurveyResponse.Status.SUBMITTED
        validated_data['submitted_at'] = timezone.now()

        # Create the response
        response = DynamicSurveyResponse.objects.create(**validated_data)

        # Create answers
        self._create_answers(response, answers_data)

        return response

    def _create_answers(self, response, answers_data):
        """Create QuestionAnswer objects from answers dict using bulk operations"""
        # Separate __other_text keys from regular answers
        other_texts = {}
        clean_answers = {}
        for key, val in answers_data.items():
            if key.endswith('__other_text'):
                other_texts[key.replace('__other_text', '')] = val
            else:
                clean_answers[key] = val
        answers_data = clean_answers

        template = response.template
        questions = Question.objects.filter(section__template=template)
        question_map = {q.code: q for q in questions}

        # Batch fetch all choices for choice-type questions in a single query
        choice_question_ids = [
            q.id for q in questions
            if q.answer_type in ['SINGLE_CHOICE', 'MULTIPLE_CHOICE']
        ]
        all_choices = {}
        if choice_question_ids:
            for choice in QuestionChoice.objects.filter(question_id__in=choice_question_ids):
                all_choices.setdefault(choice.question_id, {})[choice.value] = choice

        # Build answer objects for bulk_create
        answers_to_create = []
        choice_assignments = []  # (answer_index, question, answer_value) for M2M

        for raw_code, answer_value in answers_data.items():
            # Parse MTC context prefix: "R2|RQA" → context_key="R2", code="RQA"
            if '|' in raw_code:
                context_key, question_code = raw_code.split('|', 1)
            else:
                context_key, question_code = '', raw_code

            question = question_map.get(question_code)
            if not question:
                continue

            answer_kwargs = {'response': response, 'question': question, 'context_key': context_key}

            # Set the appropriate field based on answer type
            if question.answer_type in ['TEXT', 'TEXTAREA', 'PHONE', 'EMAIL', 'URL']:
                answer_kwargs['text_value'] = str(answer_value) if answer_value else ''
            elif question.answer_type in ['NUMBER', 'INTEGER']:
                answer_kwargs['number_value'] = answer_value
            elif question.answer_type == 'DATE':
                answer_kwargs['date_value'] = answer_value
            elif question.answer_type == 'TIME':
                answer_kwargs['time_value'] = answer_value
            elif question.answer_type == 'BOOLEAN':
                answer_kwargs['boolean_value'] = answer_value
            elif question.answer_type in ['GEO_PROVINSI', 'GEO_KABUPATEN', 'GEO_KECAMATAN']:
                if answer_value:
                    # Support both integer FK IDs and string names
                    if isinstance(answer_value, int) or (isinstance(answer_value, str) and answer_value.isdigit()):
                        answer_kwargs['geographic_unit_id'] = int(answer_value)
                    else:
                        answer_kwargs['text_value'] = str(answer_value)
            elif question.answer_type == 'GEO_DESA':
                answer_kwargs['text_value'] = str(answer_value) if answer_value else ''
            elif question.answer_type in ['GEO_FULL', 'LOCATION']:
                if answer_value:
                    answer_kwargs['table_data'] = answer_value
            elif question.answer_type == 'COVERAGE_LEVEL':
                answer_kwargs['coverage_level'] = answer_value
            elif question.answer_type in ['STAFF_TABLE', 'DIAGNOSIS_TABLE']:
                answer_kwargs['table_data'] = answer_value
            elif question.answer_type == 'GPS':
                if isinstance(answer_value, dict):
                    answer_kwargs['gps_latitude'] = answer_value.get('latitude')
                    answer_kwargs['gps_longitude'] = answer_value.get('longitude')

            # Set other_text if provided (keyed by plain question code)
            if question_code in other_texts:
                answer_kwargs['other_text'] = other_texts[question_code]

            answer_obj = QuestionAnswer(**answer_kwargs)
            answers_to_create.append(answer_obj)

            # Track choice assignments for after bulk_create
            if question.answer_type in ['SINGLE_CHOICE', 'MULTIPLE_CHOICE']:
                choice_assignments.append((len(answers_to_create) - 1, question, answer_value))

        # Bulk create all answers at once
        created_answers = QuestionAnswer.objects.bulk_create(answers_to_create)

        # Set M2M choice relationships using pre-fetched choices
        for idx, question, answer_value in choice_assignments:
            answer = created_answers[idx]
            question_choices = all_choices.get(question.id, {})
            if isinstance(answer_value, list):
                matched = [question_choices[v] for v in answer_value if v in question_choices]
                if matched:
                    answer.selected_choices.set(matched)
            elif answer_value and answer_value in question_choices:
                answer.selected_choices.add(question_choices[answer_value])


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
