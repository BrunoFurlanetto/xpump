from django.contrib import admin
from django.contrib import messages

from status.models import Status


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'app_name', 'action', 'is_active', 'description')
    search_fields = ('name', 'description')
    list_filter = ('app_name', 'action', 'is_active')
    ordering = ('app_name', 'action', 'name')
    readonly_fields = ('app_name', 'action')

    fieldsets = (
        ('Informações do Status', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Configuração do Sistema (Somente Leitura)', {
            'fields': ('app_name', 'action'),
            'description': 'Estes campos são gerenciados pelo sistema e não devem ser alterados.'
        }),
    )

    def has_add_permission(self, request):
        """Prevent manual status creation"""
        return False

    def save_model(self, request, obj, form, change):
        """Validation when saving"""
        if change:
            if 'app_name' in form.changed_data or 'action' in form.changed_data:
                self.message_user(
                    request,
                    'Não é permitido alterar os campos "app_name" e "action" de um status existente.',
                    messages.ERROR
                )
                return

        super().save_model(request, obj, form, change)

    def delete_model(self, request, obj):
        """Enhanced protection against deleting status in use"""
        try:
            super().delete_model(request, obj)
            self.message_user(
                request,
                f'Status "{obj.name}" deletado com sucesso.',
                messages.SUCCESS
            )
        except Exception as e:
            self.message_user(
                request,
                f'Erro ao deletar status "{obj.name}": {str(e)}',
                messages.ERROR
            )

    def delete_queryset(self, request, queryset):
        """Protection against bulk deletion"""
        errors = []
        success_count = 0

        for obj in queryset:
            try:
                obj.delete()
                success_count += 1
            except Exception as e:
                errors.append(f'{obj.name}: {str(e)}')

        if success_count > 0:
            self.message_user(
                request,
                f'{success_count} status deletado(s) com sucesso.',
                messages.SUCCESS
            )

        if errors:
            self.message_user(
                request,
                f'Erros ao deletar alguns status: {"; ".join(errors[:3])}',
                messages.ERROR
            )
