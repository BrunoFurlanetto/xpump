from rest_framework import serializers

from groups.models import GroupMembers
from workouts.models import WorkoutStreak
from .models import Profile


class ProfilesSerialializer(serializers.ModelSerializer):
    """
    Serializer for Profile model with additional workout streak information.
    Includes computed field for user's workout streak data.
    """
    streak = serializers.SerializerMethodField()  # Read-only field for workout streak information
    groups = serializers.SerializerMethodField()  # Override groups field to return detailed information

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

    def get_groups(self, obj):
        """
        Get detailed information about groups the user participates in.
        Returns list with id, name, member count, and user's position based on score.
        """
        user_groups = obj.groups.all()
        groups_data = []

        for group in user_groups:
            # Count total members in the group
            group_members = GroupMembers.objects.filter(group=group)
            member_count = group_members.count()

            # Get user's position in the group based on score
            members_positions = group_members.order_by('-member__profile__score')
            user_position = list(members_positions).index(
                next((gm for gm in group_members if gm.member == obj.user), None)
            ) + 1

            groups_data.append({
                'id': group.id,
                'name': group.name,
                'member_count': member_count,
                'position': user_position
            })

        return groups_data

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
