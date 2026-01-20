from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta
import csv
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

from apps.directory.models import Service
from apps.survey.models import Survey
from apps.accounts.models import User
from apps.logs.models import ActivityLog, SystemError
from apps.logs.utils import log_export


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get comprehensive dashboard statistics
    """

    # Service statistics
    total_services = Service.objects.count()
    verified_services = Service.objects.filter(is_verified=True).count()
    active_services = Service.objects.filter(is_active=True).count()

    # Survey statistics
    total_surveys = Survey.objects.count()
    pending_surveys = Survey.objects.filter(
        verification_status=Survey.Status.SUBMITTED
    ).count()
    verified_surveys = Survey.objects.filter(
        verification_status=Survey.Status.VERIFIED
    ).count()

    # User statistics
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()

    # Recent activity (last 7 days)
    week_ago = timezone.now() - timedelta(days=7)
    recent_surveys = Survey.objects.filter(created_at__gte=week_ago).count()
    recent_services = Service.objects.filter(created_at__gte=week_ago).count()

    # Capacity data
    capacity_data = Service.objects.aggregate(
        total_beds=Sum('bed_capacity'),
        total_staff=Sum('staff_count'),
        total_psychiatrists=Sum('psychiatrist_count'),
        total_psychologists=Sum('psychologist_count'),
        total_nurses=Sum('nurse_count'),
        total_social_workers=Sum('social_worker_count')
    )

    # Geographic distribution (by kecamatan/city)
    kecamatan_distribution = Service.objects.values('city').annotate(
        count=Count('id')
    ).order_by('-count')

    # MTC distribution
    mtc_distribution = Service.objects.values(
        'mtc__code', 'mtc__name'
    ).annotate(count=Count('id')).order_by('-count')

    # Recent system errors
    unresolved_errors = SystemError.objects.filter(is_resolved=False).count()
    critical_errors = SystemError.objects.filter(
        severity='CRITICAL',
        is_resolved=False
    ).count()

    # Activity trends (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily_activities = ActivityLog.objects.filter(
        timestamp__gte=thirty_days_ago
    ).extra(
        select={'day': 'date(timestamp)'}
    ).values('day').annotate(count=Count('id')).order_by('day')

    # Latest 5 surveys with details
    latest_surveys = Survey.objects.select_related('service').order_by('-created_at')[:5]
    recent_surveys_data = [
        {
            'id': survey.id,
            'service_name': survey.service.name if survey.service else 'Unknown Service',
            'verification_status': survey.verification_status,
            'created_at': survey.created_at.isoformat()
        }
        for survey in latest_surveys
    ]

    return Response({
        'services': {
            'total': total_services,
            'verified': verified_services,
            'active': active_services,
            'recent': recent_services
        },
        'surveys': {
            'total': total_surveys,
            'pending': pending_surveys,
            'verified': verified_surveys,
            'recent': recent_surveys
        },
        'users': {
            'total': total_users,
            'active': active_users
        },
        'capacity': {
            'total_beds': capacity_data['total_beds'] or 0,
            'total_staff': capacity_data['total_staff'] or 0,
            'psychiatrists': capacity_data['total_psychiatrists'] or 0,
            'psychologists': capacity_data['total_psychologists'] or 0,
            'nurses': capacity_data['total_nurses'] or 0,
            'social_workers': capacity_data['total_social_workers'] or 0
        },
        'geographic_distribution': list(kecamatan_distribution),
        'mtc_distribution': list(mtc_distribution)[:10],
        'system_health': {
            'unresolved_errors': unresolved_errors,
            'critical_errors': critical_errors
        },
        'activity_trends': list(daily_activities),
        'recent_surveys': recent_surveys_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def service_analytics(request):
    """
    Get detailed service analytics
    """

    services = Service.objects.all()

    # Service type distribution
    type_distribution = services.values('service_type__name').annotate(
        count=Count('id')
    ).order_by('-count')

    # Insurance coverage
    bpjs_services = services.filter(accepts_bpjs=True).count()
    private_insurance = services.filter(accepts_private_insurance=True).count()

    # Emergency services
    emergency_services = services.filter(accepts_emergency=True).count()
    twentyfour_seven = services.filter(is_24_7=True).count()

    # Average capacity metrics
    avg_metrics = services.aggregate(
        avg_beds=Avg('bed_capacity'),
        avg_staff=Avg('staff_count'),
        avg_psychiatrists=Avg('psychiatrist_count'),
        avg_psychologists=Avg('psychologist_count')
    )

    return Response({
        'type_distribution': list(type_distribution),
        'insurance_coverage': {
            'bpjs': bpjs_services,
            'private': private_insurance
        },
        'emergency_services': {
            'accepts_emergency': emergency_services,
            'twentyfour_seven': twentyfour_seven
        },
        'average_metrics': {
            'beds': round(avg_metrics['avg_beds'] or 0, 2),
            'staff': round(avg_metrics['avg_staff'] or 0, 2),
            'psychiatrists': round(avg_metrics['avg_psychiatrists'] or 0, 2),
            'psychologists': round(avg_metrics['avg_psychologists'] or 0, 2)
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def survey_analytics(request):
    """
    Get detailed survey analytics
    """

    surveys = Survey.objects.all()

    # Status distribution over time (last 6 months)
    six_months_ago = timezone.now() - timedelta(days=180)
    monthly_surveys = surveys.filter(
        created_at__gte=six_months_ago
    ).extra(
        select={'month': "strftime('%%Y-%%m', created_at)"}
    ).values('month', 'verification_status').annotate(
        count=Count('id')
    ).order_by('month')

    # Average occupancy rate
    from django.db.models import F, FloatField, ExpressionWrapper

    avg_occupancy = surveys.exclude(
        current_bed_capacity=0
    ).annotate(
        occupancy_rate=ExpressionWrapper(
            F('beds_occupied') * 100.0 / F('current_bed_capacity'),
            output_field=FloatField()
        )
    ).aggregate(avg=Avg('occupancy_rate'))

    # Patient demographics
    demographics = surveys.aggregate(
        total_patients=Sum('total_patients_served'),
        male_patients=Sum('patients_male'),
        female_patients=Sum('patients_female'),
        age_0_17=Sum('patients_age_0_17'),
        age_18_64=Sum('patients_age_18_64'),
        age_65_plus=Sum('patients_age_65_plus')
    )

    # Surveyor performance
    surveyor_stats = surveys.values(
        'surveyor__email', 'surveyor__first_name', 'surveyor__last_name'
    ).annotate(
        total_surveys=Count('id'),
        verified=Count('id', filter=Q(verification_status=Survey.Status.VERIFIED)),
        pending=Count('id', filter=Q(verification_status=Survey.Status.SUBMITTED)),
        rejected=Count('id', filter=Q(verification_status=Survey.Status.REJECTED))
    ).order_by('-total_surveys')

    return Response({
        'monthly_trends': list(monthly_surveys),
        'average_occupancy_rate': round(avg_occupancy['avg'] or 0, 2),
        'patient_demographics': demographics,
        'surveyor_performance': list(surveyor_stats)[:10]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_services_excel(request):
    """
    Export services data to Excel
    """
    # Get query parameters for filtering
    province = request.GET.get('province')
    mtc = request.GET.get('mtc')
    status = request.GET.get('status')

    # Filter services
    services = Service.objects.all()
    if province and province != 'all':
        services = services.filter(province=province)
    if mtc and mtc != 'all':
        services = services.filter(mtc__code=mtc)
    if status and status != 'all':
        if status == 'VERIFIED':
            services = services.filter(is_verified=True)

    # Create workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Services Data"

    # Define headers
    headers = [
        'Service Name', 'Province', 'City', 'MTC Code', 'BSIC Code',
        'Bed Capacity', 'Staff Count', 'Psychiatrists', 'Psychologists',
        'Nurses', 'Social Workers', 'Verified', 'Active', 'Created Date'
    ]

    # Style for headers
    header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)

    # Write headers
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center', vertical='center')

    # Write data
    for row_num, service in enumerate(services, 2):
        ws.cell(row=row_num, column=1, value=service.name)
        ws.cell(row=row_num, column=2, value=service.province)
        ws.cell(row=row_num, column=3, value=service.city)
        ws.cell(row=row_num, column=4, value=service.mtc.code if service.mtc else '')
        ws.cell(row=row_num, column=5, value=service.bsic.code if service.bsic else '')
        ws.cell(row=row_num, column=6, value=service.bed_capacity or 0)
        ws.cell(row=row_num, column=7, value=service.staff_count or 0)
        ws.cell(row=row_num, column=8, value=service.psychiatrist_count or 0)
        ws.cell(row=row_num, column=9, value=service.psychologist_count or 0)
        ws.cell(row=row_num, column=10, value=service.nurse_count or 0)
        ws.cell(row=row_num, column=11, value=service.social_worker_count or 0)
        ws.cell(row=row_num, column=12, value='Yes' if service.is_verified else 'No')
        ws.cell(row=row_num, column=13, value='Yes' if service.is_active else 'No')
        ws.cell(row=row_num, column=14, value=service.created_at.strftime('%Y-%m-%d'))

    # Auto-adjust column widths
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width

    # Prepare response
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename=yakkum-services-export-{timezone.now().strftime("%Y%m%d")}.xlsx'

    # Log export activity
    log_export(request, 'Service', 'Excel', services.count())

    wb.save(response)
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_services_csv(request):
    """
    Export services data to CSV
    """
    # Get query parameters for filtering
    province = request.GET.get('province')
    mtc = request.GET.get('mtc')
    status = request.GET.get('status')

    # Filter services
    services = Service.objects.all()
    if province and province != 'all':
        services = services.filter(province=province)
    if mtc and mtc != 'all':
        services = services.filter(mtc__code=mtc)
    if status and status != 'all':
        if status == 'VERIFIED':
            services = services.filter(is_verified=True)

    # Prepare response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename=yakkum-services-export-{timezone.now().strftime("%Y%m%d")}.csv'

    # Write CSV
    writer = csv.writer(response)

    # Write headers
    writer.writerow([
        'Service Name', 'Province', 'City', 'MTC Code', 'BSIC Code',
        'Bed Capacity', 'Staff Count', 'Psychiatrists', 'Psychologists',
        'Nurses', 'Social Workers', 'Verified', 'Active', 'Created Date'
    ])

    # Write data
    record_count = 0
    for service in services:
        writer.writerow([
            service.name,
            service.province,
            service.city,
            service.mtc.code if service.mtc else '',
            service.bsic.code if service.bsic else '',
            service.bed_capacity or 0,
            service.staff_count or 0,
            service.psychiatrist_count or 0,
            service.psychologist_count or 0,
            service.nurse_count or 0,
            service.social_worker_count or 0,
            'Yes' if service.is_verified else 'No',
            'Yes' if service.is_active else 'No',
            service.created_at.strftime('%Y-%m-%d')
        ])
        record_count += 1

    # Log export activity
    log_export(request, 'Service', 'CSV', record_count)

    return response
