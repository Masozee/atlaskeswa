from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget

from .models import GeographicUnit, QuestionChoice, Question
from apps.directory.models import BasicStableInputsOfCare


class GeographicUnitResource(resources.ModelResource):
    parent = fields.Field(
        column_name='parent',
        attribute='parent',
        widget=ForeignKeyWidget(GeographicUnit, field='code'),
    )

    class Meta:
        model = GeographicUnit
        fields = (
            'id', 'code', 'name', 'level',
            'parent', 'latitude', 'longitude', 'is_active',
        )
        export_order = (
            'id', 'code', 'name', 'level',
            'parent', 'latitude', 'longitude', 'is_active',
        )
        import_id_fields = ('code',)
        skip_unchanged = True


class QuestionChoiceResource(resources.ModelResource):
    question = fields.Field(
        column_name='question',
        attribute='question',
        widget=ForeignKeyWidget(Question, field='id'),
    )
    mtc_code = fields.Field(
        column_name='mtc_code',
        attribute='mtc_code',
        widget=ForeignKeyWidget(BasicStableInputsOfCare, field='code'),
    )

    class Meta:
        model = QuestionChoice
        fields = (
            'id', 'question', 'value', 'label', 'order',
            'mtc_code', 'keterangan', 'next_question_code',
            'has_other_input', 'other_input_label',
            'cabang_mtc', 'kode_desde_ltc',
        )
        export_order = (
            'id', 'question', 'value', 'label', 'order',
            'mtc_code', 'keterangan', 'next_question_code',
            'has_other_input', 'other_input_label',
            'cabang_mtc', 'kode_desde_ltc',
        )
        import_id_fields = ('id',)
        skip_unchanged = True
