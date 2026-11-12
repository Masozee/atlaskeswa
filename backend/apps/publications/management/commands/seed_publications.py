"""
Load the publications that used to be hard-coded in the frontend
(`frontend/lib/publications.ts`) into the database.

Their images and PDF keep living in the frontend's `public/publikasi/`, so the
seeded rows point at site paths (`/publikasi/...`) and need no file copying.

    python manage.py seed_publications            # create missing rows only
    python manage.py seed_publications --update   # also overwrite existing rows
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.publications.models import Publication

FIXTURE = Path(__file__).resolve().parents[2] / 'fixtures' / 'publications.json'
TYPE_CODES = {label: code for code, label in Publication.Type.choices}


class Command(BaseCommand):
    help = 'Seed the OMMHA publications that used to be hard-coded in the frontend.'

    def add_arguments(self, parser):
        parser.add_argument('--update', action='store_true', help='Overwrite rows that already exist.')

    @transaction.atomic
    def handle(self, *args, **options):
        items = json.loads(FIXTURE.read_text(encoding='utf-8'))
        created = updated = skipped = 0
        for item in items:
            cover = item.get('cover') or {}
            file = item.get('file') or {}
            values = {
                'type': TYPE_CODES[item['type']],
                'status': Publication.Status.PUBLISHED,
                'date': item['date'],
                'title': item['title'],
                'excerpt': item['excerpt'],
                'author': item['author'],
                'period': item.get('period', ''),
                'cover_src': cover.get('src', ''),
                'cover_alt': cover.get('alt', ''),
                'cover_credit': cover.get('credit', ''),
                'file_href': file.get('href', ''),
                'file_label': file.get('label', ''),
                'file_size': file.get('size', ''),
                'external_url': item.get('externalUrl', ''),
                'body': item.get('body', []),
            }
            existing = Publication.objects.filter(slug=item['slug']).first()
            if existing and not options['update']:
                skipped += 1
                continue
            if existing:
                for key, value in values.items():
                    setattr(existing, key, value)
                existing.save()
                updated += 1
            else:
                Publication.objects.create(slug=item['slug'], **values)
                created += 1
        self.stdout.write(self.style.SUCCESS(
            f'Publications: {created} created, {updated} updated, {skipped} skipped.'
        ))
