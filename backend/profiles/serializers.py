from rest_framework import serializers

from nutrition.models import MealStreak, MealConfig
from workouts.models import WorkoutStreak
from .models import Profile


class ProfilesSerialializer(serializers.ModelSerializer):
    """
    Serializer for Profile model with additional workout streak information.
    Includes computed field for user's workout streak data.
    """
    workout_streak = serializers.SerializerMethodField()  # Read-only field for workout streak information
    meal_streak = serializers.SerializerMethodField()  # Read-only for meal streak information

    class Meta:
        model = Profile
        fields = (
            'id',
            'user',
            'height',
            'weight',
            'photo',
            'notification_preferences',
            'score',
            'groups',
            'workout_streak',  # Computed field with workout streak data
            'meal_streak',  # Computed field with meal streak data
        )

    def get_workout_streak(self, obj):
        """
        Get workout streak information for the profile's user.
        Returns current streak, longest streak, and last workout date.
        Returns default values if no workout streak record exists.
        """
        # Fetch workout streak data for the user
        streak_workout, created = WorkoutStreak.objects.get_or_create(user=obj.user)

        if not created:
            return {
                'current_streak': streak_workout.current_streak,
                'longest_streak': streak_workout.longest_streak,
                'weekly_remaining': streak_workout.weekly_remaining,
                'weekly_expected': streak_workout.frequency,
                'last_workout_date': streak_workout.last_workout_datetime.astimezone()  # Convert to user's timezone
            }
        else:
            # Return default values if no streak record exists
            return {
                'current_streak': 0,
                'longest_streak': 0,
                'weekly_remaining': 0,
                'weekly_expected': 0,
                'last_workout_date': None
            }

    def get_meal_streak(self, obj):
        # Fetch workout streak data for the user
        streak_meal, created = MealStreak.objects.get_or_create(user=obj.user)
        meals_registered = MealConfig.all_meals_count()

        if not created:
            return {
                'current_streak': streak_meal.current_streak,
                'longest_streak': streak_meal.longest_streak,
                'weekly_remaining': streak_meal.weekly_remaining,
                'weekly_expected': meals_registered * 7,
                'last_workout_date': streak_meal.last_meal_datetime.astimezone()  # Convert to user's timezone
            }
        else:
            # Return default values if no streak record exists
            return {
                'current_streak': 0,
                'longest_streak': 0,
                'weekly_remaining': 0,
                'weekly_expected': 0,
                'last_workout_date': None
            }
