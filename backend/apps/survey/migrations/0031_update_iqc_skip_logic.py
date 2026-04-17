from django.db import migrations


def update_iqc_skip_logic(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    iqc = Question.objects.get(code='IQC')
    # Set skip_logic so mobile flow logic can use IQ1 answer to determine next
    iqc.skip_logic = [
        {"goto": "_iq1_branch_", "value": "_dynamic_"}
    ]
    iqc.save(update_fields=['skip_logic'])
    print('[0031] Updated IQC skip_logic for dynamic routing')


def revert_iqc_skip_logic(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    iqc = Question.objects.get(code='IQC')
    iqc.skip_logic = None
    iqc.save(update_fields=['skip_logic'])


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0030_update_sumber_pembiayaan_options'),
    ]

    operations = [
        migrations.RunPython(update_iqc_skip_logic, reverse_code=revert_iqc_skip_logic),
    ]