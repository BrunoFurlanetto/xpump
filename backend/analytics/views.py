from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Count, Q, Max, Avg
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.serializer import (
    SystemStatsSerializer,
    UserStatsSerializer,
    GroupStatsSerializer,
    ActivitySerializer,
    UserDetailSerializer,
    GroupDetailSerializer
)
from gamification.models import Season
from groups.models import Group, GroupMembers
from nutrition.models import Meal, MealStreak
from profiles.models import Profile
from social_feed.models import Post, Comment, PostLike, CommentLike, Report
from workouts.models import WorkoutCheckin, WorkoutStreak


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


@extend_schema(tags=['Admin Analytics'])
class SystemStatsAPIView(APIView):
    """
    GET endpoint for overall system statistics.
    Returns aggregated data about users, workouts, meals, social feed, and moderation.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Get system-wide statistics",
        description="Returns comprehensive statistics about the entire system including users, activities, and engagement metrics.",
        responses={200: SystemStatsSerializer}
    )
    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # User statistics
        total_users = User.objects.filter(is_staff=False, is_superuser=False).count()

        # Active users (had activity in last 7 days)
        active_user_ids = set()
        active_user_ids.update(
            WorkoutCheckin.objects.filter(workout_date__gte=week_start)
            .values_list('user_id', flat=True).distinct()
        )
        active_user_ids.update(
            Meal.objects.filter(meal_time__gte=week_start)
            .values_list('user_id', flat=True).distinct()
        )
        active_user_ids.update(
            Post.objects.filter(created_at__gte=week_start)
            .values_list('user_id', flat=True).distinct()
        )
        active_users = len(active_user_ids)
        inactive_users = total_users - active_users

        new_users_this_month = User.objects.filter(
            is_staff=False,
            is_superuser=False,
            date_joined__gte=month_start
        ).count()

        # Group statistics
        total_groups = Group.objects.count()

        # Workout statistics
        total_workouts = WorkoutCheckin.objects.count()
        workouts_today = WorkoutCheckin.objects.filter(workout_date__gte=today_start).count()
        workouts_this_week = WorkoutCheckin.objects.filter(workout_date__gte=week_start).count()
        workouts_this_month = WorkoutCheckin.objects.filter(workout_date__gte=month_start).count()

        # Meal statistics
        total_meals = Meal.objects.count()
        meals_today = Meal.objects.filter(meal_time__gte=today_start).count()
        meals_this_week = Meal.objects.filter(meal_time__gte=week_start).count()
        meals_this_month = Meal.objects.filter(meal_time__gte=month_start).count()

        # Social feed statistics
        total_posts = Post.objects.count()
        total_comments = Comment.objects.count()
        total_likes = PostLike.objects.count() + CommentLike.objects.count()
        posts_today = Post.objects.filter(created_at__gte=today_start).count()
        posts_this_week = Post.objects.filter(created_at__gte=week_start).count()

        # Moderation statistics
        pending_reports = Report.objects.filter(status='pending').count()

        # Gamification statistics
        profile_stats = Profile.objects.filter(
            user__is_staff=False,
            user__is_superuser=False
        ).aggregate(
            avg_level=Avg('level'),
            avg_score=Avg('score')
        )

        workout_streak_stats = WorkoutStreak.objects.aggregate(
            avg_streak=Avg('current_streak')
        )

        meal_streak_stats = MealStreak.objects.aggregate(
            avg_streak=Avg('current_streak')
        )

        # Season statistics
        active_seasons = Season.objects.filter(
            start_date__lte=now.date(),
            end_date__gte=now.date()
        ).count()

        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'new_users_this_month': new_users_this_month,
            'total_groups': total_groups,
            'total_workouts': total_workouts,
            'workouts_today': workouts_today,
            'workouts_this_week': workouts_this_week,
            'workouts_this_month': workouts_this_month,
            'total_meals': total_meals,
            'meals_today': meals_today,
            'meals_this_week': meals_this_week,
            'meals_this_month': meals_this_month,
            'total_posts': total_posts,
            'total_comments': total_comments,
            'total_likes': total_likes,
            'posts_today': posts_today,
            'posts_this_week': posts_this_week,
            'pending_reports': pending_reports,
            'average_user_level': round(profile_stats['avg_level'] or 0, 2),
            'average_user_score': round(profile_stats['avg_score'] or 0, 2),
            'average_workout_streak': round(workout_streak_stats['avg_streak'] or 0, 2),
            'average_meal_streak': round(meal_streak_stats['avg_streak'] or 0, 2),
            'active_seasons': active_seasons,
        }

        serializer = SystemStatsSerializer(stats)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['Admin Analytics'])
class UserListAPIView(ListAPIView):
    """
    GET endpoint for listing all users with their statistics.
    Supports pagination, ordering, filtering, and search.
    """
    permission_classes = [IsAdminUser]
    serializer_class = UserStatsSerializer
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        summary="List all users with statistics",
        description="Returns paginated list of users with their activity counts, streaks, and engagement metrics.",
        parameters=[
            OpenApiParameter(name='ordering', description='Field to order by (prefix with - for descending)', type=str),
            OpenApiParameter(name='is_active', description='Filter by active status', type=bool),
            OpenApiParameter(name='search', description='Search by username, name, or email', type=str),
        ]
    )
    def get_queryset(self):
        now = timezone.now()
        week_ago = now - timedelta(days=7)

        # Base queryset excluding staff and superusers
        queryset = User.objects.filter(
            is_staff=False,
            is_superuser=False
        ).select_related('profile').annotate(
            workout_count=Count('workouts', distinct=True),
            meal_count=Count('meals', distinct=True),
            post_count=Count('posts', distinct=True),
            last_workout=Max('workouts__workout_date'),
            last_meal=Max('meals__meal_time'),
            last_post=Max('posts__created_at'),
            group_count=Count('profile__groups', distinct=True)
        )

        # Apply search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )

        # Apply active filter
        is_active_param = self.request.query_params.get('is_active', None)
        if is_active_param is not None:
            is_active = is_active_param.lower() == 'true'
            if is_active:
                # Users with activity in last 7 days
                active_ids = set()
                active_ids.update(
                    WorkoutCheckin.objects.filter(workout_date__gte=week_ago)
                    .values_list('user_id', flat=True).distinct()
                )
                active_ids.update(
                    Meal.objects.filter(meal_time__gte=week_ago)
                    .values_list('user_id', flat=True).distinct()
                )
                queryset = queryset.filter(id__in=active_ids)
            else:
                # Inactive users
                active_ids = set()
                active_ids.update(
                    WorkoutCheckin.objects.filter(workout_date__gte=week_ago)
                    .values_list('user_id', flat=True).distinct()
                )
                active_ids.update(
                    Meal.objects.filter(meal_time__gte=week_ago)
                    .values_list('user_id', flat=True).distinct()
                )
                queryset = queryset.exclude(id__in=active_ids)

        # Apply ordering
        ordering = self.request.query_params.get('ordering', '-date_joined')
        valid_orderings = [
            'username', '-username',
            'date_joined', '-date_joined',
            'workout_count', '-workout_count',
            'meal_count', '-meal_count',
            'profile__score', '-profile__score',
            'profile__level', '-profile__level'
        ]
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        now = timezone.now()
        week_ago = now - timedelta(days=7)

        users_data = []
        for user in (page if page is not None else queryset):
            # Calculate last activity
            last_activity = None
            activity_dates = [
                user.last_workout,
                user.last_meal,
                user.last_post
            ]
            activity_dates = [d for d in activity_dates if d is not None]
            if activity_dates:
                last_activity = max(activity_dates)

            is_active = last_activity and last_activity >= week_ago if last_activity else False

            # Get streak info
            workout_streak = WorkoutStreak.objects.filter(user=user).first()
            meal_streak = MealStreak.objects.filter(user=user).first()

            user_data = {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'date_joined': user.date_joined,
                'profile_score': user.profile.score if hasattr(user, 'profile') else 0,
                'profile_level': user.profile.level if hasattr(user, 'profile') else 0,
                'workout_count': user.workout_count,
                'meal_count': user.meal_count,
                'post_count': user.post_count,
                'current_workout_streak': workout_streak.current_streak if workout_streak else 0,
                'longest_workout_streak': workout_streak.longest_streak if workout_streak else 0,
                'current_meal_streak': meal_streak.current_streak if meal_streak else 0,
                'longest_meal_streak': meal_streak.longest_streak if meal_streak else 0,
                'last_activity': last_activity,
                'is_active': is_active,
                'group_count': user.group_count,
            }
            users_data.append(user_data)

        if page is not None:
            serializer = self.get_serializer(users_data, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(users_data, many=True)
        return Response(serializer.data)


@extend_schema(tags=['Admin Analytics'])
class GroupListAPIView(ListAPIView):
    """
    GET endpoint for listing all groups with their statistics.
    """
    permission_classes = [IsAdminUser]
    serializer_class = GroupStatsSerializer
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        summary="List all groups with statistics",
        description="Returns paginated list of groups with member counts and activity metrics."
    )
    def get_queryset(self):
        return Group.objects.all().select_related('created_by', 'owner').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)

        groups_data = []
        for group in (page if page is not None else queryset):
            # Get group members
            members = GroupMembers.objects.filter(group=group, pending=False)
            member_ids = list(members.values_list('member_id', flat=True))
            member_count = len(member_ids)

            # Active members today
            active_today = set()
            active_today.update(
                WorkoutCheckin.objects.filter(
                    user_id__in=member_ids,
                    workout_date__gte=today_start
                ).values_list('user_id', flat=True).distinct()
            )
            active_today.update(
                Meal.objects.filter(
                    user_id__in=member_ids,
                    meal_time__gte=today_start
                ).values_list('user_id', flat=True).distinct()
            )

            # Active members this week
            active_week = set()
            active_week.update(
                WorkoutCheckin.objects.filter(
                    user_id__in=member_ids,
                    workout_date__gte=week_start
                ).values_list('user_id', flat=True).distinct()
            )
            active_week.update(
                Meal.objects.filter(
                    user_id__in=member_ids,
                    meal_time__gte=week_start
                ).values_list('user_id', flat=True).distinct()
            )

            # Total activities
            total_workouts = WorkoutCheckin.objects.filter(user_id__in=member_ids).count()
            total_meals = Meal.objects.filter(user_id__in=member_ids).count()
            workouts_week = WorkoutCheckin.objects.filter(
                user_id__in=member_ids,
                workout_date__gte=week_start
            ).count()
            meals_week = Meal.objects.filter(
                user_id__in=member_ids,
                meal_time__gte=week_start
            ).count()

            # Get top performer
            ranking = group.rank()
            top_performer_username = None
            top_performer_score = None
            if ranking:
                top_user, top_score = ranking[0]
                top_performer_username = top_user.username
                top_performer_score = top_score

            group_data = {
                'id': group.id,
                'name': group.name,
                'description': group.description,
                'created_at': group.created_at,
                'created_by': group.created_by.username,
                'owner': group.owner.username,
                'is_main': group.main,
                'member_count': member_count,
                'active_members_today': len(active_today),
                'active_members_this_week': len(active_week),
                'total_workouts': total_workouts,
                'total_meals': total_meals,
                'workouts_this_week': workouts_week,
                'meals_this_week': meals_week,
                'top_performer_username': top_performer_username,
                'top_performer_score': top_performer_score,
            }
            groups_data.append(group_data)

        if page is not None:
            serializer = self.get_serializer(groups_data, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(groups_data, many=True)
        return Response(serializer.data)


@extend_schema(tags=['Admin Analytics'])
class RecentActivitiesAPIView(APIView):
    """
    GET endpoint for recent system activities.
    Returns a combined feed of workouts, meals, new users, and new groups.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Get recent system activities",
        description="Returns recent activities across the system including workouts, meals, new users, and new groups.",
        parameters=[
            OpenApiParameter(name='limit', description='Maximum number of activities to return', type=int),
            OpenApiParameter(name='type', description='Filter by activity type (workout, meal, user_joined, group_created)', type=str),
        ]
    )
    def get(self, request):
        limit = int(request.query_params.get('limit', 20))
        activity_type = request.query_params.get('type', None)

        activities = []

        # Workout activities
        if not activity_type or activity_type == 'workout':
            workouts = WorkoutCheckin.objects.select_related('user').order_by('-workout_date')[:limit]
            for workout in workouts:
                duration_minutes = int(workout.duration.total_seconds() / 60)
                activities.append({
                    'id': workout.id,
                    'type': 'workout',
                    'user_id': workout.user.id,
                    'user_name': workout.user.get_full_name() or workout.user.username,
                    'description': f'Registrou um treino de {duration_minutes} minutos',
                    'timestamp': workout.workout_date,
                    'related_id': workout.id,
                    'details': {
                        'duration': duration_minutes,
                        'location': workout.location,
                        'points': workout.base_points,
                    }
                })

        # Meal activities
        if not activity_type or activity_type == 'meal':
            meals = Meal.objects.select_related('user', 'meal_type').order_by('-meal_time')[:limit]
            for meal in meals:
                activities.append({
                    'id': meal.id,
                    'type': 'meal',
                    'user_id': meal.user.id,
                    'user_name': meal.user.get_full_name() or meal.user.username,
                    'description': f'Registrou {meal.meal_type.get_meal_name_display()}',
                    'timestamp': meal.meal_time,
                    'related_id': meal.id,
                    'details': {
                        'meal_type': meal.meal_type.meal_name,
                        'points': meal.base_points,
                    }
                })

        # New user activities
        if not activity_type or activity_type == 'user_joined':
            new_users = User.objects.filter(
                is_staff=False,
                is_superuser=False
            ).order_by('-date_joined')[:limit]
            for user in new_users:
                activities.append({
                    'id': user.id,
                    'type': 'user_joined',
                    'user_id': user.id,
                    'user_name': user.get_full_name() or user.username,
                    'description': 'Novo usuário cadastrado',
                    'timestamp': user.date_joined,
                    'related_id': user.id,
                    'details': {
                        'username': user.username,
                        'email': user.email,
                    }
                })

        # New group activities
        if not activity_type or activity_type == 'group_created':
            new_groups = Group.objects.select_related('created_by').order_by('-created_at')[:limit]
            for group in new_groups:
                activities.append({
                    'id': group.id,
                    'type': 'group_created',
                    'user_id': group.created_by.id,
                    'user_name': group.created_by.get_full_name() or group.created_by.username,
                    'description': f'Criou o grupo "{group.name}"',
                    'timestamp': group.created_at,
                    'related_id': group.id,
                    'details': {
                        'group_name': group.name,
                        'group_id': group.id,
                    }
                })

        # Sort by timestamp and limit
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        activities = activities[:limit]

        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['Admin Analytics'])
class UserDetailAPIView(APIView):
    """
    GET endpoint for detailed information about a specific user.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Get detailed user information",
        description="Returns comprehensive information about a specific user including all activity metrics and group memberships."
    )
    def get(self, request, user_id):
        try:
            user = User.objects.select_related('profile').get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get activity counts
        workout_count = WorkoutCheckin.objects.filter(user=user).count()
        meal_count = Meal.objects.filter(user=user).count()
        post_count = Post.objects.filter(user=user).count()
        comment_count = Comment.objects.filter(user=user).count()

        # Get last activities
        last_workout = WorkoutCheckin.objects.filter(user=user).aggregate(
            last=Max('workout_date')
        )['last']
        last_meal = Meal.objects.filter(user=user).aggregate(
            last=Max('meal_time')
        )['last']
        last_post = Post.objects.filter(user=user).aggregate(
            last=Max('created_at')
        )['last']

        # Calculate last activity
        activity_dates = [last_workout, last_meal, last_post]
        activity_dates = [d for d in activity_dates if d is not None]
        last_activity = max(activity_dates) if activity_dates else None

        now = timezone.now()
        week_ago = now - timedelta(days=7)
        is_active = last_activity and last_activity >= week_ago if last_activity else False

        # Get streaks
        workout_streak = WorkoutStreak.objects.filter(user=user).first()
        meal_streak = MealStreak.objects.filter(user=user).first()

        # Get groups
        groups = []
        if hasattr(user, 'profile'):
            group_memberships = GroupMembers.objects.filter(
                member=user,
                pending=False
            ).select_related('group')
            for membership in group_memberships:
                groups.append({
                    'id': membership.group.id,
                    'name': membership.group.name,
                    'is_admin': membership.is_admin,
                    'joined_at': membership.joined_at,
                })

        # Get employer info
        employer_name = None
        if hasattr(user, 'profile') and user.profile.employer:
            employer_name = user.profile.employer.name

        user_data = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'date_joined': user.date_joined,
            'profile_score': user.profile.score if hasattr(user, 'profile') else 0,
            'profile_level': user.profile.level if hasattr(user, 'profile') else 0,
            'height': user.profile.height if hasattr(user, 'profile') else None,
            'weight': user.profile.weight if hasattr(user, 'profile') else None,
            'workout_count': workout_count,
            'meal_count': meal_count,
            'post_count': post_count,
            'comment_count': comment_count,
            'current_workout_streak': workout_streak.current_streak if workout_streak else 0,
            'longest_workout_streak': workout_streak.longest_streak if workout_streak else 0,
            'current_meal_streak': meal_streak.current_streak if meal_streak else 0,
            'longest_meal_streak': meal_streak.longest_streak if meal_streak else 0,
            'workout_frequency': workout_streak.frequency if workout_streak else 3,
            'last_workout': last_workout,
            'last_meal': last_meal,
            'last_post': last_post,
            'last_activity': last_activity,
            'is_active': is_active,
            'groups': groups,
            'employer_name': employer_name,
        }

        serializer = UserDetailSerializer(user_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['Admin Analytics'])
class GroupDetailAPIView(APIView):
    """
    GET endpoint for detailed information about a specific group.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Get detailed group information",
        description="Returns comprehensive information about a specific group including all activity metrics and top members."
    )
    def get(self, request, group_id):
        try:
            group = Group.objects.select_related('created_by', 'owner').get(id=group_id)
        except Group.DoesNotExist:
            return Response(
                {'detail': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Get members
        members = GroupMembers.objects.filter(group=group, pending=False)
        member_ids = list(members.values_list('member_id', flat=True))
        member_count = len(member_ids)
        admin_count = members.filter(is_admin=True).count()
        pending_members = GroupMembers.objects.filter(group=group, pending=True).count()

        # Activity counts
        total_workouts = WorkoutCheckin.objects.filter(user_id__in=member_ids).count()
        total_meals = Meal.objects.filter(user_id__in=member_ids).count()
        total_posts = Post.objects.filter(user_id__in=member_ids).count()

        workouts_today = WorkoutCheckin.objects.filter(
            user_id__in=member_ids,
            workout_date__gte=today_start
        ).count()
        workouts_week = WorkoutCheckin.objects.filter(
            user_id__in=member_ids,
            workout_date__gte=week_start
        ).count()
        workouts_month = WorkoutCheckin.objects.filter(
            user_id__in=member_ids,
            workout_date__gte=month_start
        ).count()

        meals_today = Meal.objects.filter(
            user_id__in=member_ids,
            meal_time__gte=today_start
        ).count()
        meals_week = Meal.objects.filter(
            user_id__in=member_ids,
            meal_time__gte=week_start
        ).count()
        meals_month = Meal.objects.filter(
            user_id__in=member_ids,
            meal_time__gte=month_start
        ).count()

        # Active members
        active_today = set()
        active_today.update(
            WorkoutCheckin.objects.filter(
                user_id__in=member_ids,
                workout_date__gte=today_start
            ).values_list('user_id', flat=True).distinct()
        )
        active_today.update(
            Meal.objects.filter(
                user_id__in=member_ids,
                meal_time__gte=today_start
            ).values_list('user_id', flat=True).distinct()
        )

        active_week = set()
        active_week.update(
            WorkoutCheckin.objects.filter(
                user_id__in=member_ids,
                workout_date__gte=week_start
            ).values_list('user_id', flat=True).distinct()
        )
        active_week.update(
            Meal.objects.filter(
                user_id__in=member_ids,
                meal_time__gte=week_start
            ).values_list('user_id', flat=True).distinct()
        )

        active_month = set()
        active_month.update(
            WorkoutCheckin.objects.filter(
                user_id__in=member_ids,
                workout_date__gte=month_start
            ).values_list('user_id', flat=True).distinct()
        )
        active_month.update(
            Meal.objects.filter(
                user_id__in=member_ids,
                meal_time__gte=month_start
            ).values_list('user_id', flat=True).distinct()
        )

        # Get top members
        ranking = group.rank()
        top_members = []
        for idx, (member, score) in enumerate(ranking[:10], 1):  # Top 10
            top_members.append({
                'rank': idx,
                'user_id': member.id,
                'username': member.username,
                'full_name': member.get_full_name() or member.username,
                'score': score,
                'level': member.profile.level if hasattr(member, 'profile') else 0,
            })

        group_data = {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'created_at': group.created_at,
            'created_by': group.created_by.username,
            'owner': group.owner.username,
            'is_main': group.main,
            'member_count': member_count,
            'admin_count': admin_count,
            'pending_members': pending_members,
            'total_workouts': total_workouts,
            'total_meals': total_meals,
            'total_posts': total_posts,
            'workouts_today': workouts_today,
            'workouts_this_week': workouts_week,
            'workouts_this_month': workouts_month,
            'meals_today': meals_today,
            'meals_this_week': meals_week,
            'meals_this_month': meals_month,
            'active_members_today': len(active_today),
            'active_members_this_week': len(active_week),
            'active_members_this_month': len(active_month),
            'top_members': top_members,
        }

        serializer = GroupDetailSerializer(group_data)
        return Response(serializer.data, status=status.HTTP_200_OK)

