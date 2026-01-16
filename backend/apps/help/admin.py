from django.contrib import admin
from .models import HelpCategory, HelpArticle, FAQ, SupportTicket, SupportTicketReply


@admin.register(HelpCategory)
class HelpCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order', 'name']


@admin.register(HelpArticle)
class HelpArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'is_featured', 'views_count', 'author', 'created_at']
    list_filter = ['status', 'is_featured', 'category', 'created_at']
    search_fields = ['title', 'summary', 'content', 'tags']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['status', 'is_featured']
    ordering = ['category', 'order', 'title']
    readonly_fields = ['views_count', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('category', 'title', 'slug', 'summary', 'status')
        }),
        ('Content', {
            'fields': ('content', 'tags')
        }),
        ('Settings', {
            'fields': ('order', 'is_featured', 'author', 'views_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question', 'category', 'order', 'is_active', 'views_count', 'created_at']
    list_filter = ['is_active', 'category', 'created_at']
    search_fields = ['question', 'answer']
    list_editable = ['order', 'is_active']
    ordering = ['order', 'question']
    readonly_fields = ['views_count', 'created_at', 'updated_at']


class SupportTicketReplyInline(admin.TabularInline):
    model = SupportTicketReply
    extra = 0
    readonly_fields = ['user', 'created_at']
    can_delete = False


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['subject', 'user', 'status', 'priority', 'assigned_to', 'created_at', 'resolved_at']
    list_filter = ['status', 'priority', 'category', 'created_at']
    search_fields = ['subject', 'description', 'user__email', 'user__full_name']
    list_editable = ['status', 'priority', 'assigned_to']
    ordering = ['-created_at']
    readonly_fields = ['user', 'created_at', 'updated_at']
    inlines = [SupportTicketReplyInline]

    fieldsets = (
        ('Ticket Information', {
            'fields': ('user', 'subject', 'description', 'category')
        }),
        ('Status & Assignment', {
            'fields': ('status', 'priority', 'assigned_to', 'resolved_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SupportTicketReply)
class SupportTicketReplyAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'user', 'is_staff_reply', 'created_at']
    list_filter = ['is_staff_reply', 'created_at']
    search_fields = ['message', 'ticket__subject', 'user__email']
    ordering = ['-created_at']
    readonly_fields = ['ticket', 'user', 'created_at']
