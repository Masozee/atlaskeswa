from django.db import migrations


def publish_verified(apps, schema_editor):
    """Every already-VERIFIED survey keeps its place on the public map.

    Before this field the map showed every non-draft response; publication now
    gates it. Backfilling the verified rows means the map keeps its reviewed
    content, while SUBMITTED and REJECTED rows drop off until someone publishes
    them deliberately.
    """
    Response = apps.get_model('survey', 'DynamicSurveyResponse')
    for row in Response.objects.filter(verification_status='VERIFIED'):
        row.is_published = True
        row.published_at = row.verified_at
        row.published_by = row.verified_by
        row.save(update_fields=['is_published', 'published_at', 'published_by'])


def unpublish_all(apps, schema_editor):
    Response = apps.get_model('survey', 'DynamicSurveyResponse')
    Response.objects.update(is_published=False, published_at=None, published_by=None)


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0050_dynamicsurveyresponse_is_published_and_more'),
    ]

    operations = [
        migrations.RunPython(publish_verified, unpublish_all),
    ]
