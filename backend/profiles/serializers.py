from rest_framework import serializers

from workouts.models import WorkoutStreak
from .models import Profile


class ProfilesSerialializer(serializers.ModelSerializer):
    streak = serializers.SerializerMethodField()

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
            'streak'
        )

    def get_streak(self, obj):
        try:
            streak_workout = WorkoutStreak.objects.get(user=obj.user)
            return {
                'current_streak': streak_workout.current_streak,
                'longest_streak': streak_workout.longest_streak,
                'last_workout_date': streak_workout.last_workout_datetime.astimezone()
            }
        except WorkoutStreak.DoesNotExist:
            return {
                'current_streak': 0,
                'longest_streak': 0,
                'last_workout_date': None
            }
