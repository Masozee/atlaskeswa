from django.db import migrations

RSU_RSJ = ['RSU', 'RSJ']

RQ6_ORIGINAL_SHOW_CONDITION = {"value": "R", "operator": "contains", "question_code": "QL1"}
RQ7_ORIGINAL_SHOW_CONDITION = {"value": "R", "operator": "contains", "question_code": "QL1"}


def forward(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')

    # RQ6 visible only for RSU/RSJ facilities (QL1 contains R AND Q4 in [RSU, RSJ])
    Question.objects.filter(code='RQ6').update(
        show_condition={
            "operator": "and",
            "conditions": [
                {"question_code": "QL1", "operator": "contains", "value": "R"},
                {"question_code": "Q4", "operator": "in", "value": RSU_RSJ},
            ],
        }
    )

    # RQ7 visible only for non-RSU/RSJ facilities (QL1 contains R AND Q4 not in [RSU, RSJ])
    Question.objects.filter(code='RQ7').update(
        show_condition={
            "operator": "and",
            "conditions": [
                {"question_code": "QL1", "operator": "contains", "value": "R"},
                {"question_code": "Q4", "operator": "not_in", "value": RSU_RSJ},
            ],
        }
    )

    # Clear next_question_code from DOKTER_24 — sequential flow routes to RQ6 or RQ7
    # based on which one is visible (controlled by show_condition above)
    QuestionChoice.objects.filter(
        question__code='RQ5', value='DOKTER_24'
    ).update(next_question_code='')


def reverse(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')

    Question.objects.filter(code='RQ6').update(show_condition=RQ6_ORIGINAL_SHOW_CONDITION)
    Question.objects.filter(code='RQ7').update(show_condition=RQ7_ORIGINAL_SHOW_CONDITION)

    QuestionChoice.objects.filter(
        question__code='RQ5', value='DOKTER_24'
    ).update(next_question_code='RQ6')


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0038_rqi_srqi_show_condition'),
    ]

    operations = [
        migrations.RunPython(forward, reverse),
    ]
