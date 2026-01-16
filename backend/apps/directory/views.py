from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, Avg

from .models import (
    MainTypeOfCare, BasicStableInputsOfCare, TargetPopulation,
    ServiceType, Service
)
from .serializers import (
    MainTypeOfCareSerializer, BasicStableInputsOfCareSerializer,
    TargetPopulationSerializer, ServiceTypeSerializer,
    ServiceListSerializer, ServiceDetailSerializer,
    ServiceCreateUpdateSerializer
)
from apps.accounts.permissions import IsSurveyorOrAdmin, CanAccessServiceData
from apps.accounts.mixins import StatusBasedFilterMixin
from apps.logs.utils import log_create, log_update, log_delete


class MainTypeOfCareViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for MainTypeOfCare (read-only)
    """
    queryset = MainTypeOfCare.objects.filter(is_active=True)
    serializer_class = MainTypeOfCareSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name']
    ordering = ['code']

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get hierarchical tree structure of MTC"""
        root_mtcs = MainTypeOfCare.objects.filter(parent__isnull=True, is_active=True)
        serializer = self.get_serializer(root_mtcs, many=True)
        return Response(serializer.data)


class BasicStableInputsOfCareViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for BasicStableInputsOfCare (read-only)
    """
    queryset = BasicStableInputsOfCare.objects.filter(is_active=True)
    serializer_class = BasicStableInputsOfCareSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name']
    ordering = ['code']


class TargetPopulationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for TargetPopulation (read-only)
    """
    queryset = TargetPopulation.objects.filter(is_active=True)
    serializer_class = TargetPopulationSerializer
    permission_classes = [IsAuthenticated]
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
        surveys = Survey.objects.filter(service=service).order_by('-survey_date')

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
