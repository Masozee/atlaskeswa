from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HelpCategoryViewSet, HelpArticleViewSet, FAQViewSet, SupportTicketViewSet

router = DefaultRouter()
router.register(r'categories', HelpCategoryViewSet, basename='help-category')
router.register(r'articles', HelpArticleViewSet, basename='help-article')
router.register(r'faqs', FAQViewSet, basename='faq')
router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')

urlpatterns = [
    path('', include(router.urls)),
]
