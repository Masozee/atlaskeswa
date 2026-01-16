from django.contrib import admin
from .models import MainTypeOfCare, BasicStableInputsOfCare, TargetPopulation, ServiceType, Service


@admin.register(MainTypeOfCare)
class MainTypeOfCareAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'parent', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('code', 'name', 'description')
    ordering = ('code',)


@admin.register(BasicStableInputsOfCare)
class BasicStableInputsOfCareAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('code', 'name', 'description')
    ordering = ('code',)


@admin.register(TargetPopulation)
class TargetPopulationAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(ServiceType)
class ServiceTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'province', 'mtc', 'bsic', 'is_verified', 'is_active', 'created_at')
    list_filter = ('is_verified', 'is_active', 'city', 'province', 'mtc', 'bsic', 'created_at')
    search_fields = ('name', 'description', 'address', 'city', 'province')
    filter_horizontal = ('target_populations',)
    ordering = ('-created_at',)
    readonly_fields = ('created_by', 'verified_by', 'verified_at', 'created_at', 'updated_at')

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description')
        }),
        ('DESDE-LTC Classifications', {
            'fields': ('mtc', 'bsic', 'service_type', 'target_populations')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'email', 'website')
        }),
        ('Location', {
            'fields': ('address', 'city', 'province', 'postal_code', 'latitude', 'longitude')
        }),
        ('Capacity and Staffing', {
            'fields': ('bed_capacity', 'staff_count', 'psychiatrist_count', 'psychologist_count', 'nurse_count', 'social_worker_count')
        }),
        ('Operating Information', {
            'fields': ('operating_hours', 'is_24_7', 'accepts_emergency')
        }),
        ('Insurance and Funding', {
            'fields': ('accepts_bpjs', 'accepts_private_insurance', 'funding_sources')
        }),
        ('Status and Metadata', {
            'fields': ('is_verified', 'is_active', 'created_by', 'verified_by', 'verified_at', 'created_at', 'updated_at')
        }),
    )
