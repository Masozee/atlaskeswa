from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, Avg
from django.utils import timezone

from .models import Survey, SurveyAttachment, SurveyAuditLog
from .serializers import (
    SurveyListSerializer, SurveyDetailSerializer,
    SurveyCreateUpdateSerializer, SurveySubmitSerializer,
    SurveyVerifySerializer, SurveyAttachmentSerializer,
    SurveyAuditLogSerializer
)
from apps.accounts.permissions import (
    IsSurveyorOrAdmin, IsVerifierOrAdmin, IsSurveyOwnerOrReadOnly,
    CanModifySurveyStatus
)
from apps.accounts.mixins import SurveyorFilterMixin
from apps.logs.utils import (
    log_create, log_update, log_delete,
    log_survey_submit, log_survey_verify, log_survey_reject,
    log_file_upload
)


class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for Survey with verification workflow
    """
    queryset = Survey.objects.select_related(
        'service', 'surveyor', 'assigned_verifier', 'verified_by'
    )
    permission_classes = [IsAuthenticated, IsSurveyOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    filterset_fields = {
        'service': ['exact'],
        'surveyor': ['exact'],
        'verification_status': ['exact'],
        'assigned_verifier': ['exact'],
        'survey_date': ['exact', 'gte', 'lte'],
        'created_at': ['gte', 'lte'],
    }

    search_fields = [
        'service__name', 'surveyor__email', 'surveyor_notes',
        'verifier_notes', 'challenges_faced'
    ]

    ordering_fields = ['survey_date', 'created_at', 'verification_status']
    ordering = ['-survey_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return SurveyListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return SurveyCreateUpdateSerializer
        elif self.action == 'submit':
            return SurveySubmitSerializer
        elif self.action == 'verify':
            return SurveyVerifySerializer
        return SurveyDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsSurveyorOrAdmin(), IsSurveyOwnerOrReadOnly()]
        elif self.action == 'verify':
            return [IsVerifierOrAdmin(), CanModifySurveyStatus()]
        elif self.action == 'submit':
            return [IsSurveyorOrAdmin(), CanModifySurveyStatus()]
        return [IsAuthenticated(), IsSurveyOwnerOrReadOnly()]

    # RBAC Mixin Configuration
    rbac_surveyor_field = 'surveyor'
    rbac_verifier_field = 'assigned_verifier'
    rbac_status_field = 'verification_status'
    rbac_verified_status = 'VERIFIED'
    rbac_submitted_status = 'SUBMITTED'
    rbac_admin_sees_all = True
    rbac_allow_superuser = True

    # get_queryset is now handled by SurveyorFilterMixin
    # The mixin automatically filters based on role:
    # - ADMIN: sees all surveys
    # - SURVEYOR: sees own surveys (surveyor=user)
    # - VERIFIER: sees assigned + submitted surveys
    # - VIEWER: sees only verified surveys

    def perform_create(self, serializer):
        """Set surveyor to current user and log activity"""
        instance = serializer.save(surveyor=self.request.user)
        log_create(self.request, instance, f'Created survey for service: {instance.service.name}')

    def perform_update(self, serializer):
        """Update survey and log activity"""
        instance = serializer.save()
        log_update(self.request, instance, f'Updated survey for service: {instance.service.name}')

    def perform_destroy(self, instance):
        """Delete survey and log activity"""
        log_delete(self.request, instance, f'Deleted survey for service: {instance.service.name}')
        instance.delete()

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit survey for verification"""
        survey = self.get_object()

        # Check if survey can be submitted
        if survey.verification_status != Survey.Status.DRAFT:
            return Response(
                {'detail': 'Only draft surveys can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is the surveyor
        if survey.surveyor != request.user and request.user.role != 'ADMIN':
            return Response(
                {'detail': 'Only the surveyor can submit this survey'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = SurveySubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Update survey
        survey.verification_status = Survey.Status.SUBMITTED
        survey.submitted_at = timezone.now()

        # Assign verifier if provided
        if 'assigned_verifier' in serializer.validated_data:
            survey.assigned_verifier = serializer.validated_data['assigned_verifier']

        survey.save()

        # Create audit log
        SurveyAuditLog.objects.create(
            survey=survey,
            action=SurveyAuditLog.Action.SUBMITTED,
            user=request.user,
            previous_status=Survey.Status.DRAFT,
            new_status=Survey.Status.SUBMITTED,
            notes='Survey submitted for verification'
        )

        # Log activity
        log_survey_submit(request, survey)

        return Response(SurveyDetailSerializer(survey).data)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify or reject survey"""
        survey = self.get_object()

        # Check if survey can be verified
        if survey.verification_status != Survey.Status.SUBMITTED:
            return Response(
                {'detail': 'Only submitted surveys can be verified'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SurveyVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_type = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')

        previous_status = survey.verification_status

        if action_type == 'verify':
            survey.verification_status = Survey.Status.VERIFIED
            survey.verified_by = request.user
            survey.verified_at = timezone.now()
            survey.verifier_notes = notes
            audit_action = SurveyAuditLog.Action.VERIFIED
        else:  # reject
            survey.verification_status = Survey.Status.REJECTED
            survey.rejection_reason = serializer.validated_data.get('rejection_reason', '')
            survey.verifier_notes = notes
            audit_action = SurveyAuditLog.Action.REJECTED

        survey.save()

        # Create audit log
        SurveyAuditLog.objects.create(
            survey=survey,
            action=audit_action,
            user=request.user,
            previous_status=previous_status,
            new_status=survey.verification_status,
            notes=notes
        )

        # Log activity
        if action_type == 'verify':
            log_survey_verify(request, survey)
        else:
            log_survey_reject(request, survey, serializer.validated_data.get('rejection_reason', ''))

        return Response(SurveyDetailSerializer(survey).data)

    @action(detail=True, methods=['get'])
    def attachments(self, request, pk=None):
        """Get all attachments for this survey"""
        survey = self.get_object()
        attachments = SurveyAttachment.objects.filter(survey=survey)
        serializer = SurveyAttachmentSerializer(attachments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def audit_logs(self, request, pk=None):
        """Get audit log for this survey"""
        survey = self.get_object()
        logs = SurveyAuditLog.objects.filter(survey=survey).order_by('-timestamp')
        serializer = SurveyAuditLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get survey statistics"""
        queryset = self.get_queryset()

        total_surveys = queryset.count()

        # Status distribution
        status_distribution = queryset.values('verification_status').annotate(
            count=Count('id')
        )

        # Surveys by surveyor
        surveyor_stats = queryset.values(
            'surveyor__email', 'surveyor__first_name', 'surveyor__last_name'
        ).annotate(count=Count('id')).order_by('-count')

        # Average occupancy rate
        avg_occupancy = queryset.exclude(
            current_bed_capacity=0
        ).aggregate(
            avg_occupancy=Avg('beds_occupied') * 100.0 / Avg('current_bed_capacity')
        )['avg_occupancy'] or 0

        # Recent surveys (last 30 days)
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_surveys = queryset.filter(created_at__gte=thirty_days_ago).count()

        return Response({
            'total_surveys': total_surveys,
            'status_distribution': list(status_distribution),
            'top_surveyors': list(surveyor_stats)[:10],
            'average_occupancy_rate': round(avg_occupancy, 2),
            'recent_surveys': recent_surveys
        })


class SurveyAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SurveyAttachment
    """
    queryset = SurveyAttachment.objects.select_related('survey', 'uploaded_by')
    serializer_class = SurveyAttachmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['survey', 'attachment_type', 'uploaded_by']
    ordering = ['-uploaded_at']

    def perform_create(self, serializer):
        """Set uploaded_by to current user and log activity"""
        instance = serializer.save(uploaded_by=self.request.user)
        filename = instance.file.name if instance.file else 'unknown'
        log_file_upload(self.request, instance, filename)

    def perform_destroy(self, instance):
        """Delete attachment and log activity"""
        log_delete(self.request, instance, f'Deleted attachment: {instance.file.name}')
        instance.delete()


class SurveyAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for SurveyAuditLog (read-only)
    """
    queryset = SurveyAuditLog.objects.select_related('survey', 'user')
    serializer_class = SurveyAuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['survey', 'action', 'user', 'previous_status', 'new_status']
    ordering = ['-timestamp']
