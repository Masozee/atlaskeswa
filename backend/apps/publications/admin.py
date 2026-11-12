from django.contrib import admin

from .models import Publication


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'status', 'date', 'updated_at']
    list_filter = ['type', 'status']
    search_fields = ['title', 'excerpt', 'slug']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']
