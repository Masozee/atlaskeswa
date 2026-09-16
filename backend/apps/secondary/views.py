from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.survey.models import GeographicUnit

from .models import SecondaryDataset
from .serializers import SecondaryDatasetSerializer
from .services import (
    choropleth_series, combined_total, dataset_rows, published_dataset, rate_per_10k
)


@api_view(['GET'])
@permission_classes([AllowAny])
def dataset_list(request):
    """Published secondary datasets and their indicators.

    Public: the landing map and the kecamatan pages are anonymous surfaces.
    """
    datasets = SecondaryDataset.objects.filter(is_published=True).prefetch_related('indicators')
    return Response(SecondaryDatasetSerializer(datasets, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def choropleth(request):
    """Per-kecamatan values for the map, already divided per 10,000.

    `?dataset=` picks an edition (default: the newest published one) and
    `?indicator=` a single column (default: the clinical indicators summed).
    """
    dataset = published_dataset(request.query_params.get('dataset'))
    if dataset is None:
        return Response({'dataset': None, 'series': []})

    indicator_code = request.query_params.get('indicator') or None
    series = choropleth_series(dataset, indicator_code)
    return Response({
        'dataset': SecondaryDatasetSerializer(dataset).data,
        'indicator': indicator_code or 'gabungan',
        'series': series,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def kecamatan_detail(request, name):
    """Every published indicator for one kecamatan, matched on its name.

    The name is what the map's geojson and the survey answers both carry, so
    the public pages can link straight from either without an id lookup.
    """
    unit = get_object_or_404(
        GeographicUnit, level='KECAMATAN', name__iexact=name.replace('-', ' ')
    )

    datasets = []
    for dataset in SecondaryDataset.objects.filter(is_published=True).prefetch_related('indicators'):
        row = next((r for r in dataset_rows(dataset) if r['kecamatan_id'] == unit.id), None)
        if row is None:
            continue
        total = combined_total(row['indicators'])
        datasets.append({
            'dataset': SecondaryDatasetSerializer(dataset).data,
            'population': row['population'],
            'indicators': row['indicators'],
            'combined_total': total,
            'combined_per_10k': rate_per_10k(total, row['population']),
        })

    return Response({
        'kecamatan': {'id': unit.id, 'name': unit.name, 'code': unit.code},
        'datasets': datasets,
    })
