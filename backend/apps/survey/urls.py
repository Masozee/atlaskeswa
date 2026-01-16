from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import SurveyViewSet, SurveyAttachmentViewSet, SurveyAuditLogViewSet

router = DefaultRouter()
router.register(r'surveys', SurveyViewSet, basename='survey')
router.register(r'attachments', SurveyAttachmentViewSet, basename='attachment')
router.register(r'audit-logs', SurveyAuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
]
