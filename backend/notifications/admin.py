"""
Admin configuration for notifications app.
"""
from django.contrib import admin
from .models import Notification, PushSubscription, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for Notification model."""
    
    list_display = ('recipient', 'type', 'title', 'read', 'sent_push', 'created_at')
    list_filter = ('type', 'read', 'sent_push', 'created_at')
    search_fields = ('recipient__username', 'title', 'message')
    readonly_fields = ('created_at', 'read_at')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Recipient', {
            'fields': ('recipient',)
        }),
        ('Content', {
            'fields': ('type', 'title', 'message', 'metadata')
        }),
        ('Status', {
            'fields': ('read', 'read_at', 'sent_push')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    """Admin interface for PushSubscription model."""
    
    list_display = ('user', 'endpoint_short', 'active', 'created_at', 'last_used')
    list_filter = ('active', 'created_at')
    search_fields = ('user__username', 'endpoint')
    readonly_fields = ('created_at', 'last_used')
    date_hierarchy = 'created_at'
    
    def endpoint_short(self, obj):
        """Display shortened endpoint URL."""
        return obj.endpoint[:50] + '...' if len(obj.endpoint) > 50 else obj.endpoint
    endpoint_short.short_description = 'Endpoint'


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """Admin interface for NotificationPreference model."""
    
    list_display = ('user', 'enable_push', 'enable_social', 'enable_groups', 
                    'enable_achievements', 'enable_reminders')
    list_filter = ('enable_push', 'enable_social', 'enable_groups')
    search_fields = ('user__username',)
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Notification Types', {
            'fields': ('enable_push', 'enable_social', 'enable_groups', 
                      'enable_achievements', 'enable_reminders', 'enable_streaks', 
                      'enable_level_ups')
        }),
        ('Quiet Hours', {
            'fields': ('quiet_hours_start', 'quiet_hours_end'),
            'description': 'Time range when push notifications will not be sent'
        }),
    )
