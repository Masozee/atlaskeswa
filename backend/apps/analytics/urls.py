from django.urls import path

from .views import (
    dashboard_stats, service_analytics, survey_analytics,
    export_services_excel, export_services_csv
)

urlpatterns = [
    path('dashboard/', dashboard_stats, name='dashboard-stats'),
    path('services/', service_analytics, name='service-analytics'),
    path('surveys/', survey_analytics, name='survey-analytics'),
    path('export/services/excel/', export_services_excel, name='export-services-excel'),
    path('export/services/csv/', export_services_csv, name='export-services-csv'),
]
