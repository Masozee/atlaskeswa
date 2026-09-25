"""The "Penyedia layanan" summary: surveyed facilities counted by provider
bucket and DESDE-LTC service type, for the public atlas page.

The page groups Q4's twelve facility types into the seven provider buckets the
research team reports with, and sorts each service a facility offers into the
columns of that service type's table. Both mappings live here so the page
renders the payload as-is.

`summarize` works on plain `Facility` records rather than model instances, so
the counting rules can be tested without building whole surveys;
`load_facilities` is the one place that reads surveys.

A facility is often surveyed more than once — per unit on the day, then again
in a later consolidation pass — so only its latest survey is counted.
"""

import re
from dataclasses import dataclass, field

from django.db.models import Q

# Provider buckets in report order. A facility with no Q4 type we recognise
# lands in "Lainnya" rather than dropping out of the totals.
BUCKETS = [
    # Q4 later folded "Rumah Sakit Umum" into plain "Rumah Sakit"; both are live.
    ('rs', 'RS', ['rumah sakit', 'rumah sakit umum', 'rumah sakit jiwa (rsj)']),
    ('puskesmas', 'Puskesmas', ['puskesmas']),
    ('biro_psikologi', 'Biro psikologi', ['klinik atau biro psikologi']),
    ('praktek_dokter', 'Praktek dokter mandiri', ['praktek dokter mandiri']),
    ('rehabsos', 'Rehabsos/agama', [
        'balai atau unit rehabilitasi',
        'panti sosial/lembaga rehabilitasi sosial/pondok pesantren',
        'lembaga kesejahteraan sosial (lks)',
    ]),
    ('kader', 'Kader/DSSJ/Yandu', ['kader kesehatan', 'organisasi berbasis komunitas']),
    ('tksk', 'TKSK', ['tksk (tenaga kesejahteraan sosial kecamatan)']),
]
OTHER_BUCKET = ('lainnya', 'Lainnya')

_BUCKET_BY_TYPE = {
    facility_type: key for key, _label, types in BUCKETS for facility_type in types
}

SERVICE_TYPES = [
    ('R', 'Rawat inap'),
    ('D', 'Perawatan harian'),
    ('O', 'Rawat jalan'),
    ('A', 'Aksesibilitas'),
    ('I', 'Informasi'),
]

# The number each detail block reports: capacity for care services, yearly
# beneficiaries for accessibility and information.
VOLUME_QUESTIONS = {'RQB', 'SRQB', 'DQC', 'SDQC', 'OQC', 'SOQC', 'AQC', 'SAQC', 'IQL', 'SIQL'}

_DAY_CARE_NON_ACUTE = {
    # Health D2–D9 pair high/low intensity per kind; social SD1–SD4 do not.
    'D': {2: 'pekerjaan', 6: 'pekerjaan', 3: 'persiapan_kerja', 7: 'persiapan_kerja',
          4: 'terstruktur', 8: 'terstruktur', 5: 'tidak_terstruktur', 9: 'tidak_terstruktur'},
    'SD': {1: 'pekerjaan', 2: 'persiapan_kerja', 3: 'terstruktur', 4: 'tidak_terstruktur'},
}
_ACCESS_COLUMNS = {1: 'komunikasi', 2: 'mobilitas', 3: 'pendamping', 4: 'manajemen_kasus', 5: 'lainnya'}
_INFO_TOPICS = {1: 'kesehatan', 2: 'pendidikan', 3: 'sosial', 4: 'pekerjaan', 5: 'lainnya'}
_INFO_CHANNELS = {'2.1.1': 'tatap_muka', '2.1.2': 'media_sosial', '2.2': 'non_interaktif'}

_CODE = re.compile(r'^(S?)([RDOAI])(\d+)((?:\.\d+)*)$')


def classify(code):
    """The (service type, table column) a DESDE-LTC code counts under.

    Health and social codes share a service type (SR counts as rawat inap), and
    the column follows the questionnaire's branches: RQ1/SRQ1 split acute from
    non-acute, OQ2/OQ9 visit-based from facility-based, and so on. Returns
    None for codes that name no column, such as a branch's parent (I1, SR).
    """
    match = _CODE.match((code or '').replace(' ', ''))
    if not match:
        return None
    social, letter, head, rest = match.groups()
    n = int(head)
    family = social + letter

    if letter == 'R':
        acute_up_to = 2 if social else 3
        return 'R', 'akut' if n <= acute_up_to else 'non_akut'
    if letter == 'D':
        if not social and n <= 1:
            return 'D', 'akut'
        column = _DAY_CARE_NON_ACUTE[family].get(n)
        return ('D', column) if column else None
    if letter == 'O':
        if social:
            column = {1: 'non_akut_kunjungan', 2: 'non_akut_fasilitas'}.get(n)
        elif n <= 2:
            column = 'akut_kunjungan'
        elif n <= 4:
            column = 'akut_fasilitas'
        elif n <= 7:
            column = 'non_akut_kunjungan'
        elif n <= 10:
            column = 'non_akut_fasilitas'
        else:
            column = None
        return ('O', column) if column else None
    if letter == 'A':
        column = _ACCESS_COLUMNS.get(n)
        return ('A', column) if column else None
    # Information: I1.x is a consultation topic, I2.x how it is delivered.
    if n == 1 and rest:
        column = _INFO_TOPICS.get(int(rest.split('.')[1]))
    else:
        column = _INFO_CHANNELS.get(f'{n}{rest}')
    return ('I', column) if column else None


def bucket_keys(facility_types):
    """Provider buckets for Q4's (multi-select) facility types, deduplicated."""
    keys = []
    for label in facility_types:
        key = _BUCKET_BY_TYPE.get(' '.join(label.lower().split()), OTHER_BUCKET[0])
        if key not in keys:
            keys.append(key)
    return keys or [OTHER_BUCKET[0]]


@dataclass
class Facility:
    id: int
    name: str
    surveyed_at: object = None
    facility_types: list = field(default_factory=list)
    # DESDE-LTC code -> the block's capacity or beneficiary count (0 if unreported)
    services: dict = field(default_factory=dict)


def load_facilities(responses):
    """Every survey in `responses` as a `Facility`, in three flat queries.

    Reads plain values rather than model instances: the page needs a handful
    of fields from ~14k answers, and building ORM objects for all of them (as
    the viewset's shared prefetch does) was most of the request time.
    """
    from .models import QuestionAnswer

    facilities = {
        row['id']: Facility(
            id=row['id'],
            name=(row['service__name'] or '').strip(),
            surveyed_at=row['survey_date'],
        )
        for row in responses.values('id', 'survey_date', 'service__name')
    }

    answers = QuestionAnswer.objects.filter(response_id__in=facilities).filter(
        Q(question__code='Q1') | ~Q(context_key='')
    )
    for row in answers.values('response_id', 'question__code', 'context_key', 'text_value', 'number_value'):
        facility = facilities[row['response_id']]
        if row['question__code'] == 'Q1':
            # The name as the surveyor typed it wins over the linked service's.
            facility.name = (row['text_value'] or '').strip() or facility.name
            continue
        # Detail answers carry their branch's code.
        ctx = row['context_key']
        facility.services.setdefault(ctx, 0)
        if row['question__code'] in VOLUME_QUESTIONS and row['number_value'] is not None:
            facility.services[ctx] += int(row['number_value'])

    choices = QuestionAnswer.selected_choices.through.objects.filter(
        questionanswer__response_id__in=facilities
    ).filter(Q(questionanswer__question__code='Q4') | ~Q(questionchoice__kode_desde_ltc=''))
    for row in choices.values(
        'questionanswer__response_id', 'questionanswer__question__code',
        'questionchoice__label', 'questionchoice__kode_desde_ltc',
    ):
        facility = facilities[row['questionanswer__response_id']]
        label = (row['questionchoice__label'] or '').strip()
        if row['questionanswer__question__code'] == 'Q4' and label:
            facility.facility_types.append(label)
        # The choices that open a branch name it too, which catches a branch
        # whose block has no number.
        if row['questionchoice__kode_desde_ltc']:
            facility.services.setdefault(row['questionchoice__kode_desde_ltc'].replace(' ', ''), 0)

    for facility in facilities.values():
        facility.name = facility.name or 'Tanpa nama'
    return list(facilities.values())


def facility_key(name):
    """Names typed on different days differ in case and punctuation only."""
    return ' '.join(re.sub(r'[^a-z0-9]+', ' ', name.lower()).split())


def latest_per_facility(facilities):
    """One survey per facility name: the most recent, ties to the highest id."""
    latest = {}
    for facility in facilities:
        key = facility_key(facility.name)
        current = latest.get(key)
        if current is None or (facility.surveyed_at, facility.id) > (current.surveyed_at, current.id):
            latest[key] = facility
    return list(latest.values())


def _columns(facility):
    """{(service type, column): summed volume} for one facility."""
    columns = {}
    for code, volume in facility.services.items():
        key = classify(code)
        if key:
            columns[key] = columns.get(key, 0) + volume
    return columns


def _cell():
    return {'fasilitas': 0, 'jumlah': 0}


def _bucket_table(rows_by_bucket, bucket_order, column_names):
    rows = [
        {'provider': key, **{c: rows_by_bucket[key][c] for c in column_names}}
        for key in bucket_order
    ]
    total = {c: _cell() for c in column_names}
    for row in rows:
        for c in column_names:
            total[c]['fasilitas'] += row[c]['fasilitas']
            total[c]['jumlah'] += row[c]['jumlah']
    return {'rows': rows, 'total': total}


def facility_type_chart(surveys):
    """Surveys per Q4 facility type, and how many of them offer each service type.

    Counts every survey, like the landing page's "Jenis fasilitas" panel, so
    the two agree; the tables below it count each facility's latest survey.
    Q4 is multi-select, so a survey counts under each type it ticked; one with
    no Q4 answer has no type to count under and is left out, as it is there.
    """
    # normalised label -> row, keeping the label as first answered
    rows = {}
    for survey in surveys:
        offered = {service_type for service_type, _column in _columns(survey)}
        for label in dict.fromkeys(survey.facility_types):
            row = rows.setdefault(
                ' '.join(label.lower().split()),
                {'facility_type': label, 'total': 0, **{t: 0 for t, _l in SERVICE_TYPES}},
            )
            row['total'] += 1
            for service_type in offered:
                row[service_type] += 1
    return list(rows.values())


def summarize(surveys):
    """The whole page payload: chart series plus the five service tabs."""
    surveys = list(surveys)
    facilities = sorted(latest_per_facility(surveys), key=lambda f: f.name.lower())
    all_buckets = [(key, label) for key, label, _types in BUCKETS] + [OTHER_BUCKET]

    tables = {
        'O': ['akut_kunjungan', 'akut_fasilitas', 'non_akut_kunjungan', 'non_akut_fasilitas'],
        'A': list(_ACCESS_COLUMNS.values()),
        'I_topik': list(_INFO_TOPICS.values()),
        'I_saluran': list(_INFO_CHANNELS.values()),
    }
    per_bucket = {
        name: {key: {c: _cell() for c in cols} for key, _label in all_buckets}
        for name, cols in tables.items()
    }
    used_buckets = set()
    rawat_inap, perawatan_harian = [], []

    for facility in facilities:
        columns = _columns(facility)
        buckets = bucket_keys(facility.facility_types)
        used_buckets.update(buckets)
        offered_types = {service_type for service_type, _column in columns}

        for key in buckets:
            for (service_type, column), volume in columns.items():
                table = service_type
                if service_type == 'I':
                    table = 'I_topik' if column in _INFO_TOPICS.values() else 'I_saluran'
                if table in per_bucket:
                    cell = per_bucket[table][key][column]
                    cell['fasilitas'] += 1
                    cell['jumlah'] += volume

        if 'R' in offered_types:
            rawat_inap.append({
                'id': facility.id,
                'name': facility.name,
                **{
                    column: {
                        'tersedia': ('R', column) in columns,
                        'kapasitas': columns.get(('R', column), 0),
                    }
                    for column in ('akut', 'non_akut')
                },
            })
        if 'D' in offered_types:
            non_acute = list(_DAY_CARE_NON_ACUTE['SD'].values())
            perawatan_harian.append({
                'id': facility.id,
                'name': facility.name,
                'akut': {
                    'tersedia': ('D', 'akut') in columns,
                    'kapasitas': columns.get(('D', 'akut'), 0),
                },
                'non_akut': {
                    **{column: ('D', column) in columns for column in non_acute},
                    'kapasitas': sum(columns.get(('D', column), 0) for column in non_acute),
                },
            })

    # "Lainnya" only earns a row when some facility actually falls into it.
    bucket_order = [key for key, _label in all_buckets if key != OTHER_BUCKET[0] or key in used_buckets]

    return {
        'total_facilities': len(facilities),
        'providers': [{'key': key, 'label': label} for key, label in all_buckets if key in bucket_order],
        'service_types': [{'key': key, 'label': label} for key, label in SERVICE_TYPES],
        'total_surveys': len(surveys),
        'chart': facility_type_chart(surveys),
        'rawat_inap': rawat_inap,
        'perawatan_harian': perawatan_harian,
        'rawat_jalan': _bucket_table(per_bucket['O'], bucket_order, tables['O']),
        'aksesibilitas': _bucket_table(per_bucket['A'], bucket_order, tables['A']),
        'informasi_topik': _bucket_table(per_bucket['I_topik'], bucket_order, tables['I_topik']),
        'informasi_saluran': _bucket_table(per_bucket['I_saluran'], bucket_order, tables['I_saluran']),
    }
