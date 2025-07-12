from django.contrib import admin

from status.models import Status


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)
    list_filter = ('name',)
    ordering = ('name',)

    def has_add_permission(self, request):
        return False
