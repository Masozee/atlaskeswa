from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget

from .models import (
    MainTypeOfCare, BasicStableInputsOfCare, TargetPopulation,
    ServiceType, KategoriLayanan, KategoriFasilitas, Service
)


class MainTypeOfCareResource(resources.ModelResource):
    parent = fields.Field(
        column_name='parent',
        attribute='parent',
        widget=ForeignKeyWidget(MainTypeOfCare, field='code'),
    )

    class Meta:
        model = MainTypeOfCare
        fields = ('id', 'code', 'name', 'description', 'parent', 'is_healthcare', 'service_delivery_type', 'level', 'is_active', 'created_at')
        export_order = ('id', 'code', 'name', 'description', 'parent', 'is_healthcare', 'service_delivery_type', 'level', 'is_active', 'created_at')
        import_id_fields = ('code',)
        skip_unchanged = True


class KategoriLayananResource(resources.ModelResource):
    class Meta:
        model = KategoriLayanan
        fields = ('id', 'code', 'name', 'description', 'is_active', 'created_at')
        export_order = ('id', 'code', 'name', 'description', 'is_active', 'created_at')
        import_id_fields = ('code',)
        skip_unchanged = True


class KategoriFasilitasResource(resources.ModelResource):
    class Meta:
        model = KategoriFasilitas
        fields = ('id', 'code', 'name', 'description', 'facility_type', 'is_active', 'created_at')
        export_order = ('id', 'code', 'name', 'description', 'facility_type', 'is_active', 'created_at')
        import_id_fields = ('code',)
        skip_unchanged = True


class BSICResource(resources.ModelResource):
    kategori_layanan = fields.Field(
        column_name='kategori_layanan',
        attribute='kategori_layanan',
        widget=ForeignKeyWidget(KategoriLayanan, field='name'),
    )

    class Meta:
        model = BasicStableInputsOfCare
        fields = ('id', 'code', 'name', 'kategori_layanan', 'kategori_fasilitas', 'description', 'is_active', 'created_at')
        export_order = ('id', 'code', 'name', 'kategori_layanan', 'kategori_fasilitas', 'description', 'is_active', 'created_at')
        import_id_fields = ('code',)
        skip_unchanged = True


class TargetPopulationResource(resources.ModelResource):
    class Meta:
        model = TargetPopulation
        fields = ('id', 'name', 'description', 'is_active', 'created_at')
        export_order = ('id', 'name', 'description', 'is_active', 'created_at')
        import_id_fields = ('name',)
        skip_unchanged = True


class ServiceTypeResource(resources.ModelResource):
    class Meta:
        model = ServiceType
        fields = ('id', 'name', 'description', 'is_active', 'created_at')
        export_order = ('id', 'name', 'description', 'is_active', 'created_at')
        import_id_fields = ('name',)
        skip_unchanged = True


class ServiceResource(resources.ModelResource):
    mtc = fields.Field(
        column_name='mtc',
        attribute='mtc',
        widget=ForeignKeyWidget(MainTypeOfCare, field='code'),
    )
    bsic = fields.Field(
        column_name='bsic',
        attribute='bsic',
        widget=ForeignKeyWidget(BasicStableInputsOfCare, field='code'),
    )
    service_type = fields.Field(
        column_name='service_type',
        attribute='service_type',
        widget=ForeignKeyWidget(ServiceType, field='name'),
    )
    target_populations = fields.Field(
        column_name='target_populations',
        attribute='target_populations',
        widget=ManyToManyWidget(TargetPopulation, field='name', separator='|'),
    )

    class Meta:
        model = Service
        fields = (
            'id', 'name', 'description',
            'mtc', 'bsic', 'service_type', 'target_populations',
            'phone_number', 'email', 'website',
            'address', 'city', 'province', 'postal_code', 'latitude', 'longitude',
            'bed_capacity', 'staff_count', 'psychiatrist_count', 'psychologist_count',
            'nurse_count', 'social_worker_count',
            'operating_hours', 'is_24_7', 'accepts_emergency',
            'accepts_bpjs', 'accepts_private_insurance', 'funding_sources',
            'is_verified', 'is_active', 'created_at',
        )
        export_order = (
            'id', 'name', 'description',
            'mtc', 'bsic', 'service_type', 'target_populations',
            'phone_number', 'email', 'website',
            'address', 'city', 'province', 'postal_code', 'latitude', 'longitude',
            'bed_capacity', 'staff_count', 'psychiatrist_count', 'psychologist_count',
            'nurse_count', 'social_worker_count',
            'operating_hours', 'is_24_7', 'accepts_emergency',
            'accepts_bpjs', 'accepts_private_insurance', 'funding_sources',
            'is_verified', 'is_active', 'created_at',
        )
        import_id_fields = ('id',)
        skip_unchanged = True
