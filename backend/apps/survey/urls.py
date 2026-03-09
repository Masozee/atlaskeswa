from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SurveyViewSet, SurveyAttachmentViewSet, SurveyAuditLogViewSet,
    # Dynamic questionnaire viewsets
    GeographicUnitViewSet, SurveyTemplateViewSet,
    QuestionViewSet, QuestionChoiceViewSet,
    DynamicSurveyResponseViewSet
)

router = DefaultRouter()
# Existing structured survey endpoints
router.register(r'surveys', SurveyViewSet, basename='survey')
router.register(r'attachments', SurveyAttachmentViewSet, basename='attachment')
router.register(r'audit-logs', SurveyAuditLogViewSet, basename='audit-log')

# Dynamic questionnaire endpoints
router.register(r'templates', SurveyTemplateViewSet, basename='template')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'choices', QuestionChoiceViewSet, basename='choice')
router.register(r'responses', DynamicSurveyResponseViewSet, basename='response')
router.register(r'geographic-units', GeographicUnitViewSet, basename='geographic-unit')

urlpatterns = [
    path('', include(router.urls)),
]
