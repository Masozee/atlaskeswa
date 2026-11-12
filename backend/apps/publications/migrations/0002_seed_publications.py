from django.core.management import call_command
from django.db import migrations


def seed(apps, schema_editor):
    # Create-only: rows edited through the CMS are never overwritten.
    call_command('seed_publications')


class Migration(migrations.Migration):
    dependencies = [('publications', '0001_initial')]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
