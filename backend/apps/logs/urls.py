from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ActivityLogViewSet, VerificationLogViewSet, DataChangeLogViewSet,
    SystemErrorViewSet, ImportExportLogViewSet
)

router = DefaultRouter()
router.register(r'activity', ActivityLogViewSet, basename='activity-log')
router.register(r'verification', VerificationLogViewSet, basename='verification-log')
router.register(r'data-changes', DataChangeLogViewSet, basename='data-change-log')
router.register(r'errors', SystemErrorViewSet, basename='system-error')
router.register(r'import-export', ImportExportLogViewSet, basename='import-export-log')

urlpatterns = [
    path('', include(router.urls)),
]
