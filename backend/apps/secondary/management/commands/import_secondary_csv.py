"""Import a wide, sex-disaggregated kecamatan table into a SecondaryDataset.

The tables these come in all share a shape: two header rows, where the first
names a column group ("Gangguan Cemas F4") across merged cells and the second
marks the parts ("L", "P"). Numbers arrive with thousand separators and stray
padding.

    python manage.py import_secondary_csv ya.csv \
        --name "Data Kesehatan Jiwa per Kecamatan" --slug kesehatan-jiwa-kecamatan \
        --source "Dinkes Kabupaten Kebumen"

Re-running with the same slug updates the dataset in place rather than
duplicating it, so a corrected spreadsheet can simply be imported again.
"""

import csv
import re
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.secondary.models import (
    KecamatanIndicatorValue, SecondaryDataset, SecondaryIndicator
)
from apps.survey.models import GeographicUnit

# Column groups that are computed rather than imported: the app recalculates
# totals and rates so they stay consistent with whatever is on screen.
DERIVED = {'no', 'total 1', 'total 2', 'per 10.000', 'per 10000'}
NAME_COLUMN = 'kecamatan'
POPULATION_HINTS = ('jumlah penduduk', 'penduduk')
# Column groups the source already totalled, which must stay out of any sum the
# app computes itself.
AGGREGATE_HINTS = ('spm', 'odgj berat')


def clean(text):
    return re.sub(r'\s+', ' ', (text or '')).strip()


def to_number(raw):
    """"18,930" / "  89 " / "" -> Decimal or None."""
    text = clean(raw).replace('.', '').replace(',', '')
    if not text:
        return None
    try:
        return Decimal(text)
    except InvalidOperation:
        return None


def read_columns(header_top, header_sub):
    """Label every column with its group and its L/P part.

    Merged cells arrive as blanks, so the last non-empty group label carries
    forward until the next one.
    """
    columns = []
    group = ''
    for index in range(max(len(header_top), len(header_sub))):
        top = clean(header_top[index]) if index < len(header_top) else ''
        sub = clean(header_sub[index]) if index < len(header_sub) else ''
        if top:
            group = top
        columns.append({'index': index, 'group': group, 'part': sub.upper()})
    return columns


class Command(BaseCommand):
    help = 'Import a wide kecamatan CSV as a secondary dataset'

    def add_arguments(self, parser):
        parser.add_argument('csv_path')
        parser.add_argument('--name', required=True, help='Dataset title')
        parser.add_argument('--slug', help='Defaults to a slug of --name')
        parser.add_argument('--source', default='', help='Agency the table came from')
        parser.add_argument('--year', type=int, help='Period, if the table states one')
        parser.add_argument('--description', default='')
        parser.add_argument(
            '--total-column', default='Total 1',
            help='Column holding the population total (default: "Total 1")',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        path = options['csv_path']
        try:
            rows = list(csv.reader(open(path, newline='', encoding='utf-8-sig')))
        except FileNotFoundError:
            raise CommandError(f'No such file: {path}')
        if len(rows) < 3:
            raise CommandError('Expected two header rows followed by data')

        columns = read_columns(rows[0], rows[1])
        total_column = clean(options['total_column']).lower()

        name_index = next(
            (c['index'] for c in columns if c['group'].lower() == NAME_COLUMN), None
        )
        if name_index is None:
            raise CommandError(f'No "{NAME_COLUMN}" column in the header')

        # Group the columns into indicators, in the order the source wrote them.
        indicators = {}
        population_group = None
        for column in columns:
            group = column['group']
            key = group.lower()
            if not group or key == NAME_COLUMN:
                continue
            if key in DERIVED and key != total_column:
                continue
            if key == total_column:
                # The population total sits under its own header but belongs to
                # the population group beside it.
                if population_group:
                    indicators[population_group]['total'] = column['index']
                continue
            entry = indicators.setdefault(group, {'male': None, 'female': None, 'total': None})
            if column['part'] == 'L':
                entry['male'] = column['index']
            elif column['part'] == 'P':
                entry['female'] = column['index']
            else:
                entry['total'] = column['index']
            if any(hint in key for hint in POPULATION_HINTS):
                population_group = group

        if not indicators:
            raise CommandError('No indicator columns found')

        dataset, _ = SecondaryDataset.objects.update_or_create(
            slug=options['slug'] or slugify(options['name']),
            defaults={
                'name': options['name'],
                'source': options['source'],
                'year': options['year'],
                'description': options['description'],
            },
        )
        # A re-import replaces the dataset's contents; values cascade off the
        # indicators, so a removed column leaves nothing behind.
        dataset.indicators.all().delete()

        units = {u.name.strip().upper(): u for u in GeographicUnit.objects.filter(level='KECAMATAN')}
        created_indicators = {}
        for order, (group, spec) in enumerate(indicators.items()):
            key = group.lower()
            created_indicators[group] = SecondaryIndicator.objects.create(
                dataset=dataset,
                code=slugify(group)[:120],
                name=group,
                order=order,
                is_population=group == population_group,
                is_aggregate=any(hint in key for hint in AGGREGATE_HINTS),
            )

        imported, unmatched = 0, []
        for row in rows[2:]:
            if len(row) <= name_index:
                continue
            kecamatan_name = clean(row[name_index])
            if not kecamatan_name:
                continue
            unit = units.get(kecamatan_name.upper())
            if unit is None:
                unmatched.append(kecamatan_name)
                continue

            for group, spec in indicators.items():
                def cell(index):
                    return to_number(row[index]) if index is not None and index < len(row) else None

                male, female = cell(spec['male']), cell(spec['female'])
                total = cell(spec['total'])
                if total is None and (male is not None or female is not None):
                    total = (male or Decimal('0')) + (female or Decimal('0'))
                if male is None and female is None and total is None:
                    continue
                KecamatanIndicatorValue.objects.update_or_create(
                    indicator=created_indicators[group],
                    kecamatan=unit,
                    defaults={'value_male': male, 'value_female': female, 'value_total': total},
                )
                imported += 1

        self.stdout.write(self.style.SUCCESS(
            f'{dataset.name}: {len(created_indicators)} indicators, {imported} values'
        ))
        if unmatched:
            self.stdout.write(self.style.WARNING(
                f'No kecamatan matched for: {", ".join(sorted(set(unmatched)))}'
            ))
