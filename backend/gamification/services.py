from abc import ABC, abstractmethod
from datetime import datetime
from faulthandler import dump_traceback
from math import floor

from django.contrib.auth.models import User
from django.db.models import Sum
from django.utils.functional import cached_property

from gamification.exceptions import NoSeasonFoundError
from gamification.models import GamificationSettings, Season
from groups.exceptions import MultipleGroupMembersError, NothingMainGroupError
from groups.models import Group


class GamificationService(ABC):
    def __init__(self):
        self._key_min_multiplier = None
        self._key_max_multiplier = None

    @cached_property
    def settings(self):
        return GamificationSettings.load()

    @abstractmethod
    def get_xp_settings(self):
        ...

    @abstractmethod
    def get_streak(self, user):
        ...

    @property
    @abstractmethod
    def multiplier_streak_attr(self):
        ...

    def calculate(self, user, *args, **kwargs):
        base_points = self.base_xp(user)
        multiplier = self.get_multiplier(user)

        return float(base_points) * multiplier

    def get_multiplier(self, user):
        streak = 1  # self.get_streak(user)  TODO: implement streak logic in the future
        candidates = []
        cfg_collection = getattr(self.settings, self.multiplier_streak_attr)

        for cfg in cfg_collection.values():
            min_k = cfg.get(self._key_min_multiplier, 0) or 0
            max_k = cfg.get(self._key_max_multiplier)

            if streak >= min_k and (max_k is None or streak <= max_k):
                candidates.append((min_k, float(cfg.get("multiplier", 1.0))))

        if not candidates:
            return 1.0

        return max(candidates, key=lambda t: t[0])[1]

    def base_xp(self, user):
        actual_season = Season.get_user_active_season(user)

        if not actual_season:
            raise NoSeasonFoundError(f'No active season found for {user.profile.employer.name}.')

        months_to_end_season = (actual_season.end_date - datetime.today().date()).days / 30
        xp = self.get_xp_settings()

        if months_to_end_season < self.settings.months_to_end_season:
            try:
                main_user_group = user.profile.groups.get(main=True)
            except Group.MultipleObjectsReturned:
                raise MultipleGroupMembersError("User is member of multiple main groups.")

            bonus_percentage = self.settings.season_bonus_percentage / 100
            if user.profile.score < main_user_group.points_first_place() * bonus_percentage:
                xp += xp * (self.settings.season_bonus_percentage / 100)

        return xp


class WorkoutGamification(GamificationService):
    def __init__(self):
        super().__init__()
        self._key_min_multiplier = "min_workouts"
        self._key_max_multiplier = "max_workouts"

    def get_xp_settings(self):
        return self.settings.workout_xp

    def get_streak(self, user):
        return user.workout_streak.current_streak

    @property
    def multiplier_streak_attr(self):
        return "multiplier_workout_streak"

    def calculate(self, user, *args):
        if len(args) != 1:
            raise ValueError("WorkoutGamification.calculate expects exactly 1 extra argument: duration")

        duration = args[0]
        duration_min = duration.total_seconds() / 60
        base_points = self.base_xp(user)
        workout_minutes_base = self.settings.workout_minutes
        multiplier = self.get_multiplier(user)
        workout_xp_today = user.workouts.filter(workout_date__date=datetime.today().date()).aggregate(
            total=Sum('base_points')
        )['total'] or 0

        if workout_xp_today >= self.settings.max_workout_xp:
            return 0
        else:
            last_points_today = self.settings.max_workout_xp - workout_xp_today

            if duration_min < workout_minutes_base:
                return min(float(base_points / 2) * multiplier, last_points_today)

            if duration_min == workout_minutes_base:
                return min(float(base_points) * multiplier, last_points_today)

            if workout_minutes_base < duration_min < workout_minutes_base * 2:
                return min(float(base_points * 1.5) * multiplier, last_points_today)

            if duration_min >= workout_minutes_base * 2:
                return min(float(base_points * 2) * multiplier, last_points_today)

        raise ValueError("Invalid duration value.")


class MealGamification(GamificationService):
    def __init__(self):
        super().__init__()
        self._key_min_multiplier = "min_days"
        self._key_max_multiplier = "max_days"

    def get_xp_settings(self):
        return self.settings.meal_xp

    def get_streak(self, user):
        return user.meal_streak.current_streak

    @property
    def multiplier_streak_attr(self):
        return "multiplier_meal_streak"


class Gamification:
    def __init__(self):
        self._settings = None

    Workout = WorkoutGamification()
    Meal = MealGamification()

    @cached_property
    def settings(self):
        return GamificationSettings.load()

    @staticmethod
    def get_xp(user):
        return user.profile.score

    @staticmethod
    def set_xp(user, xp):
        user.profile.score = xp
        user.profile.save()

    def add_xp(self, user, xp):
        user.profile.score += xp

        # Recalculate level based on current score
        new_level = self.convert_to_level(user.profile.score)
        user.profile.level = new_level

        user.profile.save()

    def remove_xp(self, user, xp):
        user.profile.score -= xp

        # Ensure score doesn't go negative
        if user.profile.score < 0:
            user.profile.score = 0

        # Recalculate level based on current score
        new_level = self.convert_to_level(user.profile.score)
        user.profile.level = new_level

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
            total_meal_xp += self.Meal.calculate(user)

        return {
            "workout_xp": total_workout_xp,
            "meal_xp": total_meal_xp,
            "total_xp": total_workout_xp + total_meal_xp
        }

    def convert_to_level(self, xp):
        # Handle edge cases
        if xp <= 0:
            return 0

        base_xp = self.settings.xp_base
        exponential_factor = self.settings.exponential_factor
        level = (xp / base_xp) ** (1 / exponential_factor)

        return floor(level)

    def convert_to_xp(self, level):
        base_xp = self.settings.xp_base
        exponential_factor = self.settings.exponential_factor
        xp = base_xp * (level ** exponential_factor)

        return xp

    def points_to_next_level(self, user):
        user_xp = self.get_xp(user)
        next_level = self.get_level(user) + 1

        return max(int(self.convert_to_xp(next_level) - user_xp), 0)
