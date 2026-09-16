"""Read helpers shared by the kecamatan page and the choropleth.

Rates live here rather than on the model: they need a denominator from a
*different* row (the dataset's population indicator), so computing them one
object at a time would be a query per kecamatan.
"""

from decimal import Decimal

from .models import SecondaryDataset, KecamatanIndicatorValue

PER = Decimal('10000')


def population_by_kecamatan(dataset):
    """{kecamatan_id: total} from whichever indicator is marked as population."""
    return {
        v.kecamatan_id: v.value_total
        for v in KecamatanIndicatorValue.objects.filter(
            indicator__dataset=dataset, indicator__is_population=True
        )
        if v.value_total
    }


def rate_per_10k(value, population):
    """Cases per 10,000 people, or None when either side is missing."""
    if value is None or not population:
        return None
    return round(float(Decimal(value) / Decimal(population) * PER), 2)


def dataset_rows(dataset):
    """Every value in the dataset, grouped per kecamatan, with rates attached.

    One query for the values and one for the population, whatever the number of
    kecamatan or indicators.
    """
    population = population_by_kecamatan(dataset)
    rows = {}
    values = KecamatanIndicatorValue.objects.filter(
        indicator__dataset=dataset
    ).select_related('indicator', 'kecamatan').order_by('indicator__order')

    for value in values:
        row = rows.setdefault(value.kecamatan_id, {
            'kecamatan_id': value.kecamatan_id,
            'kecamatan': value.kecamatan.name,
            'population': population.get(value.kecamatan_id),
            'indicators': [],
        })
        if value.indicator.is_population:
            continue
        row['indicators'].append({
            'code': value.indicator.code,
            'name': value.indicator.name,
            'unit': value.indicator.unit,
            'is_aggregate': value.indicator.is_aggregate,
            'male': value.value_male,
            'female': value.value_female,
            'total': value.value_total,
            'per_10k': rate_per_10k(value.value_total, population.get(value.kecamatan_id)),
        })
    return sorted(rows.values(), key=lambda r: r['kecamatan'])


def combined_total(indicators):
    """Sum of the clinical indicators, skipping the source's own aggregates.

    ODGJ Berat (SPM) is skizofrenia + psikotik akut already, so adding it to the
    parts it is made of would count those people twice.
    """
    total = Decimal('0')
    seen = False
    for item in indicators:
        if item['is_aggregate'] or item['total'] is None:
            continue
        total += Decimal(item['total'])
        seen = True
    return total if seen else None


def choropleth_series(dataset, indicator_code=None):
    """One row per kecamatan for the map: value, population, per 10,000.

    `indicator_code` picks a single indicator; the default sums the clinical
    ones, which is what the landing map colours by.
    """
    series = []
    for row in dataset_rows(dataset):
        if indicator_code:
            match = next((i for i in row['indicators'] if i['code'] == indicator_code), None)
            value = match['total'] if match else None
        else:
            value = combined_total(row['indicators'])
        series.append({
            'kecamatan_id': row['kecamatan_id'],
            'kecamatan': row['kecamatan'],
            'population': row['population'],
            'value': value,
            'per_10k': rate_per_10k(value, row['population']),
        })
    return series


def published_dataset(slug=None):
    """The dataset to read: the requested slug, else the most recent published."""
    qs = SecondaryDataset.objects.filter(is_published=True)
    if slug:
        return qs.filter(slug=slug).first()
    return qs.order_by('-year', '-updated_at').first()
