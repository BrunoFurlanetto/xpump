from django.contrib import admin
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.utils.html import format_html

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('get_username', 'get_full_name', 'employer', 'score', 'level', 'height', 'weight')
    list_filter = ('employer', 'level')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('score', 'level')
    filter_horizontal = ('groups',)

    fieldsets = (
        ('Usuário', {
            'fields': ('user',)
        }),
        ('Informações Físicas', {
            'fields': ('height', 'weight', 'photo')
        }),
        ('Gamificação (Somente Leitura)', {
            'fields': ('score', 'level'),
            'description': 'Estes campos são calculados automaticamente pelo sistema de gamificação.'
        }),
        ('Empresa e Grupos', {
            'fields': ('employer', 'groups')
        }),
        ('Preferências', {
            'fields': ('notification_preferences',),
            'classes': ('collapse',)
        }),
    )

    def get_username(self, obj):
        """Returns the user's username"""
        return obj.user.username
    get_username.short_description = 'Username'
    get_username.admin_order_field = 'user__username'

    def get_full_name(self, obj):
        """Returns the user's full name"""
        full_name = obj.user.get_full_name()
        if full_name:
            return full_name
        return format_html('<em>{0}</em>', 'Nome não informado')
    get_full_name.short_description = 'Nome Completo'
    get_full_name.admin_order_field = 'user__first_name'

    def has_delete_permission(self, request, obj=None):
        """
        Block profile deletion via admin.
        Profiles should only be deleted via User cascade.
        """
        return False

    def _validate_group_ownership(self, obj, groups_to_check):
        """
        Validates if groups belong to employees of the same company as the profile.

        Args:
            obj: Profile instance
            groups_to_check: List or QuerySet of groups to validate

        Raises:
            ValidationError: If any group doesn't belong to the same company
        """
        if not obj.employer:
            raise ValidationError("Não é possível adicionar grupos a um perfil sem empresa associada.")

        invalid_groups = []

        for group in groups_to_check:
            # Check if the group owner is an employee of the same company
            if hasattr(group.owner, 'profile'):
                group_employer = group.owner.profile.employer
                if group_employer != obj.employer:
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
                        f"'{item['group'].name}' pertence à empresa '{item['employer'].name}'"
                    )
                else:
                    error_msgs.append(
                        f"'{item['group'].name}' foi criado por usuário sem empresa"
                    )

            raise ValidationError(
                f"Os seguintes grupos não podem ser associados pois não pertencem à empresa '{obj.employer.name}': {'; '.join(error_msgs)}"
            )

    def save_model(self, request, obj, form, change):
        """Additional validation when saving"""
        if change and 'user' in form.changed_data:
            self.message_user(
                request,
                'Não é permitido alterar o usuário de um perfil existente.',
                messages.ERROR
            )
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

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        """Filter available groups based on the profile's company"""
        if db_field.name == "groups":
            # If we are editing (there's an object_id in the URL)
            if request.resolver_match.kwargs.get('object_id'):
                try:
                    from django.contrib.admin.utils import unquote
                    object_id = unquote(request.resolver_match.kwargs['object_id'])
                    profile = Profile.objects.get(pk=object_id)

                    if profile.employer:
                        # Filter groups whose owner is employee of the same company
                        from groups.models import Group
                        kwargs["queryset"] = Group.objects.filter(
                            owner__profile__employer=profile.employer
                        )
                except (Profile.DoesNotExist, KeyError):
                    pass

        return super().formfield_for_manytomany(db_field, request, **kwargs)

