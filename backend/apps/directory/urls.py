from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MainTypeOfCareViewSet, BasicStableInputsOfCareViewSet,
    TargetPopulationViewSet, ServiceTypeViewSet, ServiceViewSet
)

router = DefaultRouter()
router.register(r'mtc', MainTypeOfCareViewSet, basename='mtc')
router.register(r'bsic', BasicStableInputsOfCareViewSet, basename='bsic')
router.register(r'target-populations', TargetPopulationViewSet, basename='target-population')
router.register(r'service-types', ServiceTypeViewSet, basename='service-type')
router.register(r'services', ServiceViewSet, basename='service')

urlpatterns = [
    path('', include(router.urls)),
]
