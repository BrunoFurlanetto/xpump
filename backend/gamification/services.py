from abc import ABC, abstractmethod
from datetime import datetime

from gamification.models import GamificationSettings, Season
from groups.exceptions import MultipleGroupMembersError
from groups.models import Group


class GamificationService(ABC):
    def __init__(self):
        self._settings = None
        self.__key_min_multiplier = None
        self.__key_max_multiplier = None

    @property
    def settings(self):
        if self._settings is None:
            self._settings, _ = GamificationSettings.objects.get_or_create(pk=1)

        return self._settings

    @abstractmethod
    def get_xp_settings(self):
        ...

    @abstractmethod
    def get_streak(self, user):
        ...

    def calculate(self, user, *args, **kwargs):
        base_points = self.base_xp(user)
        multiplier = self.get_multiplier(user)

        return float(base_points) * multiplier

    def get_multiplier(self, user):
        streak = self.get_streak(user)
        candidates = []

        for cfg in self.settings.multiplier_workout_streak.values():
            min_k = cfg.get(self.__key_min_multiplier, 0) or 0
            max_k = cfg.get(self.__key_max_multiplier)

            if streak >= min_k and (max_k is None or streak <= max_k):
                candidates.append((min_k, float(cfg.get("multiplier", 1.0))))

        if not candidates:
            return 1.0

        return max(candidates, key=lambda t: t[0])[1]

    def base_xp(self, user):
        actual_season = Season.objects.get(start_date__lt=datetime.today(), end_date__gt=datetime.today())
        months_to_end_season = (actual_season.end_date - datetime.today().date()).days / 30
        xp = self.get_xp_settings()

        if months_to_end_season < self.settings.months_to_end_season:
            try:
                main_user_group = user.profile.groups.get(main=True)
            except Group.MultipleObjectsReturned:
                raise MultipleGroupMembersError("User is member of multiple main groups.")

            if user.profile.score < main_user_group.points_first_place() * self.settings.percentage_from_first_position:
                xp += xp * (self.settings.season_bonus_percentage / 100)

        return xp


class WorkoutGamification(GamificationService):
    def __init__(self):
        super().__init__()
        self.__key_min_multiplier = "min_workouts"
        self.__key_max_multiplier = "max_workouts"

    def get_xp_settings(self):
        return self.settings.workout_xp

    def get_streak(self, user):
        return user.workout_streak.current_streak

    def calculate(self, user, *args):
        if len(args) != 1:
            raise ValueError("WorkoutGamification.calculate expects exactly 1 extra argument: duration")

        duration = args[0]
        base_points = self.base_xp(user)
        workout_minutes_base = self.settings.workout_minutes
        multiplier = self.get_multiplier(user)

        return float(base_points * ((duration.total_seconds() / 60) / workout_minutes_base)) * multiplier


class MealGamification(GamificationService):
    def __init__(self):
        super().__init__()
        self.__key_min_multiplier = "min_days"
        self.__key_max_multiplier = "max_days"

    def get_xp_settings(self):
        return self.settings.meal_xp

    def get_streak(self, user):
        return user.meal_streak.current_streak


class Gamification:
    def __init__(self):
        self._settings = None

    Workout = WorkoutGamification()
    Meal = MealGamification()

    @property
    def settings(self):
        if self._settings is None:
            self._settings, _ = GamificationSettings.objects.get_or_create(pk=1)

        return self._settings

    @staticmethod
    def get_xp(user):
        return user.profile.score

    @staticmethod
    def set_xp(user, xp):
        user.profile.score = xp
        user.profile.save()

    def add_xp(self, user, xp):
        user.profile.score += xp

        if user.profile.score >= self.points_to_next_level(user.profile.score):
            user.profile.level += 1

        user.profile.save()

    @staticmethod
    def remove_xp(user, xp):
        user.profile.score -= xp
        user.profile.save()

    @staticmethod
    def get_level(user):
        return user.profile.level

    def get_xp_in_period(self, user, start_date, end_date):
        total_workout_xp = total_meal_xp = 0
        workouts = user.workouts.filter(date__gte=start_date, date__lte=end_date)
        meals = user.meals.filter(date__gte=start_date, date__lte=end_date)

        for workout in workouts:
            total_workout_xp += self.Workout.calculate(user, workout.duration)

        for meal in meals:
            total_meal_xp += self.Meal.calculate(user, meal.duration)

        return {
            "workout_xp": total_workout_xp,
            "meal_xp": total_meal_xp,
            "total_xp": total_workout_xp + total_meal_xp
        }

    def points_to_next_level(self, user):
        user_xp = self.get_xp(user)
        user_level = self.get_level(user)
        base_xp = self.settings.xp_base
        exponential_factor = self.settings.exponential_factor
        next_level_xp = base_xp * (user_level + 1) ** exponential_factor

        return next_level_xp - user_xp
