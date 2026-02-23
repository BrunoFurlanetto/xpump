from django.contrib import admin

from .models import Notification, PushSubscription


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'user_agent', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'endpoint']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'notification_type', 'title', 'is_read', 'employer', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at', 'employer']
    search_fields = ['user__username', 'user__email', 'title', 'body']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    list_select_related = ['user', 'employer']
    actions = ['mark_as_read', 'mark_as_unread']

    @admin.action(description='Marcar selecionadas como lidas')
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description='Marcar selecionadas como não lidas')
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
