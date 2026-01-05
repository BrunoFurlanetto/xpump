from django.contrib import admin
from django.contrib import messages
from django.db.models import Q
from django.utils import timezone

from .models import GamificationSettings, Season


@admin.register(GamificationSettings)
class GamificationSettingsAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'xp_base', 'exponential_factor', 'max_level', 'workout_xp', 'meal_xp')

    fieldsets = (
        ('Configurações de Nível', {
            'fields': ('xp_base', 'exponential_factor', 'max_level'),
            'description': 'Configurações base para o sistema de níveis e XP.'
        }),
        ('Recompensas de Treino', {
            'fields': ('workout_minutes', 'workout_xp', 'multiplier_workout_streak'),
            'description': 'Configurações de XP para treinos e multiplicadores de streak.'
        }),
        ('Recompensas de Refeição', {
            'fields': ('meal_xp', 'multiplier_meal_streak'),
            'description': 'Configurações de XP para refeições e multiplicadores de streak.'
        }),
        ('Configurações de Temporada', {
            'fields': ('months_to_end_season', 'season_bonus_percentage', 'percentage_from_first_position'),
            'description': 'Configurações para bônus de temporada e ranking.'
        }),
    )

    def has_add_permission(self, request):
        """Impede criação de múltiplas instâncias (singleton)"""
        if GamificationSettings.objects.exists():
            return False
        return True

    def has_delete_permission(self, request, obj=None):
        """Impede deleção das configurações"""
        return False

    def save_model(self, request, obj, form, change):
        """Aviso ao modificar configurações"""
        if change:
            self.message_user(
                request,
                'ATENÇÃO: As alterações nas configurações de gamificação afetarão o cálculo de XP '
                'de todos os usuários a partir de agora. Esta ação não recalcula XP retroativamente.',
                messages.WARNING
            )

        # Validações
        if obj.xp_base <= 0:
            self.message_user(request, 'XP base deve ser maior que zero.', messages.ERROR)
            return

        if obj.exponential_factor <= 0:
            self.message_user(request, 'Fator exponencial deve ser maior que zero.', messages.ERROR)
            return

        if obj.max_level <= 0:
            self.message_user(request, 'Nível máximo deve ser maior que zero.', messages.ERROR)
            return

        if obj.workout_minutes <= 0 or obj.workout_xp <= 0:
            self.message_user(request, 'Minutos de treino e XP de treino devem ser maiores que zero.', messages.ERROR)
            return

        if obj.meal_xp <= 0:
            self.message_user(request, 'XP de refeição deve ser maior que zero.', messages.ERROR)
            return

        super().save_model(request, obj, form, change)

        if not change:
            self.message_user(request, 'Configurações de gamificação criadas com sucesso.', messages.SUCCESS)
        else:
            self.message_user(request, 'Configurações de gamificação atualizadas com sucesso.', messages.SUCCESS)


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ('name', 'client', 'start_date', 'end_date', 'is_active', 'days_remaining')
    list_filter = ('client', 'start_date', 'end_date')
    search_fields = ('name', 'description', 'client__name')

    fieldsets = (
        ('Informações da Temporada', {
            'fields': ('client', 'name', 'description')
        }),
        ('Período', {
            'fields': ('start_date', 'end_date'),
            'description': 'Defina o período de validade da temporada.'
        }),
    )

    def is_active(self, obj):
        """Verifica se a temporada está ativa"""
        today = timezone.now().date()
        return obj.start_date <= today <= obj.end_date
    is_active.boolean = True
    is_active.short_description = 'Ativa'

    def days_remaining(self, obj):
        """Calcula dias restantes da temporada"""
        today = timezone.now().date()
        if obj.end_date < today:
            return "Expirada"
        elif obj.start_date > today:
            return f"Inicia em {(obj.start_date - today).days} dias"
        else:
            remaining = (obj.end_date - today).days
            return f"{remaining} dias restantes"
    days_remaining.short_description = 'Status'

    def save_model(self, request, obj, form, change):
        """Validações ao salvar temporada"""
        # Validar datas
        if obj.end_date <= obj.start_date:
            self.message_user(
                request,
                'A data de término deve ser posterior à data de início.',
                messages.ERROR
            )
            return

        # Verificar sobreposição de temporadas para o mesmo cliente
        overlapping = Season.objects.filter(
            client=obj.client
        ).filter(
            Q(start_date__lte=obj.end_date, end_date__gte=obj.start_date)
        ).exclude(pk=obj.pk)

        if overlapping.exists():
            overlapping_names = ', '.join([s.name for s in overlapping])
            self.message_user(
                request,
                f'Conflito de datas com as temporadas: {overlapping_names}. '
                f'As temporadas do mesmo cliente não podem ter períodos sobrepostos.',
                messages.ERROR
            )
            return

        super().save_model(request, obj, form, change)

        if not change:
            self.message_user(
                request,
                f'Temporada "{obj.name}" criada com sucesso para o cliente {obj.client.name}.',
                messages.SUCCESS
            )
        else:
            self.message_user(
                request,
                f'Temporada "{obj.name}" atualizada com sucesso.',
                messages.SUCCESS
            )

    def delete_model(self, request, obj):
        """Proteção contra deleção de temporadas ativas"""
        today = timezone.now().date()

        if obj.start_date <= today <= obj.end_date:
            self.message_user(
                request,
                f'Não é possível deletar a temporada "{obj.name}" pois está atualmente ativa. '
                f'Aguarde o término da temporada ou altere as datas.',
                messages.ERROR
            )
            return

        super().delete_model(request, obj)
        self.message_user(
            request,
            f'Temporada "{obj.name}" deletada com sucesso.',
            messages.SUCCESS
        )

    def delete_queryset(self, request, queryset):
        """Proteção contra deleção em massa"""
        for obj in queryset:
            self.delete_model(request, obj)

