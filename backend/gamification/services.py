from abc import ABC, abstractmethod
from datetime import datetime

from gamification.models import GamificationSettings, Season
from groups.exceptions import MultipleGroupMembersError
from groups.models import Group


class GamificationService(ABC):
    def __init__(self):
        self._settings = None

    @property
    def settings(self):
        if self._settings is None:
            self._settings, _ = GamificationSettings.objects.get_or_create(pk=1)

        return self._settings

    @abstractmethod
    def get_xp_settings(self):
        ...

    @abstractmethod
    def calculate(self, user, *args, **kwargs):
        ...

    @abstractmethod
    def get_multiplier(self, user):
        ...

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
    def get_xp_settings(self):
        return self.settings.workout_xp

    def calculate(self, user, *args):
        if len(args) != 1:
            raise ValueError("WorkoutGamification.calculate expects exactly 1 extra argument: duration")

        duration = args[0]
        base_points = self.base_xp(user)
        workout_minutes_base = self.settings.workout_minutes
        multiplier = self.get_multiplier(user)

        return float(base_points * ((duration.total_seconds() / 60) / workout_minutes_base)) * multiplier

    def get_multiplier(self, user):
        """
        The multiplier will be get based on the check-in sequence. In the first scenario, the multiplier will increase according to the following rule.
            1. Minor 5 check-ins the multiplier will be 1 (defult value);
            2. Between 5 and 10: check-ins:  Multiplier recieve 1.25 (increase of the 25%);
            3. Between 10 and 20 check-ins: Multiplier recieve 1.50 (increase of the 20%)
            4. Between 20 and 40: Multiplier recieve 1.75 (increase o the 16% approximately)
            5. Between 40 and 80 check-ins: Multiplier recieve 2.0 (Increase of the 14% approximately)
        At first, multiplier equal 2.0 is the roof, but this value can be altered, base on the first test version app.
        """
        streak = user.workout_streak.current_streak
        candidates = []

        for cfg in self.settings.multiplier_workout_streak.values():
            min_w = cfg.get("min_workouts", 0) or 0
            max_w = cfg.get("max_workouts")

            if streak >= min_w and (max_w is None or streak <= max_w):
                candidates.append((min_w, float(cfg.get("multiplier", 1.0))))

        if not candidates:
            return 1.0

        return max(candidates, key=lambda t: t[0])[1]


class MealGamification(GamificationService):
    def get_xp_settings(self):
        return self.settings.meal_xp

    def calculate(self, user, *args):
        ...

    def get_multiplier(self, user):
        ...


class Gamification:
    Workout = WorkoutGamification()
    Meal = MealGamification()

    @staticmethod
    def get_xp(user):
        return user.profile.score

    @staticmethod
    def set_xp(user, xp):
        user.profile.score = xp
        user.profile.save()

    @staticmethod
    def add_xp(user, xp):
        user.profile.score += xp
        user.profile.save()

    @staticmethod
    def remove_xp(user, xp):
        user.profile.score -= xp
        user.profile.save()

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
