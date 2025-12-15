from django.db.models import Window, F, Count, OuterRef, Subquery, IntegerField
from django.db.models.functions import Rank
from rest_framework import serializers

from groups.models import Group, GroupMembers
from nutrition.models import Meal
from workouts.models import WorkoutCheckin


class GroupSerializer(serializers.ModelSerializer):
    """
    Serializer for Group model.
    Handles serialization/deserialization of group data for API endpoints.
    """

    members = serializers.SerializerMethodField()
    pending_members = serializers.SerializerMethodField()
    created_by = serializers.CharField(source='created_by.get_full_name', read_only=True)
    stats = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Group
        fields = [
            'id',
            'name',
            'description',
            'created_by',
            'owner',
            'created_at',
            'stats',
            'members',
            'pending_members',
            'main',
        ]  # Include all model fields in serialization
        read_only_fields = ['created_by', 'created_at', 'members', 'pending_members', 'main', 'stats']  # Prevent modification of read-only fields

    def get_members(self, obj):
        """
        Retrieve and serialize the members of the group.
        Uses GroupMemberSerializer to represent each member.
        """
        members = obj.groupmembers_set.select_related('member', 'member__profile').filter(pending=False).annotate(
            score=F('member__profile__score'),
            position=Window(
                expression=Rank(),
                order_by=F('member__profile__score').desc(),
            )
        ).order_by('position')

        self._members_cache = members
        self._members_count_cache = len(members)

        return [{
                "id": member.member.id,
                "username": member.member.username,
                "full_name": member.member.get_full_name(),
                "email": member.member.email,
                "profile_id": getattr(getattr(member.member, 'profile', None), 'id', None),
                "is_admin": member.is_admin,
                "joined_at": member.joined_at,
                "pending": member.pending,
                "position": int(member.position) if not member.pending else None,
                "score": member.score if not member.pending else None,
                "workouts": member.member.workouts.count(),
                "meals": member.member.meals.count(),
            }
            for member in members
        ]

    def get_pending_members(self, obj):
        """
        Retrieve and serialize the pending members of the group.
        Uses GroupMemberSerializer to represent each pending member.
        """
        pending_members = obj.groupmembers_set.select_related('member', 'member__profile').filter(pending=True)

        return [{
                "id": member.member.id,
                "username": member.member.username,
                "email": member.member.email,
                "profile_id": getattr(getattr(member.member, 'profile', None), 'id', None),
                "joined_at": member.joined_at,
            }
            for member in pending_members
        ]

    def get_stats(self, obj):
        """
        Return group statistics (use cache if available):
            - total_members
            - total_points
            - total_workouts
            - total_meals
            - mean_streak
            - mean_workout_streak
            - mean_meal_streak
        """
        from django.db.models import Sum, Avg

        if hasattr(self, '_members_cache'):
            members = self._members_cache
            members = list(members) if not isinstance(members, list) else members
            total_members = getattr(self, '_members_count_cache', len(members))

            total_points = 0
            total_workouts = 0
            total_meals = 0
            workout_streaks = []
            meal_streaks = []

            for gm in members:
                # pontos (anotação 'score' ou fallback para profile.score)
                score = getattr(gm, 'score', None)
                if score is None:
                    score = getattr(getattr(gm, 'member', None), 'profile', None)
                    score = getattr(score, 'score', 0) if score is not None else 0

                total_points += score or 0

                # contagens (usa .count() para evitar carregar objetos)
                member_obj = getattr(gm, 'member', None)

                if member_obj is not None:
                    try:
                        total_workouts += member_obj.workouts.count()
                    except Exception:
                        pass
                    try:
                        total_meals += member_obj.meals.count()
                    except Exception:
                        pass

                    if getattr(member_obj, 'workout_streak', None) is not None:
                        workout_streaks.append(member_obj.workout_streak.current_streak)
                    if getattr(member_obj, 'meal_streak', None) is not None:
                        meal_streaks.append(member_obj.meal_streak.current_streak)

            mean_workout_streak = (sum(workout_streaks) / len(workout_streaks)) if workout_streaks else None
            mean_meal_streak = (sum(meal_streaks) / len(meal_streaks)) if meal_streaks else None

            return {
                "total_members": total_members,
                "total_points": total_points,
                "total_workouts": total_workouts,
                "total_meals": total_meals,
                "mean_streak": ((mean_workout_streak + mean_meal_streak) / 2) if (mean_workout_streak is not None and mean_meal_streak is not None) else None,
                "mean_workout_streak": mean_workout_streak,
                "mean_meal_streak": mean_meal_streak,
            }

        workouts_subq = WorkoutCheckin.objects.filter(user=OuterRef('member')).values('user').annotate(cnt=Count('id')).values('cnt')
        meals_subq = Meal.objects.filter(user=OuterRef('member')).values('user').annotate(cnt=Count('id')).values('cnt')

        members_annotated = obj.groupmembers_set.filter(pending=False).annotate(
            points=F('member__profile__score'),
            workouts_count=Subquery(workouts_subq, output_field=IntegerField()),
            meals_count=Subquery(meals_subq, output_field=IntegerField()),
        )

        totals = members_annotated.aggregate(
            total_points=Sum('points'),
            total_workouts=Sum('workouts_count'),
            total_meals=Sum('meals_count'),
            mean_workout_streak=Avg('member__workout_streak__current_streak'),
            mean_meal_streak=Avg('member__meal_streak__current_streak'),
        )

        total_members = members_annotated.count()
        mw = totals.get('mean_workout_streak') or 0
        mm = totals.get('mean_meal_streak') or 0

        return {
            "total_members": total_members,
            "total_points": totals.get('total_points') or 0,
            "total_workouts": totals.get('total_workouts') or 0,
            "total_meals": totals.get('total_meals') or 0,
            "mean_streak": (mw + mm) / 2 if (mw or mm) else 0,
            "mean_workout_streak": mw,
            "mean_meal_streak": mm,
        }


class GroupMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for GroupMembers model.
    Controls which fields can be modified and validates member data.
    Only allows updating admin status, while member and join date are read-only.
    """
    class Meta:
        model = GroupMembers
        fields = ['member', 'joined_at', 'is_admin', 'pending']
        read_only_fields = ['member', 'joined_at', 'pending']  # Prevent modification of member and join date

    def validate(self, attrs):
        """
        Validate that no read-only fields are provided in the input data.
        Uses Meta.read_only_fields to avoid duplicating the list of protected fields.
        """
        errors = {}
        read_only = getattr(self.Meta, 'read_only_fields', ())
        for field in read_only:
            if field in (self.initial_data or {}):
                errors[field] = "This field is read-only and cannot be modified."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs
