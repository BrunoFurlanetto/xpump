from rest_framework import serializers

from workouts.models import WorkoutStreak
from .models import Profile


class ProfilesSerialializer(serializers.ModelSerializer):
    """
    Serializer for Profile model with additional workout streak information.
    Includes computed field for user's workout streak data.
    """
    streak = serializers.SerializerMethodField()  # Read-only field for workout streak information

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
            'streak'  # Computed field with workout streak data
        )

    def get_streak(self, obj):
        """
        Get workout streak information for the profile's user.
        Returns current streak, longest streak, and last workout date.
        Returns default values if no workout streak record exists.
        """
        try:
            # Fetch workout streak data for the user
            streak_workout = WorkoutStreak.objects.get(user=obj.user)
            return {
                'current_streak': streak_workout.current_streak,
                'longest_streak': streak_workout.longest_streak,
                'last_workout_date': streak_workout.last_workout_datetime.astimezone()  # Convert to user's timezone
            }
        except WorkoutStreak.DoesNotExist:
            # Return default values if no streak record exists
            return {
                'current_streak': 0,
                'longest_streak': 0,
                'last_workout_date': None
            }
