from django.contrib import admin
from django.contrib import messages

from .models import Group, GroupMembers


class GroupMembersInline(admin.TabularInline):
    model = GroupMembers
    extra = 0
    readonly_fields = ('member', 'joined_at')
    fields = ('member', 'is_admin', 'pending', 'joined_at')
    can_delete = True

    def has_add_permission(self, request, obj=None):
        """Don't allow adding members directly through inline"""
        return False


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_by', 'member_count', 'main', 'created_at')
    list_filter = ('main', 'created_at', 'owner')
    search_fields = ('name', 'description', 'owner__username', 'created_by__username')
    readonly_fields = ('created_at', 'created_by')
    inlines = [GroupMembersInline]

    fieldsets = (
        ('Informações do Grupo', {
            'fields': ('name', 'description', 'photo', 'main')
        }),
        ('Proprietário', {
            'fields': ('owner',)
        }),
        ('Informações do Sistema', {
            'fields': ('created_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    def member_count(self, obj):
        """Returns the count of non-pending members"""
        return obj.member_count()
    member_count.short_description = 'Membros Ativos'

    def save_model(self, request, obj, form, change):
        """
        When creating a group via admin, use the service to ensure
        consistency with the API and automatically add to employer.
        """
        if not change:
            # Creating new group - use the service
            from groups.services import create_group_for_client

            # Validate owner is defined
            if not obj.owner:
                self.message_user(
                    request,
                    'É obrigatório definir um "owner" (proprietário) para o grupo.',
                    messages.ERROR
                )
                return

            # Check if owner has profile and employer
            if not hasattr(obj.owner, 'profile') or not obj.owner.profile.employer:
                self.message_user(
                    request,
                    f'O usuário "{obj.owner.username}" não está associado a uma empresa (employer). '
                    f'Escolha um owner que seja funcionário de uma empresa.',
                    messages.ERROR
                )
                return

            employer = obj.owner.profile.employer

            # Use service to create the group
            group = create_group_for_client(
                client=employer,
                name=obj.name,
                owner=obj.owner,
                created_by=request.user,
                photo=obj.photo,
                description=obj.description,
                main=obj.main,
                add_creator=False,
                add_owner=True,
            )

            # Update obj with created group so admin displays correctly
            obj.pk = group.pk
            obj.id = group.id

            # Informative message
            if obj.main:
                self.message_user(
                    request,
                    f'Grupo "{obj.name}" criado com sucesso e definido como grupo principal da empresa "{employer.name}".',
                    messages.SUCCESS
                )
            else:
                self.message_user(
                    request,
                    f'Grupo "{obj.name}" criado com sucesso e automaticamente adicionado à empresa "{employer.name}".',
                    messages.SUCCESS
                )
        else:
            # Edit - use normal save
            super().save_model(request, obj, form, change)

    def delete_model(self, request, obj):
        """Protection against deleting groups with related data"""
        # Check if it's a main group for any client
        from clients.models import Client
        client = Client.objects.filter(main_group=obj).first()
        if client:
            self.message_user(
                request,
                f'Não é possível deletar o grupo "{obj.name}" pois é o grupo principal do cliente "{client.name}". '
                f'Altere o grupo principal do cliente primeiro.',
                messages.ERROR
            )
            return

        # Check if associated with clients
        clients_count = Client.objects.filter(groups=obj).count()
        if clients_count > 0:
            self.message_user(
                request,
                f'Não é possível deletar o grupo "{obj.name}" pois está associado a {clients_count} cliente(s). '
                f'Remova as associações primeiro.',
                messages.ERROR
            )
            return

        # Check members
        member_count = obj.member_count()
        if member_count > 0:
            self.message_user(
                request,
                f'Não é possível deletar o grupo "{obj.name}" pois possui {member_count} membro(s) ativo(s). '
                f'Remova todos os membros primeiro.',
                messages.ERROR
            )
            return

        super().delete_model(request, obj)
        self.message_user(request, f'Grupo "{obj.name}" deletado com sucesso.', messages.SUCCESS)

    def delete_queryset(self, request, queryset):
        """Protection against bulk deletion"""
        for obj in queryset:
            self.delete_model(request, obj)


@admin.register(GroupMembers)
class GroupMembersAdmin(admin.ModelAdmin):
    list_display = ('member', 'group', 'is_admin', 'pending', 'joined_at')
    list_filter = ('is_admin', 'pending', 'joined_at', 'group')
    search_fields = ('member__username', 'member__email', 'group__name')
    readonly_fields = ('member', 'group', 'joined_at')

    fieldsets = (
        ('Informações da Associação', {
            'fields': ('member', 'group', 'joined_at')
        }),
        ('Permissões', {
            'fields': ('is_admin', 'pending')
        }),
    )

    actions = ['approve_members']

    def approve_members(self, request, queryset):
        """Approve pending members"""
        pending_members = queryset.filter(pending=True)
        updated = pending_members.update(pending=False)
        self.message_user(
            request,
            f'{updated} membro(s) aprovado(s) com sucesso.',
            messages.SUCCESS
        )
    approve_members.short_description = 'Approve pending members'

    def has_add_permission(self, request):
        """Don't allow adding members directly"""
        return False

