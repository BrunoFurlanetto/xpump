from django.contrib import admin
from django.contrib import messages

from .models import MealConfig, Meal, MealProof, NutritionPlan, MealStreak


class MealProofInline(admin.TabularInline):
    model = MealProof
    extra = 0
    fields = ('file',)


@admin.register(MealConfig)
class MealConfigAdmin(admin.ModelAdmin):
    list_display = ('get_meal_name_display_custom', 'interval_start', 'interval_end', 'description')
    list_filter = ('meal_name',)
    search_fields = ('meal_name', 'description')

    fieldsets = (
        ('Configuração da Refeição', {
            'fields': ('meal_name', 'interval_start', 'interval_end', 'description')
        }),
    )

    def get_meal_name_display_custom(self, obj):
        return obj.get_meal_name_display()

    get_meal_name_display_custom.short_description = 'Tipo de Refeição'
    get_meal_name_display_custom.admin_order_field = 'meal_name'

    def save_model(self, request, obj, form, change):
        if obj.interval_end <= obj.interval_start:
            self.message_user(
                request,
                'The end time must be later than the start time.',
                messages.ERROR
            )
            return

        super().save_model(request, obj, form, change)

    def delete_model(self, request, obj):
        """MealConfig Deletion Protection with Associated Meals"""
        meals_count = Meal.objects.filter(meal_type=obj).count()

        if meals_count > 0:
            self.message_user(
                request,
                f'Unable to delete the setting "{obj.get_meal_name_display()}" for there are {meals_count} '
                f'Meal(s) registered using this setting.',
                messages.ERROR
            )
            return

        super().delete_model(request, obj)
        self.message_user(
            request,
            f'Meal setting "{obj.get_meal_name_display()}" successfully deleted.',
            messages.SUCCESS
        )

    def delete_queryset(self, request, queryset):
        """Bulk deletion protection"""
        for obj in queryset:
            self.delete_model(request, obj)


@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_meal_type', 'fasting', 'meal_time', 'base_points', 'multiplier', 'validation_status')
    list_filter = ('meal_type', 'meal_time', 'validation_status', 'user')
    search_fields = ('user__username', 'user__email', 'comments')
    readonly_fields = ('base_points', 'multiplier')
    date_hierarchy = 'meal_time'
    inlines = [MealProofInline]

    fieldsets = (
        ('Usuário e Refeição', {
            'fields': ('user', 'meal_type', 'meal_time')
        }),
        ('Detalhes', {
            'fields': ('comments',)
        }),
        ('Status e Pontuação (Somente Leitura)', {
            'fields': ('validation_status', 'base_points', 'multiplier'),
            'description': 'Os pontos são calculados automaticamente pelo sistema de gamificação.'
        }),
    )

    def get_meal_type(self, obj):
        return obj.meal_type.get_meal_name_display()

    get_meal_type.short_description = 'Tipo de Refeição'
    get_meal_type.admin_order_field = 'meal_type__meal_name'

    def save_model(self, request, obj, form, change):
        """Validação para evitar edição manual de pontos"""
        if change:
            if 'base_points' in form.changed_data or 'multiplier' in form.changed_data:
                self.message_user(
                    request,
                    'Os campos de pontuação são calculados automaticamente e não podem ser editados manualmente.',
                    messages.ERROR
                )
                return

            if 'user' in form.changed_data:
                self.message_user(
                    request,
                    'ATENÇÃO: Alterar o usuário de uma refeição pode causar inconsistências nos pontos. '
                    'Esta ação não é recomendada.',
                    messages.WARNING
                )

        super().save_model(request, obj, form, change)

    def delete_model(self, request, obj):
        """
        Bloqueia deleção manual de meals.
        A deleção deve usar o método delete() do model que ajusta pontos corretamente.
        """
        self.message_user(
            request,
            f'Não é possível deletar refeições via admin por questões de integridade de pontuação. '
            f'Use a API ou o shell do Django com obj.delete() para garantir que os pontos sejam ajustados corretamente.',
            messages.ERROR
        )

    def delete_queryset(self, request, queryset):
        """Bloqueia deleção em massa"""
        self.message_user(
            request,
            'Deleção em massa de refeições não é permitida por questões de integridade de pontuação.',
            messages.ERROR
        )

    def has_delete_permission(self, request, obj=None):
        """Remove o botão de deletar da interface"""
        return False


@admin.register(MealProof)
class MealProofAdmin(admin.ModelAdmin):
    list_display = ('checkin', 'file', 'get_user')
    list_filter = ('checkin__meal_time',)
    search_fields = ('checkin__user__username',)
    readonly_fields = ('checkin',)

    def get_user(self, obj):
        return obj.checkin.user.username
    get_user.short_description = 'Usuário'
    get_user.admin_order_field = 'checkin__user__username'


@admin.register(NutritionPlan)
class NutritionPlanAdmin(admin.ModelAdmin):
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
        """Validação de datas"""
        if obj.end_plan and obj.start_plan and obj.end_plan < obj.start_plan:
            self.message_user(
                request,
                'A data de término não pode ser anterior à data de início.',
                messages.ERROR
            )
            return

        super().save_model(request, obj, form, change)


@admin.register(MealStreak)
class MealStreakAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_streak', 'longest_streak', 'last_meal_datetime', 'weekly_remaining')
    list_filter = ('current_streak',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('user', 'current_streak', 'longest_streak', 'last_meal_datetime', 'weekly_remaining')

    fieldsets = (
        ('Informações do Streak (Somente Leitura)', {
            'fields': ('user', 'current_streak', 'longest_streak', 'last_meal_datetime', 'weekly_remaining'),
            'description': 'Estas informações são gerenciadas automaticamente pelo sistema.'
        }),
    )

    def has_add_permission(self, request):
        """Não permite adicionar streaks manualmente"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Não permite deletar streaks"""
        return False

    def get_readonly_fields(self, request, obj=None):
        """Todos os campos são readonly"""
        return [f.name for f in self.model._meta.fields]
