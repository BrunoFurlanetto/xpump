from django.contrib import admin
from django.contrib import messages

from .models import WorkoutCheckin, WorkoutCheckinProof, WorkoutPlan, WorkoutStreak


class WorkoutCheckinProofInline(admin.TabularInline):
    model = WorkoutCheckinProof
    extra = 0
    fields = ('file',)


@admin.register(WorkoutCheckin)
class WorkoutCheckinAdmin(admin.ModelAdmin):
    list_display = ('user', 'workout_date', 'duration', 'base_points', 'multiplier', 'validation_status', 'location')
    list_filter = ('workout_date', 'validation_status', 'user')
    search_fields = ('user__username', 'user__email', 'location', 'comments')
    readonly_fields = ('base_points', 'multiplier')
    date_hierarchy = 'workout_date'
    inlines = [WorkoutCheckinProofInline]

    fieldsets = (
        ('Usuário e Data', {
            'fields': ('user', 'workout_date', 'duration')
        }),
        ('Detalhes do Treino', {
            'fields': ('location', 'comments')
        }),
        ('Status e Pontuação (Somente Leitura)', {
            'fields': ('validation_status', 'base_points', 'multiplier'),
            'description': 'Os pontos são calculados automaticamente pelo sistema de gamificação.'
        }),
    )

    def save_model(self, request, obj, form, change):
        """Validation to prevent manual point editing"""
        if change:
            # Check if tried to manually change points
            if 'base_points' in form.changed_data or 'multiplier' in form.changed_data:
                self.message_user(
                    request,
                    'Os campos de pontuação são calculados automaticamente e não podem ser editados manualmente.',
                    messages.ERROR
                )
                return

            # Warning when changing user
            if 'user' in form.changed_data:
                self.message_user(
                    request,
                    'ATENÇÃO: Alterar o usuário de um treino pode causar inconsistências nos pontos. '
                    'Esta ação não é recomendada.',
                    messages.WARNING
                )

        super().save_model(request, obj, form, change)

    def delete_model(self, request, obj):
        """
        Block manual deletion of workout checkins.
        Deletion should use the model's delete() method which adjusts points correctly.
        """
        self.message_user(
            request,
            f'Não é possível deletar check-ins de treino via admin por questões de integridade de pontuação. '
            f'Use a API ou o shell do Django com obj.delete() para garantir que os pontos sejam ajustados corretamente.',
            messages.ERROR
        )

    def delete_queryset(self, request, queryset):
        """Block bulk deletion"""
        self.message_user(
            request,
            'Deleção em massa de check-ins de treino não é permitida por questões de integridade de pontuação.',
            messages.ERROR
        )


@admin.register(WorkoutCheckinProof)
class WorkoutCheckinProofAdmin(admin.ModelAdmin):
    list_display = ('checkin', 'file', 'get_user')
    list_filter = ('checkin__workout_date',)
    search_fields = ('checkin__user__username',)
    readonly_fields = ('checkin',)

    def get_user(self, obj):
        return obj.checkin.user.username
    get_user.short_description = 'Usuário'
    get_user.admin_order_field = 'checkin__user__username'


@admin.register(WorkoutPlan)
class WorkoutPlanAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'start_plan', 'end_plan', 'lifetime')
    list_filter = ('is_active', 'lifetime', 'start_plan', 'end_plan')
    search_fields = ('title',)

    fieldsets = (
        ('Informações do Plano', {
            'fields': ('title', 'is_active', 'pdf_file')
        }),
        ('Período de Validade', {
            'fields': ('start_plan', 'end_plan', 'lifetime'),
            'description': 'Se "Lifetime" estiver marcado, o plano não expira.'
        }),
    )

    def save_model(self, request, obj, form, change):
        """Date validation"""
        if obj.end_plan and obj.start_plan and obj.end_plan < obj.start_plan:
            self.message_user(
                request,
                'A data de término não pode ser anterior à data de início.',
                messages.ERROR
            )
            return

        super().save_model(request, obj, form, change)


@admin.register(WorkoutStreak)
class WorkoutStreakAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_streak', 'longest_streak', 'frequency', 'last_workout_datetime', 'weekly_remaining')
    list_filter = ('frequency', 'current_streak')
    search_fields = ('user__username', 'user__email')

    fieldsets = (
        ('Informações do Streak (Somente Leitura)', {
            'fields': ('user', 'current_streak', 'longest_streak', 'last_workout_datetime', 'frequency'),
            'description': 'Estas informações são gerenciadas automaticamente pelo sistema.'
        }),
    )

    def has_add_permission(self, request):
        """Don't allow manually adding streaks"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Don't allow deleting streaks"""
        return False

    def get_readonly_fields(self, request, obj=None):
        """All fields are readonly"""
        return [f.name for f in self.model._meta.fields]
