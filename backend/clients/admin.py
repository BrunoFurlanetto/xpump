from django.contrib import admin
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.utils.html import format_html

from .models import Client
from profiles.models import Profile


class EmployeeInline(admin.TabularInline):
    """Inline to display all employees of a client"""
    model = Profile
    fk_name = 'employer'
    extra = 0
    can_delete = False
    readonly_fields = ('user_info', 'user_email', 'height', 'weight', 'score', 'level')
    fields = ('user_info', 'user_email', 'height', 'weight', 'score', 'level')
    verbose_name = 'Funcionário'
    verbose_name_plural = 'Funcionários'

    def user_info(self, obj):
        """Display user's full name and username"""
        if obj.user:
            full_name = obj.user.get_full_name() or obj.user.username
            return format_html('<strong>{}</strong> (@{})', full_name, obj.user.username)
        return '-'
    user_info.short_description = 'Nome do Funcionário'

    def user_email(self, obj):
        """Display user's email"""
        return obj.user.email if obj.user else '-'
    user_email.short_description = 'E-mail'

    def has_add_permission(self, request, obj=None):
        """Prevent adding employees directly from client admin"""
        return False


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'cnpj', 'contact_email', 'is_active', 'owners', 'created_at', 'employee_count')
    list_filter = ('is_active', 'created_at', 'owners')
    search_fields = ('name', 'cnpj', 'contact_email', 'phone', 'owners__username', 'owners__email')
    readonly_fields = ('client_code', 'created_at', 'updated_at', 'updated_by')
    filter_horizontal = ('groups',)
    inlines = [EmployeeInline]

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('name', 'cnpj', 'contact_email', 'phone', 'address')
        }),
        ('Status e Proprietário', {
            'fields': ('is_active', 'owners')
        }),
        ('Grupos', {
            'fields': ('main_group', 'groups')
        }),
        ('Informações do Sistema', {
            'fields': ('client_code', 'created_at', 'updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    actions = ['activate_clients', 'deactivate_clients']

    def employee_count(self, obj):
        """Count the number of employees (profiles) of the client"""
        count = obj.employees.count()
        return format_html('<strong>{0}</strong>', count)
    employee_count.short_description = 'Funcionários'

    def activate_clients(self, request, queryset):
        """Activate selected clients"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} cliente(s) ativado(s) com sucesso.', messages.SUCCESS)
    activate_clients.short_description = 'Ativar clientes selecionados'

    def deactivate_clients(self, request, queryset):
        """Deactivate selected clients"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} cliente(s) desativado(s) com sucesso.', messages.WARNING)
    deactivate_clients.short_description = 'Desativar clientes selecionados'

    def _validate_group_ownership(self, obj, groups_to_check):
        """
        Validates if groups belong to employees of the same company.

        Args:
            obj: Client instance
            groups_to_check: List or QuerySet of groups to validate

        Raises:
            ValidationError: If any group doesn't belong to the company
        """
        invalid_groups = []

        for group in groups_to_check:
            # Check if the group owner is an employee of this company
            if hasattr(group.owner, 'profile'):
                group_employer = group.owner.profile.employer
                if group_employer != obj:
                    invalid_groups.append({
                        'group': group,
                        'employer': group_employer
                    })
            else:
                # If the owner doesn't have a profile, it cannot be validated
                invalid_groups.append({
                    'group': group,
                    'employer': None
                })

        if invalid_groups:
            error_msgs = []
            for item in invalid_groups:
                if item['employer']:
                    error_msgs.append(
                        f"'{item['group'].name}' foi criado por funcionário da empresa '{item['employer'].name}'"
                    )
                else:
                    error_msgs.append(
                        f"'{item['group'].name}' foi criado por usuário sem empresa associada"
                    )

            raise ValidationError(
                f"Os seguintes grupos não podem ser associados pois não pertencem a esta empresa: {'; '.join(error_msgs)}"
            )

    def save_model(self, request, obj, form, change):
        """Register who updated the client and validate groups"""
        if change:
            obj.updated_by = request.user

        # Validate main_group if it was changed
        if 'main_group' in form.changed_data and obj.main_group:
            try:
                self._validate_group_ownership(obj, [obj.main_group])
            except ValidationError as e:
                self.message_user(request, str(e), messages.ERROR)
                return

        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        """Validate ManyToMany groups before saving"""
        super().save_related(request, form, formsets, change)

        # Validate groups after saving relationships
        obj = form.instance
        if obj.groups.exists():
            try:
                self._validate_group_ownership(obj, obj.groups.all())
            except ValidationError as e:
                # Remove invalid groups
                obj.groups.clear()
                self.message_user(request, str(e), messages.ERROR)
                self.message_user(
                    request,
                    'Os grupos inválidos foram removidos automaticamente.',
                    messages.WARNING
                )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter available groups for main_group based on the client"""
        if db_field.name == "main_group":
            # If we are editing (there's an object_id in the URL)
            if request.resolver_match.kwargs.get('object_id'):
                try:
                    from django.contrib.admin.utils import unquote
                    object_id = unquote(request.resolver_match.kwargs['object_id'])
                    client = Client.objects.get(pk=object_id)

                    # Filter groups created by ANY employee of this company
                    from groups.models import Group
                    kwargs["queryset"] = Group.objects.filter(
                        owner__profile__employer=client
                    )
                except (Client.DoesNotExist, KeyError):
                    pass

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        """Filter available groups based on the client"""
        if db_field.name == "groups":
            # If we are editing (there's an object_id in the URL)

            if request.resolver_match.kwargs.get('object_id'):
                try:
                    from django.contrib.admin.utils import unquote
                    object_id = unquote(request.resolver_match.kwargs['object_id'])
                    client = Client.objects.get(pk=object_id)

                    # Filter groups whose owner is an employee of this company
                    from groups.models import Group
                    kwargs["queryset"] = Group.objects.filter(
                        owner__profile__employer=client
                    )
                except (Client.DoesNotExist, KeyError):
                    pass

        return super().formfield_for_manytomany(db_field, request, **kwargs)

    def delete_model(self, request, obj):
        """Protection against deleting clients with related data"""
        employee_count = obj.employees.count()
        groups_count = obj.groups.count()
        main_group = obj.main_group

        if employee_count > 0:
            self.message_user(
                request,
                f'Cannot delete client "{obj.name}" as it has {employee_count} associated employee(s). '
                f'Deactivate the client instead of deleting it.',
                messages.ERROR
            )
            return

        if main_group or groups_count > 0:
            self.message_user(
                f'Não é possível deletar o cliente "{obj.name}" pois possui grupo principal ou {groups_count} grupo(s) associado(s). '
                f'Remova as associações primeiro.',
                f'Remove the associations first.',
                messages.ERROR
            )
            return

        self.message_user(request, f'Cliente "{obj.name}" deletado com sucesso.', messages.SUCCESS)
        self.message_user(request, f'Client "{obj.name}" deleted successfully.', messages.SUCCESS)

    def delete_queryset(self, request, queryset):
        """Protection against bulk deletion"""
        for obj in queryset:
            self.delete_model(request, obj)

