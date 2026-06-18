import csv
import io
import tablib
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse, FileResponse
from django.db.models.deletion import ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, Avg, Subquery, OuterRef

from .resources import BSICResource, KategoriLayananResource, ServiceResource
from .models import (
    MainTypeOfCare, BasicStableInputsOfCare, TargetPopulation,
    ServiceType, Service, KategoriLayanan, KategoriFasilitas
)
from .serializers import (
    MainTypeOfCareSerializer, BasicStableInputsOfCareSerializer,
    TargetPopulationSerializer, ServiceTypeSerializer,
    ServiceListSerializer, ServiceDetailSerializer,
    ServiceCreateUpdateSerializer,
    KategoriLayananSerializer, KategoriFasilitasSerializer,
)
from apps.accounts.permissions import IsSurveyorOrAdmin, CanAccessServiceData, IsAdmin
from apps.accounts.mixins import StatusBasedFilterMixin
from apps.logs.utils import log_create, log_update, log_delete


class MainTypeOfCareViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for MainTypeOfCare (read-only)
    """
    queryset = MainTypeOfCare.objects.filter(is_active=True).annotate(
        children_count=Count('children')
    )
    serializer_class = MainTypeOfCareSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name']
    ordering = ['code']

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get hierarchical tree structure of MTC"""
        root_mtcs = MainTypeOfCare.objects.filter(parent__isnull=True, is_active=True).annotate(
            children_count=Count('children')
        )
        serializer = self.get_serializer(root_mtcs, many=True)
        return Response(serializer.data)


class BasicStableInputsOfCareViewSet(viewsets.ModelViewSet):
    """
    ViewSet for BasicStableInputsOfCare with full CRUD and bulk operations.
    Write operations (create/update/delete) require admin role.
    """
    queryset = BasicStableInputsOfCare.objects.all()
    serializer_class = BasicStableInputsOfCareSerializer
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name']
    ordering = ['code']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy',
                           'bulk_delete', 'bulk_update', 'import_csv']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            return Response(
                {'detail': 'Cannot delete this BSIC category because it is referenced by existing services.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Delete multiple BSIC categories by IDs."""
        ids = request.data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response({'detail': 'ids must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            deleted_count, _ = BasicStableInputsOfCare.objects.filter(id__in=ids).delete()
        except ProtectedError:
            return Response(
                {'detail': 'Cannot delete one or more BSIC categories because they are referenced by existing services.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response({'deleted': deleted_count})

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """Update a field on multiple BSIC categories by IDs."""
        ids = request.data.get('ids', [])
        updates = request.data.get('updates', {})
        allowed_fields = {'is_active', 'description'}
        invalid = set(updates.keys()) - allowed_fields
        if not ids or not isinstance(ids, list):
            return Response({'detail': 'ids must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)
        if invalid:
            return Response({'detail': f'Fields not allowed for bulk update: {invalid}'}, status=status.HTTP_400_BAD_REQUEST)
        updated_count = BasicStableInputsOfCare.objects.filter(id__in=ids).update(**updates)
        return Response({'updated': updated_count})

    @action(detail=False, methods=['post'], url_path='import')
    def import_csv(self, request):
        """Import BSIC categories from CSV, XLSX, or JSON. Required columns: code, name."""
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        update_existing = request.data.get('update_existing', 'false')
        if isinstance(update_existing, str):
            update_existing = update_existing.lower() in ('true', '1', 'yes')

        filename = file.name.lower()
        fmt = 'xlsx' if filename.endswith('.xlsx') else 'json' if filename.endswith('.json') else 'csv'

        try:
            if fmt == 'xlsx':
                dataset = tablib.Dataset().load(file.read(), headers=True, format='xlsx')
            elif fmt == 'json':
                dataset = tablib.Dataset().load(file.read().decode('utf-8'), format='json')
            else:
                dataset = tablib.Dataset().load(file.read().decode('utf-8'), format='csv')
        except Exception as e:
            return Response({'detail': f'Could not read file: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        resource = BSICResource()
        result = resource.import_data(dataset, dry_run=False, raise_errors=False,
                                      use_transactions=True, collect_failed_rows=True)

        errors = []
        for row_error in result.row_errors():
            row_num, row_errors = row_error
            for err in row_errors:
                errors.append({'row': row_num, 'error': str(err.error)})

        return Response({
            'created': result.totals.get('new', 0),
            'updated': result.totals.get('update', 0),
            'errors': errors,
        })

    @action(detail=False, methods=['get'], url_path='export', url_name='export')
    def export_data(self, request):
        """Export BSIC categories as CSV/XLSX/JSON. Accepts ?ids=1,2,3 and ?file_format=csv|xlsx|json."""
        ids_param = request.query_params.get('ids')
        fmt = request.query_params.get('file_format', 'csv').lower()
        qs = BasicStableInputsOfCare.objects.select_related('kategori_layanan').all().order_by('code')
        if ids_param:
            ids = [i for i in ids_param.split(',') if i.strip().isdigit()]
            qs = qs.filter(id__in=ids)

        resource = BSICResource()
        dataset = resource.export(qs)

        if fmt == 'xlsx':
            buf = io.BytesIO(dataset.xlsx)
            response = FileResponse(buf, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename="bsic_categories.xlsx"'
        elif fmt == 'json':
            response = HttpResponse(dataset.json, content_type='application/json')
            response['Content-Disposition'] = 'attachment; filename="bsic_categories.json"'
        else:
            response = HttpResponse(dataset.csv, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="bsic_categories.csv"'
        return response


class TargetPopulationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for TargetPopulation (read-only)
    """
    queryset = TargetPopulation.objects.filter(is_active=True)
    serializer_class = TargetPopulationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    ordering = ['name']


class ServiceTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for ServiceType (read-only)
    """
    queryset = ServiceType.objects.filter(is_active=True)
    serializer_class = ServiceTypeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    ordering = ['name']


class ServiceViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for Service with comprehensive filtering and search
    Uses StatusBasedFilterMixin for RBAC filtering
    """
    queryset = Service.objects.select_related(
        'mtc', 'bsic', 'service_type', 'created_by', 'verified_by'
    ).prefetch_related('target_populations')
    permission_classes = [IsAuthenticated]

    # RBAC Mixin Configuration
    rbac_status_field = 'is_active'
    rbac_status_value = True
    rbac_admin_sees_inactive = True
    rbac_verifier_sees_inactive = False
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    filterset_fields = {
        'mtc': ['exact'],
        'bsic': ['exact'],
        'service_type': ['exact'],
        'city': ['exact', 'icontains'],
        'province': ['exact', 'icontains'],
        'is_active': ['exact'],
        'is_verified': ['exact'],
        'accepts_bpjs': ['exact'],
        'accepts_private_insurance': ['exact'],
        'is_24_7': ['exact'],
        'accepts_emergency': ['exact'],
        'bsic__kategori_fasilitas': ['exact'],
    }

    search_fields = [
        'name', 'description', 'address', 'city', 'province',
        'mtc__name', 'bsic__name', 'service_type__name'
    ]

    ordering_fields = [
        'name', 'city', 'created_at', 'bed_capacity',
        'staff_count', 'total_professional_staff'
    ]
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ServiceListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ServiceCreateUpdateSerializer
        return ServiceDetailSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [IsSurveyorOrAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Can modify if admin or owner
            return [IsSurveyorOrAdmin(), CanAccessServiceData()]
        elif self.action == 'import_csv':
            return [IsAdmin()]
        return [IsAuthenticated()]

    # get_queryset is now handled by StatusBasedFilterMixin
    # The mixin automatically filters based on role:
    # - ADMIN: sees all services (including inactive)
    # - VERIFIER: sees all services
    # - SURVEYOR/VIEWER: see only active services

    def perform_create(self, serializer):
        """Set created_by to current user and log activity"""
        instance = serializer.save(created_by=self.request.user)
        log_create(self.request, instance, f'Created service: {instance.name}')

    def perform_update(self, serializer):
        """Update service and log activity"""
        instance = serializer.save()
        log_update(self.request, instance, f'Updated service: {instance.name}')

    def perform_destroy(self, instance):
        """Delete service and log activity"""
        log_delete(self.request, instance, f'Deleted service: {instance.name}')
        instance.delete()

    @action(detail=False, methods=['post'], url_path='import')
    def import_csv(self, request):
        """Import services from CSV, XLSX, or JSON. Required columns: name. FK columns by code/name."""
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        update_existing = request.data.get('update_existing', 'false')
        if isinstance(update_existing, str):
            update_existing = update_existing.lower() in ('true', '1', 'yes')

        filename = file.name.lower()
        fmt = 'xlsx' if filename.endswith('.xlsx') else 'json' if filename.endswith('.json') else 'csv'

        try:
            if fmt == 'xlsx':
                dataset = tablib.Dataset().load(file.read(), headers=True, format='xlsx')
            elif fmt == 'json':
                dataset = tablib.Dataset().load(file.read().decode('utf-8'), format='json')
            else:
                dataset = tablib.Dataset().load(file.read().decode('utf-8'), format='csv')
        except Exception as e:
            return Response({'detail': f'Could not read file: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        resource = ServiceResource()
        result = resource.import_data(dataset, dry_run=False, raise_errors=False,
                                      use_transactions=True, collect_failed_rows=True)

        errors = []
        for row_error in result.row_errors():
            row_num, row_errors = row_error
            for err in row_errors:
                errors.append({'row': row_num, 'error': str(err.error)})

        return Response({
            'created': result.totals.get('new', 0),
            'updated': result.totals.get('update', 0),
            'errors': errors,
        })

    @action(detail=False, methods=['get'], url_path='export', url_name='export')
    def export_data(self, request):
        """Export services as CSV/XLSX/JSON. Accepts ?ids=1,2,3 and ?file_format=csv|xlsx|json."""
        ids_param = request.query_params.get('ids')
        fmt = request.query_params.get('file_format', 'csv').lower()
        qs = self.get_queryset().order_by('id')
        if ids_param:
            ids = [i for i in ids_param.split(',') if i.strip().isdigit()]
            qs = qs.filter(id__in=ids)

        resource = ServiceResource()
        dataset = resource.export(qs)

        if fmt == 'xlsx':
            buf = io.BytesIO(dataset.xlsx)
            response = FileResponse(buf, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename="services.xlsx"'
        elif fmt == 'json':
            response = HttpResponse(dataset.json, content_type='application/json')
            response['Content-Disposition'] = 'attachment; filename="services.json"'
        else:
            response = HttpResponse(dataset.csv, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="services.csv"'
        return response

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get service statistics"""
        queryset = self.get_queryset()

        total_services = queryset.count()
        verified_services = queryset.filter(is_verified=True).count()
        active_services = queryset.filter(is_active=True).count()

        # Services by MTC
        mtc_distribution = queryset.values('mtc__code', 'mtc__name').annotate(
            count=Count('id')
        ).order_by('-count')

        # Services by province
        province_distribution = queryset.values('province').annotate(
            count=Count('id')
        ).order_by('-count')

        # Services by type
        type_distribution = queryset.values('service_type__name').annotate(
            count=Count('id')
        ).order_by('-count')

        # Capacity statistics
        total_beds = queryset.aggregate(
            total=Count('bed_capacity')
        )['total'] or 0

        total_staff = queryset.aggregate(
            total=Count('staff_count')
        )['total'] or 0

        # Emergency and insurance services
        emergency_services = queryset.filter(accepts_emergency=True).count()
        twentyfour_seven = queryset.filter(is_24_7=True).count()
        bpjs_services = queryset.filter(accepts_bpjs=True).count()

        return Response({
            'total_services': total_services,
            'verified_services': verified_services,
            'unverified_services': total_services - verified_services,
            'active_services': active_services,
            'inactive_services': total_services - active_services,
            'mtc_distribution': list(mtc_distribution)[:10],
            'province_distribution': list(province_distribution),
            'type_distribution': list(type_distribution),
            'total_bed_capacity': total_beds,
            'total_staff': total_staff,
            'emergency_services': emergency_services,
            'twentyfour_seven_services': twentyfour_seven,
            'bpjs_accepting_services': bpjs_services
        })

    @action(detail=True, methods=['get'])
    def surveys(self, request, pk=None):
        """Get all surveys for this service"""
        from apps.survey.serializers import SurveyListSerializer
        from apps.survey.models import Survey

        service = self.get_object()
        surveys = Survey.objects.filter(service=service).select_related(
            'service', 'surveyor', 'assigned_verifier'
        ).order_by('-survey_date')

        serializer = SurveyListSerializer(surveys, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def map(self, request):
        """Get services with coordinates for map view"""
        services = self.get_queryset().filter(
            latitude__isnull=False,
            longitude__isnull=False
        )

        serializer = ServiceListSerializer(services, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def quick_create(self, request):
        """Quick create a new service with minimal fields for survey purposes"""
        from .serializers import ServiceQuickCreateSerializer

        serializer = ServiceQuickCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Create service with minimal data - use defaults for required FKs
            service = Service.objects.create(
                name=serializer.validated_data['name'],
                kecamatan=serializer.validated_data.get('kecamatan', ''),
                city=serializer.validated_data.get('city', 'Kebumen'),
                # Required FKs - use first available or create placeholder
                mtc_id=request.data.get('mtc') or self._get_default_mtc(),
                bsic_id=request.data.get('bsic') or self._get_default_bsic(),
                service_type_id=request.data.get('service_type') or self._get_default_service_type(),
                created_by=request.user,
                is_active=True,
                is_verified=False,
            )
            log_create(request, service, f'Quick created service: {service.name}')
            return Response(
                ServiceDetailSerializer(service).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _get_default_mtc(self):
        """Get default MTC or create one"""
        from .models import MainTypeOfCare
        mtc, _ = MainTypeOfCare.objects.get_or_create(
            code='TBD',
            defaults={'name': 'To Be Determined', 'is_active': True}
        )
        return mtc.id

    def _get_default_bsic(self):
        """Get default BSIC or create one"""
        from .models import BasicStableInputsOfCare
        bsic, _ = BasicStableInputsOfCare.objects.get_or_create(
            code='TBD',
            defaults={
                'name': 'To Be Determined',
                'kategori_fasilitas': 'KESEHATAN',
                'is_active': True
            }
        )
        return bsic.id

    def _get_default_service_type(self):
        """Get default ServiceType or create one"""
        from .models import ServiceType
        st, _ = ServiceType.objects.get_or_create(
            name='To Be Determined',
            defaults={'is_active': True}
        )
        return st.id


class KategoriLayananViewSet(viewsets.ModelViewSet):
    """
    ViewSet for KategoriLayanan with full CRUD and bulk operations.
    Write operations require admin role.
    """
    queryset = KategoriLayanan.objects.all()
    serializer_class = KategoriLayananSerializer
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name']
    ordering = ['code']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy',
                           'bulk_delete', 'bulk_update', 'import_csv']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response({'detail': 'ids must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)
        deleted_count, _ = KategoriLayanan.objects.filter(id__in=ids).delete()
        return Response({'deleted': deleted_count})

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        ids = request.data.get('ids', [])
        updates = request.data.get('updates', {})
        allowed_fields = {'is_active', 'description'}
        invalid = set(updates.keys()) - allowed_fields
        if not ids or not isinstance(ids, list):
            return Response({'detail': 'ids must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)
        if invalid:
            return Response({'detail': f'Fields not allowed for bulk update: {invalid}'}, status=status.HTTP_400_BAD_REQUEST)
        updated_count = KategoriLayanan.objects.filter(id__in=ids).update(**updates)
        return Response({'updated': updated_count})

    @action(detail=False, methods=['post'], url_path='import')
    def import_csv(self, request):
        """Import Kategori Layanan from CSV, XLSX, or JSON. Required columns: code, name."""
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        filename = file.name.lower()
        fmt = 'xlsx' if filename.endswith('.xlsx') else 'json' if filename.endswith('.json') else 'csv'

        try:
            if fmt == 'xlsx':
                dataset = tablib.Dataset().load(file.read(), headers=True, format='xlsx')
            elif fmt == 'json':
                dataset = tablib.Dataset().load(file.read().decode('utf-8'), format='json')
            else:
                dataset = tablib.Dataset().load(file.read().decode('utf-8'), format='csv')
        except Exception as e:
            return Response({'detail': f'Could not read file: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        resource = KategoriLayananResource()
        result = resource.import_data(dataset, dry_run=False, raise_errors=False,
                                      use_transactions=True, collect_failed_rows=True)

        errors = []
        for row_num, row_errors in result.row_errors():
            for err in row_errors:
                errors.append({'row': row_num, 'error': str(err.error)})

        return Response({
            'created': result.totals.get('new', 0),
            'updated': result.totals.get('update', 0),
            'errors': errors,
        })

    @action(detail=False, methods=['get'], url_path='export', url_name='export')
    def export_data(self, request):
        """Export Kategori Layanan as CSV/XLSX/JSON. Accepts ?ids=1,2,3 and ?file_format=csv|xlsx|json."""
        ids_param = request.query_params.get('ids')
        fmt = request.query_params.get('file_format', 'csv').lower()
        qs = KategoriLayanan.objects.all().order_by('code')
        if ids_param:
            ids = [i for i in ids_param.split(',') if i.strip().isdigit()]
            qs = qs.filter(id__in=ids)

        resource = KategoriLayananResource()
        dataset = resource.export(qs)

        if fmt == 'xlsx':
            buf = io.BytesIO(dataset.xlsx)
            response = FileResponse(buf, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename="kategori_layanan.xlsx"'
        elif fmt == 'json':
            response = HttpResponse(dataset.json, content_type='application/json')
            response['Content-Disposition'] = 'attachment; filename="kategori_layanan.json"'
        else:
            response = HttpResponse(dataset.csv, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="kategori_layanan.csv"'
        return response


class KategoriFasilitasViewSet(viewsets.ModelViewSet):
    """
    ViewSet for KategoriFasilitas with full CRUD and bulk operations.
    Write operations require admin role.
    """
    queryset = KategoriFasilitas.objects.all()
    serializer_class = KategoriFasilitasSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {'facility_type': ['exact'], 'is_active': ['exact']}
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name', 'facility_type']
    ordering = ['code']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy',
                           'bulk_delete', 'bulk_update', 'import_csv']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response({'detail': 'ids must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)
        deleted_count, _ = KategoriFasilitas.objects.filter(id__in=ids).delete()
        return Response({'deleted': deleted_count})

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        ids = request.data.get('ids', [])
        updates = request.data.get('updates', {})
        allowed_fields = {'is_active', 'description', 'facility_type'}
        invalid = set(updates.keys()) - allowed_fields
        if not ids or not isinstance(ids, list):
            return Response({'detail': 'ids must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)
        if invalid:
            return Response({'detail': f'Fields not allowed for bulk update: {invalid}'}, status=status.HTTP_400_BAD_REQUEST)
        updated_count = KategoriFasilitas.objects.filter(id__in=ids).update(**updates)
        return Response({'updated': updated_count})

    @action(detail=False, methods=['post'], url_path='import')
    def import_csv(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            decoded = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
        except Exception as e:
            return Response({'detail': f'Could not read file: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        update_existing = request.data.get('update_existing', 'false')
        if isinstance(update_existing, str):
            update_existing = update_existing.lower() in ('true', '1', 'yes')

        valid_facility_types = {'KESEHATAN', 'NON_KESEHATAN'}
        created_count = 0
        updated_count = 0
        errors = []

        for i, row in enumerate(reader, start=2):
            norm = {k.strip().lower(): (v or '').strip() for k, v in row.items()}
            code = norm.get('code', '')
            name = norm.get('name', '')
            description = norm.get('description', '')

            # Accept 'facility_type' column (import) or map from display values
            raw_ft = norm.get('facility_type', '').upper()
            if raw_ft in valid_facility_types:
                facility_type = raw_ft
            elif 'kesehatan' in raw_ft and 'non' not in raw_ft:
                facility_type = 'KESEHATAN'
            elif 'non' in raw_ft:
                facility_type = 'NON_KESEHATAN'
            else:
                facility_type = 'KESEHATAN'

            if 'is_active' in norm:
                is_active_raw = norm['is_active'].lower()
            elif 'status' in norm:
                is_active_raw = 'true' if norm['status'].lower() == 'active' else 'false'
            else:
                is_active_raw = 'true'
            is_active = is_active_raw in ('true', '1', 'yes')

            if not code:
                errors.append({'row': i, 'error': 'Missing required field: code'})
                continue
            if not name:
                errors.append({'row': i, 'error': 'Missing required field: name'})
                continue

            existing = KategoriFasilitas.objects.filter(code=code).first()
            if existing:
                if update_existing:
                    existing.name = name
                    existing.description = description
                    existing.facility_type = facility_type
                    existing.is_active = is_active
                    existing.save()
                    updated_count += 1
                else:
                    errors.append({'row': i, 'error': f'Duplicate code: {code}'})
            else:
                KategoriFasilitas.objects.create(
                    code=code, name=name, description=description,
                    facility_type=facility_type, is_active=is_active
                )
                created_count += 1

        return Response({'created': created_count, 'updated': updated_count, 'errors': errors})

    @action(detail=False, methods=['get'], url_path='export', url_name='export')
    def export_data(self, request):
        ids_param = request.query_params.get('ids')
        qs = KategoriFasilitas.objects.all().order_by('code')
        if ids_param:
            ids = [i for i in ids_param.split(',') if i.strip().isdigit()]
            qs = qs.filter(id__in=ids)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="kategori_fasilitas.csv"'
        writer = csv.writer(response)
        writer.writerow(['ID', 'Code', 'Name', 'Description', 'Facility Type', 'Status', 'Created At'])
        for obj in qs:
            writer.writerow([
                obj.id, obj.code, obj.name,
                obj.description or '',
                obj.facility_type,
                'Active' if obj.is_active else 'Inactive',
                obj.created_at.strftime('%Y-%m-%d %H:%M') if obj.created_at else '',
            ])
        return response
