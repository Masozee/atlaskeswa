from rest_framework import serializers
from .models import MainTypeOfCare, BasicStableInputsOfCare, TargetPopulation, ServiceType, Service


class MainTypeOfCareSerializer(serializers.ModelSerializer):
    """Serializer for MTC classification"""

    children_count = serializers.SerializerMethodField()

    class Meta:
        model = MainTypeOfCare
        fields = ['id', 'code', 'name', 'description', 'parent', 'is_active', 'children_count', 'created_at', 'updated_at']

    def get_children_count(self, obj):
        return obj.children.count()


class BasicStableInputsOfCareSerializer(serializers.ModelSerializer):
    """Serializer for BSIC classification"""

    class Meta:
        model = BasicStableInputsOfCare
        fields = ['id', 'code', 'name', 'description', 'is_active', 'created_at', 'updated_at']


class TargetPopulationSerializer(serializers.ModelSerializer):
    """Serializer for target population"""

    class Meta:
        model = TargetPopulation
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']


class ServiceTypeSerializer(serializers.ModelSerializer):
    """Serializer for service type"""

    class Meta:
        model = ServiceType
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']


class ServiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for service listing"""

    mtc_code = serializers.CharField(source='mtc.code', read_only=True)
    mtc_name = serializers.CharField(source='mtc.name', read_only=True)
    bsic_code = serializers.CharField(source='bsic.code', read_only=True)
    bsic_name = serializers.CharField(source='bsic.name', read_only=True)
    service_type_name = serializers.CharField(source='service_type.name', read_only=True)
    total_professional_staff = serializers.ReadOnlyField()

    class Meta:
        model = Service
        fields = [
            'id', 'name', 'city', 'province', 'mtc_code', 'mtc_name',
            'bsic_code', 'bsic_name', 'service_type_name', 'bed_capacity',
            'total_professional_staff', 'is_verified', 'is_active', 'created_at'
        ]


class ServiceDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for service"""

    mtc = MainTypeOfCareSerializer(read_only=True)
    bsic = BasicStableInputsOfCareSerializer(read_only=True)
    service_type = ServiceTypeSerializer(read_only=True)
    target_populations = TargetPopulationSerializer(many=True, read_only=True)
    total_professional_staff = serializers.ReadOnlyField()
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    verified_by_email = serializers.EmailField(source='verified_by.email', read_only=True)

    # Write-only fields for creation/update
    mtc_id = serializers.PrimaryKeyRelatedField(
        queryset=MainTypeOfCare.objects.all(),
        source='mtc',
        write_only=True
    )
    bsic_id = serializers.PrimaryKeyRelatedField(
        queryset=BasicStableInputsOfCare.objects.all(),
        source='bsic',
        write_only=True
    )
    service_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceType.objects.all(),
        source='service_type',
        write_only=True
    )
    target_population_ids = serializers.PrimaryKeyRelatedField(
        queryset=TargetPopulation.objects.all(),
        source='target_populations',
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = Service
        fields = [
            'id', 'name', 'description', 'mtc', 'mtc_id', 'bsic', 'bsic_id',
            'service_type', 'service_type_id', 'target_populations', 'target_population_ids',
            'phone_number', 'email', 'website', 'address', 'city', 'province',
            'postal_code', 'latitude', 'longitude', 'bed_capacity', 'staff_count',
            'psychiatrist_count', 'psychologist_count', 'nurse_count', 'social_worker_count',
            'total_professional_staff', 'operating_hours', 'is_24_7', 'accepts_emergency',
            'accepts_bpjs', 'accepts_private_insurance', 'funding_sources',
            'is_verified', 'is_active', 'created_by', 'created_by_email',
            'verified_by', 'verified_by_email', 'verified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'verified_by', 'verified_at', 'created_at', 'updated_at']


class ServiceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating services"""

    target_population_ids = serializers.PrimaryKeyRelatedField(
        queryset=TargetPopulation.objects.all(),
        source='target_populations',
        many=True,
        required=False
    )

    class Meta:
        model = Service
        fields = [
            'name', 'description', 'mtc', 'bsic', 'service_type',
            'target_population_ids', 'phone_number', 'email', 'website',
            'address', 'city', 'province', 'postal_code', 'latitude', 'longitude',
            'bed_capacity', 'staff_count', 'psychiatrist_count', 'psychologist_count',
            'nurse_count', 'social_worker_count', 'operating_hours', 'is_24_7',
            'accepts_emergency', 'accepts_bpjs', 'accepts_private_insurance',
            'funding_sources', 'is_active'
        ]
