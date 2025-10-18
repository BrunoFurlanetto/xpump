import copy

from django.db import models

DEFAULT_MULTIPLIER_WORKOUT_STREAK = {
    "first_streak_day": {
        "min_days": 1,
        "max_days": 4,
        "multiplier": 1.0
    },
    "second_streak_day": {
        "min_days": 5,
        "max_days": 19,
        "multiplier": 1.25
    },
    "third_streak_day": {
        "min_days": 10,
        "max_days": 19,
        "multiplier": 1.5
    },
    "fourth_streak_day": {
        "min_days": 20,
        "max_days": 39,
        "multiplier": 1.75
    },
    "last_streak_day": {
        "min_days": 40,
        "max_days": None,
        "multiplier": 2.0
    }
}

DEFAULT_MULTIPLIER_MEAL_STREAK = {
    "first_streak_day": {
        "min_days": 0,
        "max_days": 1,
        "multiplier": 1.0
    },
    "second_streak_day": {
        "min_days": 2,
        "max_days": 7,
        "multiplier": 1.25
    },
    "third_streak_day": {
        "min_days": 8,
        "max_days": 15,
        "multiplier": 1.5
    },
    "fourth_streak_day": {
        "min_days": 16,
        "max_days": 31,
        "multiplier": 1.75
    },
    "last_streak_day": {
        "min_days": 32,
        "max_days": None,
        "multiplier": 2.0
    }
}


def default_multiplier_workout_streak():
    return copy.deepcopy(DEFAULT_MULTIPLIER_WORKOUT_STREAK)


def default_multiplier_meal_streak():
    return copy.deepcopy(DEFAULT_MULTIPLIER_MEAL_STREAK)


class GamificationSettings(models.Model):
    xp_base = models.IntegerField(default=6, help_text="XP base para o nível 1")
    exponential_factor = models.FloatField(default=1.5, help_text="Fator exponencial para cálculo de XP")
    max_level = models.IntegerField(default=50, help_text="Nível máximo permitido")
    workout_minutes = models.IntegerField(default=50, help_text="Minutos de treino para recompensar o XP estipulado")
    workout_xp = models.IntegerField(default=2, help_text="XP concedido por completar os minutos de treino treino")
    multiplier_workout_streak = models.JSONField(
        default=default_multiplier_workout_streak,
        help_text="Multiplicador de XP baseado na sequência de dias de atividade"
    )
    meal_xp = models.IntegerField(default=1, help_text="XP concedido por registrar uma refeição")
    multiplier_meal_streak = models.JSONField(
        default=default_multiplier_meal_streak,
        help_text="Multiplicador de XP baseado na sequência de dias de registro de refeições completo"
    )
    months_to_end_season = models.IntegerField(
        default=2,
        help_text="Número de meses para finalizar a temporada, para concesão de bônus para usuários abaixo no ranking"
    )
    season_bonus_percentage = models.FloatField(
        default=50.0,
        help_text="Porcentagem de bônus de XP concedida aos usuários abaixo no ranking próximo do final da temporada"
    )
    percentage_from_first_position = models.FloatField(
        default=60.0,
        help_text="Porcentagem de pontos do primeiro colocado que deverão receber boônus de XP no final da temporada"
    )

    def __str__(self):
        return "Gamification Settings"

    class Meta:
        verbose_name = "Gamification Setting"
        verbose_name_plural = "Gamification Settings"
