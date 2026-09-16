from rest_framework import serializers

from .models import SecondaryDataset, SecondaryIndicator, KecamatanIndicatorValue


class KecamatanIndicatorValueSerializer(serializers.ModelSerializer):
    kecamatan_name = serializers.CharField(source='kecamatan.name', read_only=True)

    class Meta:
        model = KecamatanIndicatorValue
        fields = ['kecamatan', 'kecamatan_name', 'value_male', 'value_female', 'value_total']


class SecondaryIndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecondaryIndicator
        fields = ['id', 'code', 'name', 'unit', 'order', 'is_population', 'is_aggregate']


class SecondaryDatasetSerializer(serializers.ModelSerializer):
    indicators = SecondaryIndicatorSerializer(many=True, read_only=True)

    class Meta:
        model = SecondaryDataset
        fields = [
            'id', 'name', 'slug', 'description', 'source', 'year',
            'is_published', 'indicators', 'updated_at',
        ]
