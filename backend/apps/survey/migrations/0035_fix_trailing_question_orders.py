from django.db import migrations


def fix_orders(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')

    fixes = {
        # RQ block: RQJ=23, add RQK=24, RQL=25
        'RQK': 24,
        'RQL': 25,
        # SAQ block: SAQE=68, add SAQF=69
        'SAQF': 69,
        # SOQ block: SOQC=57, add SOQD=58, SOQE=59
        'SOQD': 58,
        'SOQE': 59,
        # SRQ block: SRQH=25, add SRQI=26, SRQJ=27, SRQK=28, SRQL=29
        'SRQI': 26,
        'SRQJ': 27,
        'SRQK': 28,
        'SRQL': 29,
        # SIQ block: SIQA=73, add SIQB=74 … SIQM=85
        'SIQB': 74,
        'SIQC': 75,
        'SIQD': 76,
        'SIQE': 77,
        'SIQF': 78,
        'SIQG': 79,
        'SIQH': 80,
        'SIQI': 81,
        'SIQJ': 82,
        'SIQK': 83,
        'SIQL': 84,
        'SIQM': 85,
    }

    for code, order in fixes.items():
        Question.objects.filter(code=code).update(order=order)


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0034_fix_nonfaskes_ql1_to_ql2'),
    ]

    operations = [
        migrations.RunPython(fix_orders, migrations.RunPython.noop),
    ]
