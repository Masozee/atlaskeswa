from rest_framework import serializers
from .models import (
    Survey, SurveyAttachment, SurveyAuditLog,
    GeographicUnit, SurveyTemplate, QuestionSection, Question,
    QuestionChoice, DynamicSurveyResponse, QuestionAnswer, SurveyPhoto
)
from apps.directory.serializers import ServiceListSerializer


# =============================================================================
# GEOGRAPHIC UNIT SERIALIZERS
# =============================================================================

class GeographicUnitSerializer(serializers.ModelSerializer):
    """Serializer for geographic units"""

    level_display = serializers.CharField(source='get_level_display', read_only=True)
    full_path = serializers.CharField(source='get_full_path', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)

    class Meta:
        model = GeographicUnit
        fields = [
            'id', 'code', 'name', 'level', 'level_display',
            'parent', 'parent_name', 'latitude', 'longitude', 'is_active', 'full_path'
        ]


class GeographicUnitCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating geographic units"""

    class Meta:
        model = GeographicUnit
        fields = ['code', 'name', 'level', 'parent', 'latitude', 'longitude', 'is_active']


# =============================================================================
# DYNAMIC QUESTIONNAIRE SERIALIZERS
# =============================================================================

class QuestionChoiceSerializer(serializers.ModelSerializer):
    """Serializer for question choices"""

    mtc_code_display = serializers.SerializerMethodField()
    bsic_full_label = serializers.SerializerMethodField()

    def get_mtc_code_display(self, obj):
        if obj.mtc_code:
            return f"{obj.mtc_code.code} — {obj.mtc_code.name}"
        return None

    def _bsic_code_map(self):
        """Lazily build {code: (full_label, name)} once per serialization.

        Without this, the null-bsic_id fallback below fired one DB query per
        choice — hundreds of queries when serializing a full template. We cache
        the whole BSIC code map on the serializer context so it is built once.
        """
        ctx = self.context
        cached = ctx.get('_bsic_code_map')
        if cached is None:
            from apps.directory.models import BasicStableInputsOfCare
            cached = {
                code: (full_label, name)
                for code, full_label, name in BasicStableInputsOfCare.objects.values_list(
                    'code', 'full_label', 'name'
                )
            }
            ctx['_bsic_code_map'] = cached
        return cached

    def get_bsic_full_label(self, obj):
        if obj.bsic_id:
            return obj.bsic.full_label or obj.bsic.name or ''
        # Fallback: look up BSIC by value (code) when bsic_id is null.
        if obj.value:
            entry = self._bsic_code_map().get(obj.value)
            if entry:
                full_label, name = entry
                return full_label or name or ''
        return ''

    class Meta:
        model = QuestionChoice
        fields = [
            'id', 'question', 'value', 'label', 'order', 'mtc_code', 'mtc_code_display',
            'keterangan', 'next_question_code', 'has_other_input', 'other_input_label', 'other_input_type',
            'cabang_mtc', 'kode_desde_ltc', 'bsic', 'bsic_full_label'
        ]
        read_only_fields = ['id']


class QuestionChoiceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating question choices"""

    class Meta:
        model = QuestionChoice
        fields = [
            'id', 'question', 'value', 'label', 'order', 'mtc_code',
            'keterangan', 'next_question_code', 'has_other_input', 'other_input_label', 'other_input_type',
            'cabang_mtc', 'kode_desde_ltc', 'bsic'
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
            'show_condition', 'skip_logic', 'table_config', 'choices'
        ]
        read_only_fields = ['id']


class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating questions"""

    class Meta:
        model = Question
        fields = [
            'id', 'section', 'code', 'question_text', 'answer_type',
            'is_required', 'order', 'mtc_code', 'desde_ltc_description',
            'introduction_text', 'keterangan', 'validation_rules', 'show_condition', 'skip_logic',
            'table_config'
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
    selected_choice_labels = serializers.SerializerMethodField()
    geographic_unit_name = serializers.CharField(source='geographic_unit.get_full_path', read_only=True)
    geographic_unit_display = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = QuestionAnswer
        fields = [
            'id', 'question', 'question_code', 'question_text',
            'text_value', 'number_value', 'date_value', 'time_value', 'boolean_value',
            'selected_choices', 'selected_choice_values', 'selected_choice_labels', 'other_text',
            'geographic_unit', 'geographic_unit_name', 'geographic_unit_display', 'coverage_level',
            'file', 'file_url', 'gps_latitude', 'gps_longitude', 'table_data',
            'context_key', 'derived_mtc', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_selected_choice_values(self, obj):
        return list(obj.selected_choices.values_list('value', flat=True))

    def get_selected_choice_labels(self, obj):
        return list(obj.selected_choices.values_list('label', flat=True))

    def get_geographic_unit_display(self, obj):
        """Return geographic unit name - from FK if available, else from text_value"""
        if obj.geographic_unit:
            return obj.geographic_unit.get_full_path()
        if obj.text_value:
            return obj.text_value
        return None

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class DynamicSurveyResponseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for response listing"""

    template_name = serializers.CharField(source='template.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_city = serializers.CharField(source='service.city', read_only=True)
    service_kecamatan = serializers.SerializerMethodField()
    service_desa = serializers.SerializerMethodField()
    q1_nama_fasilitas = serializers.SerializerMethodField()
    status_badan_hukum = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    surveyor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    kategori = serializers.SerializerMethodField()
    jenis_fasilitas = serializers.SerializerMethodField()
    jenis_layanan = serializers.SerializerMethodField()
    kode_desde_ltc = serializers.SerializerMethodField()
    deleted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DynamicSurveyResponse
        fields = [
            'id', 'template', 'template_name', 'service', 'service_name', 'service_city',
            'service_kecamatan', 'service_desa', 'q1_nama_fasilitas', 'status_badan_hukum', 'thumbnail',
            'survey_date', 'surveyor', 'surveyor_name',
            'verification_status', 'status_display',
            'deletion_requested',
            'deleted_at', 'deleted_by', 'deleted_by_name',
            'kategori', 'jenis_fasilitas', 'jenis_layanan', 'kode_desde_ltc',
            'latitude', 'longitude', 'created_at', 'started_at', 'submitted_at'
        ]

    def get_surveyor_name(self, obj):
        return obj.surveyor.get_full_name() or obj.surveyor.email

    def get_deleted_by_name(self, obj):
        user = obj.deleted_by
        if not user:
            return None
        return user.get_full_name() or user.email

    def _choice_labels(self, obj, codes):
        """Selected choice labels for the given question codes (uses prefetched answers)."""
        labels = []
        for answer in obj.answers.all():
            if answer.question.code in codes:
                for choice in answer.selected_choices.all():
                    label = (choice.label or '').strip()
                    if label and label not in labels:
                        labels.append(label)
        return labels

    def get_kategori(self, obj):
        """FASKES if Q3 answer is 'Kesehatan', otherwise NON FASKES (mirrors mobile logic)."""
        q3_labels = self._choice_labels(obj, {'Q3'})
        if not q3_labels:
            return None
        return 'FASKES' if any(l.lower() == 'kesehatan' for l in q3_labels) else 'NON FASKES'

    def get_jenis_fasilitas(self, obj):
        labels = self._choice_labels(obj, {'Q4'})
        return ', '.join(labels) if labels else None

    def get_jenis_layanan(self, obj):
        labels = self._choice_labels(obj, {'QL1', 'QL2'})
        return ', '.join(labels) if labels else None

    def get_kode_desde_ltc(self, obj):
        """Final DESDE-LTC classification: leaf-most MTC entries ("code — name")
        across all selected choices, identical to the 'Klasifikasi' list shown at
        the end of the survey in the OMMHA mobile app."""
        entries = {}
        for answer in obj.answers.all():
            for choice in answer.selected_choices.all():
                if choice.mtc_code:
                    entries[choice.mtc_code.code] = f"{choice.mtc_code.code} — {choice.mtc_code.name}"
        codes = list(entries)
        leaves = [
            entries[c] for c in codes
            if not any(other != c and other.startswith(c + '.') for other in codes)
        ]
        return leaves or None

    def get_service_kecamatan(self, obj):
        # Get Q7 answer's geographic_unit for this response
        from apps.survey.models import QuestionAnswer
        q7_answer = obj.answers.filter(question__code='Q7').select_related('geographic_unit').first()
        if q7_answer and q7_answer.geographic_unit:
            return q7_answer.geographic_unit.name
        # Fallback to service kecamatan field
        return obj.service.kecamatan if obj.service else None

    def get_service_desa(self, obj):
        """Q8 answer's geographic_unit (Desa/Kelurahan), fallback to service field."""
        for answer in obj.answers.all():
            if answer.question.code == 'Q8' and answer.geographic_unit:
                return answer.geographic_unit.name
        return getattr(obj.service, 'desa', None) if obj.service else None

    def get_q1_nama_fasilitas(self, obj):
        """Q1 free-text facility name as entered in the survey."""
        for answer in obj.answers.all():
            if answer.question.code == 'Q1':
                value = (answer.text_value or '').strip()
                return value or None
        return None

    def get_status_badan_hukum(self, obj):
        """Q13 selected choice labels (legal entity status)."""
        labels = self._choice_labels(obj, {'Q13'})
        return ', '.join(labels) if labels else None

    def get_thumbnail(self, obj):
        """Absolute URL of the first facility photo, if any."""
        photo = next(iter(obj.photos.all()), None)
        if not photo or not photo.image:
            return None
        request = self.context.get('request')
        url = photo.image.url
        return request.build_absolute_uri(url) if request else url


class SurveyMapPointSerializer(DynamicSurveyResponseListSerializer):
    """A survey reduced to a plottable point for the map.

    Inherits the answer-derived fields (facility name, category, DESDE-LTC
    codes, ...) from the list serializer, but drops surveyor identity and the
    verification-workflow internals: this feeds the public landing-page map.
    """

    name = serializers.SerializerMethodField()
    kecamatan = serializers.SerializerMethodField()
    desa = serializers.SerializerMethodField()

    class Meta(DynamicSurveyResponseListSerializer.Meta):
        fields = [
            'id', 'latitude', 'longitude',
            'name', 'kecamatan', 'desa',
            'kategori', 'jenis_fasilitas', 'jenis_layanan', 'kode_desde_ltc',
            'thumbnail', 'survey_date',
            'verification_status', 'status_display',
            'service', 'service_name',
        ]

    def get_name(self, obj):
        """Facility name as the surveyor typed it, falling back to the service."""
        return self.get_q1_nama_fasilitas(obj) or (obj.service.name if obj.service else None)

    def get_kecamatan(self, obj):
        # Reads the prefetched answers instead of re-querying per row, so
        # plotting every survey does not turn into one query per marker.
        for answer in obj.answers.all():
            if answer.question.code == 'Q7' and answer.geographic_unit:
                return answer.geographic_unit.name
        return obj.service.kecamatan if obj.service else None

    def get_desa(self, obj):
        return self.get_service_desa(obj)


class SurveyLocationPhotoSerializer(serializers.ModelSerializer):
    """A facility photo without the uploader's identity, for public pages."""

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = SurveyPhoto
        fields = ['id', 'image_url', 'caption']

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class SurveyLocationDetailSerializer(SurveyMapPointSerializer):
    """One surveyed location as a public profile page.

    Extends the map-point payload with the fields the survey table shows
    (Q13 legal status, city) plus the full photo set for the page header. Still
    carries no surveyor identity or interview timings — those stay in the
    dashboard's verification view.
    """

    photos = SurveyLocationPhotoSerializer(many=True, read_only=True)

    class Meta(SurveyMapPointSerializer.Meta):
        fields = SurveyMapPointSerializer.Meta.fields + [
            'status_badan_hukum', 'service_city', 'photos',
        ]


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
            'created_at', 'updated_at', 'started_at', 'submitted_at'
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
    # Mobile app sends gps_latitude/gps_longitude
    gps_latitude = serializers.FloatField(required=False, write_only=True)
    gps_longitude = serializers.FloatField(required=False, write_only=True)
    # Mobile app may send explicit verification_status (e.g., DRAFT for draft saves)
    verification_status = serializers.CharField(required=False, write_only=True)
    # Mobile app sends started_at when beginning the survey
    started_at = serializers.DateTimeField(required=False, write_only=True)

    class Meta:
        model = DynamicSurveyResponse
        fields = [
            'id', 'template', 'service', 'survey_date',
            'survey_period_start', 'survey_period_end',
            'latitude', 'longitude', 'location_accuracy',
            'surveyor_notes', 'answers',
            'gps_latitude', 'gps_longitude',
            'verification_status', 'started_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        from django.utils import timezone
        from django.db.models import Q

        answers_data = validated_data.pop('answers', {})
        # Remove survey period fields (they're for legacy compatibility)
        validated_data.pop('survey_period_start', None)
        validated_data.pop('survey_period_end', None)

        # Map mobile gps_latitude/gps_longitude to model latitude/longitude
        gps_lat = validated_data.pop('gps_latitude', None)
        gps_lng = validated_data.pop('gps_longitude', None)
        if gps_lat is not None:
            validated_data['latitude'] = gps_lat
        if gps_lng is not None:
            validated_data['longitude'] = gps_lng

        # Mobile app may pass explicit verification_status (DRAFT for draft saves)
        explicit_status = validated_data.pop('verification_status', None)

        service = validated_data.get('service')
        template = validated_data.get('template')
        surveyor = self.context['request'].user

        # Prevent duplicate: check if a non-draft/non-rejected response exists for same service+template+surveyor
        existing = DynamicSurveyResponse.objects.filter(
            service=service,
            template=template,
            surveyor=surveyor,
        ).exclude(
            verification_status__in=[
                DynamicSurveyResponse.Status.DRAFT,
                DynamicSurveyResponse.Status.REJECTED,
            ]
        ).exists()

        if existing:
            raise serializers.ValidationError({
                'detail': f'Survei untuk fasilitas ini sudah ada dan sedang dalam proses verifikasi.'
            })

        # Set surveyor from request
        validated_data['surveyor'] = surveyor

        # If mobile explicitly passed DRAFT status, save as draft (for offline sync backup)
        # Otherwise auto-submit for normal survey submissions
        if explicit_status == DynamicSurveyResponse.Status.DRAFT:
            validated_data['verification_status'] = DynamicSurveyResponse.Status.DRAFT
        else:
            validated_data['verification_status'] = DynamicSurveyResponse.Status.SUBMITTED
            validated_data['submitted_at'] = timezone.now()

        # Create the response
        response = DynamicSurveyResponse.objects.create(**validated_data)

        # Create answers
        self._create_answers(response, answers_data)

        return response

    def update(self, instance, validated_data):
        """
        Update a survey response and (if provided) fully replace its answers.

        Answers are re-created rather than patched: the incoming `answers` dict
        is the complete, authoritative answer set for the response. Existing
        QuestionAnswer rows (and their M2M choices, via cascade) are deleted and
        rebuilt through the same _create_answers path used on create, so the
        stored format stays identical between create and edit.
        """
        answers_provided = 'answers' in validated_data
        answers_data = validated_data.pop('answers', {})

        # Legacy-compat / mobile-only fields that don't map to the model directly
        validated_data.pop('survey_period_start', None)
        validated_data.pop('survey_period_end', None)

        gps_lat = validated_data.pop('gps_latitude', None)
        gps_lng = validated_data.pop('gps_longitude', None)
        if gps_lat is not None:
            validated_data['latitude'] = gps_lat
        if gps_lng is not None:
            validated_data['longitude'] = gps_lng

        # verification_status is not editable through this path
        validated_data.pop('verification_status', None)

        # Apply scalar field updates
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace answers only when the caller sent an answers payload
        if answers_provided:
            instance.answers.all().delete()
            self._create_answers(instance, answers_data)

        return instance

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
            if _is_effectively_empty_answer(answer_value):
                continue

            # Parse MTC context prefix: "R2|RQA" → context_key="R2", code="RQA"
            if '|' in raw_code:
                context_key, question_code = raw_code.split('|', 1)
            else:
                context_key, question_code = '', raw_code

            question = question_map.get(question_code)
            if not question:
                continue
            if question.answer_type == Question.AnswerType.FILE:
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
                # Support both integer FK IDs and string names - store ID as FK when numeric
                if isinstance(answer_value, int) or (isinstance(answer_value, str) and answer_value.isdigit()):
                    answer_kwargs['geographic_unit_id'] = int(answer_value)
                else:
                    answer_kwargs['text_value'] = str(answer_value) if answer_value else ''
            elif question.answer_type in ['GEO_FULL', 'LOCATION']:
                if answer_value:
                    answer_kwargs['table_data'] = answer_value
            elif question.answer_type == 'COVERAGE_LEVEL':
                answer_kwargs['coverage_level'] = answer_value
            elif question.answer_type in ['STAFF_TABLE', 'DIAGNOSIS_TABLE', 'REPEATING_TABLE', 'INTERVENTION_MATRIX', 'OPERATING_HOURS', 'KEGIATAN_TABLE', 'MATRIX_KEGIATAN']:
                answer_kwargs['table_data'] = answer_value
            elif question.answer_type == 'GPS':
                if isinstance(answer_value, dict):
                    answer_kwargs['gps_latitude'] = answer_value.get('latitude')
                    answer_kwargs['gps_longitude'] = answer_value.get('longitude')

            # Set other_text if provided (keyed by plain question code)
            if raw_code in other_texts:
                answer_kwargs['other_text'] = other_texts[raw_code]
            elif question_code in other_texts:
                answer_kwargs['other_text'] = other_texts[question_code]

            answer_obj = QuestionAnswer(**answer_kwargs)
            answers_to_create.append(answer_obj)

            # Track choice assignments for after saving answers
            if question.answer_type in ['SINGLE_CHOICE', 'MULTIPLE_CHOICE']:
                choice_assignments.append((len(answers_to_create) - 1, question, answer_value))

        # We can't use bulk_create for answers with M2M choices because
        # bulk_create doesn't properly initialize objects for M2M operations.
        # Save each answer individually, then set M2M choices.
        for idx, answer in enumerate(answers_to_create):
            answer.save()

        # Set M2M choice relationships using pre-fetched choices
        for idx, question, answer_value in choice_assignments:
            answer = answers_to_create[idx]
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


class SurveyPhotoSerializer(serializers.ModelSerializer):
    """Serializer for survey photos"""

    uploaded_by_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = SurveyPhoto
        fields = [
            'id', 'survey', 'image', 'image_url', 'caption',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]
        read_only_fields = ['id', 'survey', 'uploaded_by', 'uploaded_at']

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.email
        return None

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
# Treat blank branch payloads as absent answers so we don't persist empty rows
# when the mobile flow briefly traverses a path the user didn't actually fill.
def _is_effectively_empty_answer(value):
    if value is None:
        return True
    if isinstance(value, str):
        return value == ''
    if isinstance(value, (list, tuple, set)):
        return len(value) == 0
    if isinstance(value, dict):
        return len(value) == 0
    return False
