from django.urls import path

from .views import choropleth, dataset_list, kecamatan_detail

urlpatterns = [
    path('datasets/', dataset_list, name='secondary-datasets'),
    path('choropleth/', choropleth, name='secondary-choropleth'),
    path('kecamatan/<str:name>/', kecamatan_detail, name='secondary-kecamatan'),
]
