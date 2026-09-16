from django.contrib import admin

from .models import KecamatanIndicatorValue, SecondaryDataset, SecondaryIndicator


class SecondaryIndicatorInline(admin.TabularInline):
    model = SecondaryIndicator
    extra = 0
    fields = ['order', 'code', 'name', 'unit', 'is_population', 'is_aggregate']


@admin.register(SecondaryDataset)
class SecondaryDatasetAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'year', 'source', 'is_published', 'updated_at']
    list_filter = ['is_published', 'year']
    search_fields = ['name', 'slug', 'source']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [SecondaryIndicatorInline]


@admin.register(KecamatanIndicatorValue)
class KecamatanIndicatorValueAdmin(admin.ModelAdmin):
    list_display = ['kecamatan', 'indicator', 'value_male', 'value_female', 'value_total']
    list_filter = ['indicator__dataset', 'indicator']
    search_fields = ['kecamatan__name']
    autocomplete_fields = ['kecamatan']
