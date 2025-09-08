from collections import defaultdict

from django.db.models import Window, F
from django.db.models.functions.window import Rank
from rest_framework import serializers

from groups.models import GroupMembers
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
            'workout_streak',  # Computed field with workout streak data
            'meal_streak',  # Computed field with meal streak data
        )

    def get_groups(self, obj):
        """
        Get detailed information about groups the user participates in.
        Returns list with id, name, member count, and user's position based on score.
        """
        user_groups = obj.groups.all()
        group_ids = list(user_groups.values_list('id', flat=True))
        groups_data = []

        members_qs = (
            GroupMembers.objects
            .filter(group_id__in=group_ids)
            .select_related('group', 'member__profile')
            .annotate(
                rank=Window(
                    expression=Rank(),
                    partition_by=[F('group')],
                    order_by=F('member__profile__score').desc()
                )
            )
        )

        # Build a mapping: group_id -> list of members (with rank)
        group_members_map = defaultdict(list)

        for gm in members_qs:
            group_members_map[gm.group_id].append(gm)

        for group in user_groups:
            members = group_members_map[group.id]
            member_count = len(members)
            # Find the user's position in this group
            user_member = next((gm for gm in members if gm.member_id == obj.user.id), None)
            user_position = user_member.rank if user_member else None

            groups_data.append({
                'id': group.id,
                'name': group.name,
                'member_count': member_count,
                'position': user_position
            })

        return groups_data

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
