from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MainTypeOfCareViewSet, BasicStableInputsOfCareViewSet,
    TargetPopulationViewSet, ServiceTypeViewSet, ServiceViewSet,
    KategoriLayananViewSet, KategoriFasilitasViewSet,
)

router = DefaultRouter()
router.register(r'mtc', MainTypeOfCareViewSet, basename='mtc')
router.register(r'bsic', BasicStableInputsOfCareViewSet, basename='bsic')
router.register(r'target-populations', TargetPopulationViewSet, basename='target-population')
router.register(r'service-types', ServiceTypeViewSet, basename='service-type')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'kategori-layanan', KategoriLayananViewSet, basename='kategori-layanan')
router.register(r'kategori-fasilitas', KategoriFasilitasViewSet, basename='kategori-fasilitas')

# Explicit export URLs — the DRF router does not register GET-only custom actions
# correctly in all versions, so we add them explicitly before the router catch-all.
urlpatterns = [
    path('bsic/export/', BasicStableInputsOfCareViewSet.as_view({'get': 'export_data'}), name='bsic-export'),
    path('kategori-layanan/export/', KategoriLayananViewSet.as_view({'get': 'export_data'}), name='kategori-layanan-export'),
    path('kategori-fasilitas/export/', KategoriFasilitasViewSet.as_view({'get': 'export_data'}), name='kategori-fasilitas-export'),
    path('', include(router.urls)),
]
