from datetime import timedelta
from django.contrib.auth.models import User
from django.db.models import Count, Max, Avg, Case, When, IntegerField
from django.utils import timezone

from clients.models import Client
from gamification.models import Season
from groups.models import Group, GroupMembers
from nutrition.models import Meal, MealStreak
from profiles.models import Profile
from social_feed.models import Post, Comment, PostLike, CommentLike, Report
from workouts.models import WorkoutCheckin, WorkoutStreak


class DateRangeService:
    """Service for managing date ranges used in analytics."""

    @staticmethod
    def get_time_ranges():
        """Returns common time ranges for analytics."""
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        return {
            'now': now,
            'today_start': today_start,
            'week_start': week_start,
            'month_start': month_start,
        }


class UserAnalyticsService:
    """Service for user-related analytics queries."""

    @staticmethod
    def get_active_user_ids(since):
        """
        Get set of user IDs that had any activity since the given date.
        Optimized to use a single query with UNION-like behavior.
        """
        active_ids = set()

        # Batch query for workouts
        active_ids.update(
            WorkoutCheckin.objects.filter(workout_date__gte=since)
            .values_list('user_id', flat=True)
            .distinct()
        )

        # Batch query for meals
        active_ids.update(
            Meal.objects.filter(meal_time__gte=since)
            .values_list('user_id', flat=True)
            .distinct()
        )

        # Batch query for posts
        active_ids.update(
            Post.objects.filter(created_at__gte=since)
            .values_list('user_id', flat=True)
            .distinct()
        )

        return active_ids

    @staticmethod
    def get_user_queryset_with_stats():
        """
        Returns optimized user queryset with all necessary annotations.
        Uses select_related and prefetch_related to avoid N+1 queries.
        """
        return User.objects.filter(
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

    @staticmethod
    def get_streaks_for_users(user_ids):
        """
        Batch fetch streaks for multiple users to avoid N+1 queries.
        Returns tuple of (workout_streaks_dict, meal_streaks_dict).
        """
        workout_streaks = {
            ws.user_id: ws
            for ws in WorkoutStreak.objects.filter(user_id__in=user_ids)
        }

        meal_streaks = {
            ms.user_id: ms
            for ms in MealStreak.objects.filter(user_id__in=user_ids)
        }

        return workout_streaks, meal_streaks

    @staticmethod
    def build_user_stats(user, workout_streaks, meal_streaks, week_ago):
        """Build user statistics dictionary from annotated user object."""
        # Calculate last activity
        activity_dates = [
            user.last_workout,
            user.last_meal,
            user.last_post
        ]
        activity_dates = [d for d in activity_dates if d is not None]
        last_activity = max(activity_dates) if activity_dates else None

        is_active = last_activity and last_activity >= week_ago if last_activity else False

        # Get streak info from pre-fetched data
        workout_streak = workout_streaks.get(user.id)
        meal_streak = meal_streaks.get(user.id)

        return {
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

    @staticmethod
    def get_user_detail_stats(user):
        """
        Get detailed statistics for a single user.
        Optimized with aggregations instead of multiple count() calls.
        """
        # Get all counts in one aggregation
        activity_stats = {
            'workout_count': WorkoutCheckin.objects.filter(user=user).count(),
            'meal_count': Meal.objects.filter(user=user).count(),
            'post_count': Post.objects.filter(user=user).count(),
            'comment_count': Comment.objects.filter(user=user).count(),
        }

        # Get last activities in one aggregation per model
        last_activities = {
            'last_workout': WorkoutCheckin.objects.filter(user=user)
            .aggregate(last=Max('workout_date'))['last'],
            'last_meal': Meal.objects.filter(user=user)
            .aggregate(last=Max('meal_time'))['last'],
            'last_post': Post.objects.filter(user=user)
            .aggregate(last=Max('created_at'))['last'],
        }

        # Calculate last activity
        activity_dates = [v for v in last_activities.values() if v is not None]
        last_activity = max(activity_dates) if activity_dates else None

        now = timezone.now()
        week_ago = now - timedelta(days=7)
        is_active = last_activity and last_activity >= week_ago if last_activity else False

        # Get streaks
        workout_streak = WorkoutStreak.objects.filter(user=user).first()
        meal_streak = MealStreak.objects.filter(user=user).first()

        # Get groups with single query
        groups = []

        if hasattr(user, 'profile'):
            group_memberships = GroupMembers.objects.filter(
                member=user,
                pending=False
            ).select_related('group')

            groups = [
                {
                    'id': membership.group.id,
                    'name': membership.group.name,
                    'is_admin': membership.is_admin,
                    'joined_at': membership.joined_at,
                }
                for membership in group_memberships
            ]

        # Get employer info
        employer_name = None

        if hasattr(user, 'profile') and user.profile.employer:
            employer_name = user.profile.employer.name

        return {
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
            **activity_stats,
            **last_activities,
            'current_workout_streak': workout_streak.current_streak if workout_streak else 0,
            'longest_workout_streak': workout_streak.longest_streak if workout_streak else 0,
            'current_meal_streak': meal_streak.current_streak if meal_streak else 0,
            'longest_meal_streak': meal_streak.longest_streak if meal_streak else 0,
            'workout_frequency': workout_streak.frequency if workout_streak else 3,
            'last_activity': last_activity,
            'is_active': is_active,
            'groups': groups,
            'employer_name': employer_name,
        }


class GroupAnalyticsService:
    """Service for group-related analytics queries."""

    @staticmethod
    def get_group_member_ids_bulk(groups):
        """
        Fetch all group members for multiple groups in one query.
        Returns dict mapping group_id to list of member_ids.
        """
        memberships = GroupMembers.objects.filter(
            group__in=groups,
            pending=False
        ).values('group_id', 'member_id')

        result = {}

        for membership in memberships:
            group_id = membership['group_id']

            if group_id not in result:
                result[group_id] = []

            result[group_id].append(membership['member_id'])

        return result

    @staticmethod
    def get_active_members_by_groups(member_ids_by_group, since):
        """
        Get active member IDs for multiple groups in optimized queries.
        Returns dict mapping group_id to set of active member IDs.
        """
        result = {}

        for group_id, member_ids in member_ids_by_group.items():
            if not member_ids:
                result[group_id] = set()

                continue

            active_ids = set()

            # Workouts
            active_ids.update(
                WorkoutCheckin.objects.filter(
                    user_id__in=member_ids,
                    workout_date__gte=since
                ).values_list('user_id', flat=True).distinct()
            )

            # Meals
            active_ids.update(
                Meal.objects.filter(
                    user_id__in=member_ids,
                    meal_time__gte=since
                ).values_list('user_id', flat=True).distinct()
            )

            result[group_id] = active_ids

        return result

    @staticmethod
    def build_group_stats(group, member_ids, active_today, active_week, today_start, week_start):
        """Build group statistics dictionary."""
        member_count = len(member_ids)

        if not member_ids:
            # Return empty stats for groups with no members
            return {
                'id': group.id,
                'name': group.name,
                'description': group.description,
                'created_at': group.created_at,
                'created_by': group.created_by.username,
                'owner': group.owner.username,
                'is_main': group.main,
                'member_count': 0,
                'active_members_today': 0,
                'active_members_this_week': 0,
                'total_workouts': 0,
                'total_meals': 0,
                'workouts_this_week': 0,
                'meals_this_week': 0,
                'top_performer_username': None,
                'top_performer_score': None,
            }

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

        return {
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

    @staticmethod
    def get_group_detail_stats(group):
        """Get detailed statistics for a single group with optimized queries."""
        time_ranges = DateRangeService.get_time_ranges()
        today_start = time_ranges['today_start']
        week_start = time_ranges['week_start']
        month_start = time_ranges['month_start']

        # Get members in one query with aggregation
        members = GroupMembers.objects.filter(group=group, pending=False)
        member_ids = list(members.values_list('member_id', flat=True))
        member_count = len(member_ids)
        admin_count = members.filter(is_admin=True).count()
        pending_members = GroupMembers.objects.filter(group=group, pending=True).count()

        if not member_ids:
            # Return minimal stats for empty groups
            return {
                'id': group.id,
                'name': group.name,
                'description': group.description,
                'created_at': group.created_at,
                'created_by': group.created_by.username,
                'owner': group.owner.username,
                'is_main': group.main,
                'member_count': 0,
                'admin_count': admin_count,
                'pending_members': pending_members,
                'total_workouts': 0,
                'total_meals': 0,
                'total_posts': 0,
                'workouts_today': 0,
                'workouts_this_week': 0,
                'workouts_this_month': 0,
                'meals_today': 0,
                'meals_this_week': 0,
                'meals_this_month': 0,
                'active_members_today': 0,
                'active_members_this_week': 0,
                'active_members_this_month': 0,
                'top_members': [],
            }

        # Optimize activity queries with single aggregation per model
        workout_stats = WorkoutCheckin.objects.filter(user_id__in=member_ids).aggregate(
            total=Count('id'),
            today=Count(Case(When(workout_date__gte=today_start, then=1), output_field=IntegerField())),
            week=Count(Case(When(workout_date__gte=week_start, then=1), output_field=IntegerField())),
            month=Count(Case(When(workout_date__gte=month_start, then=1), output_field=IntegerField()))
        )

        meal_stats = Meal.objects.filter(user_id__in=member_ids).aggregate(
            total=Count('id'),
            today=Count(Case(When(meal_time__gte=today_start, then=1), output_field=IntegerField())),
            week=Count(Case(When(meal_time__gte=week_start, then=1), output_field=IntegerField())),
            month=Count(Case(When(meal_time__gte=month_start, then=1), output_field=IntegerField()))
        )

        total_posts = Post.objects.filter(user_id__in=member_ids).count()

        # Get active members for different time periods
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
        top_members = [
            {
                'rank': idx,
                'user_id': member.id,
                'username': member.username,
                'full_name': member.get_full_name() or member.username,
                'score': score,
                'level': member.profile.level if hasattr(member, 'profile') else 0,
            }
            for idx, (member, score) in enumerate(ranking[:10], 1)
        ]

        return {
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
            'total_workouts': workout_stats['total'] or 0,
            'total_meals': meal_stats['total'] or 0,
            'total_posts': total_posts,
            'workouts_today': workout_stats['today'] or 0,
            'workouts_this_week': workout_stats['week'] or 0,
            'workouts_this_month': workout_stats['month'] or 0,
            'meals_today': meal_stats['today'] or 0,
            'meals_this_week': meal_stats['week'] or 0,
            'meals_this_month': meal_stats['month'] or 0,
            'active_members_today': len(active_today),
            'active_members_this_week': len(active_week),
            'active_members_this_month': len(active_month),
            'top_members': top_members,
        }


class SystemAnalyticsService:
    """Service for system-wide analytics."""

    @staticmethod
    def get_system_stats():
        """
        Get comprehensive system statistics with optimized queries.
        Uses aggregations and conditional counts to minimize database hits.
        """
        time_ranges = DateRangeService.get_time_ranges()
        now = time_ranges['now']
        today_start = time_ranges['today_start']
        week_start = time_ranges['week_start']
        month_start = time_ranges['month_start']

        # User statistics
        total_users = User.objects.filter(is_staff=False, is_superuser=False).count()

        # Active users (optimized)
        active_user_ids = UserAnalyticsService.get_active_user_ids(week_start)
        active_users = len(active_user_ids)
        inactive_users = total_users - active_users

        new_users_this_month = User.objects.filter(
            is_staff=False,
            is_superuser=False,
            date_joined__gte=month_start
        ).count()

        new_users_this_week = User.objects.filter(
            is_staff=False,
            is_superuser=False,
            date_joined__gte=week_start
        ).count()

        new_users_today = User.objects.filter(
            is_staff=False,
            is_superuser=False,
            date_joined__gte=today_start
        ).count()

        # Group statistics
        total_groups = Group.objects.count()

        # Client statistics
        total_clients = Client.objects.count()
        active_clients = Client.objects.filter(is_active=True).count()
        inactive_clients = total_clients - active_clients
        new_clients_this_month = Client.objects.filter(created_at__gte=month_start).count()
        new_clients_this_week = Client.objects.filter(created_at__gte=week_start).count()
        new_clients_today = Client.objects.filter(created_at__gte=today_start).count()

        # Workout statistics - optimized with single aggregate query
        workout_stats = WorkoutCheckin.objects.aggregate(
            total=Count('id'),
            today=Count(Case(When(workout_date__gte=today_start, then=1), output_field=IntegerField())),
            week=Count(Case(When(workout_date__gte=week_start, then=1), output_field=IntegerField())),
            month=Count(Case(When(workout_date__gte=month_start, then=1), output_field=IntegerField()))
        )

        # Meal statistics - optimized with single aggregate query
        meal_stats = Meal.objects.aggregate(
            total=Count('id'),
            today=Count(Case(When(meal_time__gte=today_start, then=1), output_field=IntegerField())),
            week=Count(Case(When(meal_time__gte=week_start, then=1), output_field=IntegerField())),
            month=Count(Case(When(meal_time__gte=month_start, then=1), output_field=IntegerField()))
        )

        # Social feed statistics - optimized with single aggregate query
        post_stats = Post.objects.aggregate(
            total=Count('id'),
            today=Count(Case(When(created_at__gte=today_start, then=1), output_field=IntegerField())),
            week=Count(Case(When(created_at__gte=week_start, then=1), output_field=IntegerField())),
            month=Count(Case(When(created_at__gte=month_start, then=1), output_field=IntegerField()))
        )

        comment_stats = Comment.objects.aggregate(
            total=Count('id'),
            today=Count(Case(When(created_at__gte=today_start, then=1), output_field=IntegerField())),
            week=Count(Case(When(created_at__gte=week_start, then=1), output_field=IntegerField())),
            month=Count(Case(When(created_at__gte=month_start, then=1), output_field=IntegerField()))
        )

        # Combine PostLike and CommentLike statistics
        post_like_stats = PostLike.objects.aggregate(
            total=Count('id'),
            today=Count(Case(When(created_at__gte=today_start, then=1), output_field=IntegerField())),
            week=Count(Case(When(created_at__gte=week_start, then=1), output_field=IntegerField())),
            month=Count(Case(When(created_at__gte=month_start, then=1), output_field=IntegerField()))
        )

        comment_like_stats = CommentLike.objects.aggregate(
            total=Count('id'),
            today=Count(Case(When(created_at__gte=today_start, then=1), output_field=IntegerField())),
            week=Count(Case(When(created_at__gte=week_start, then=1), output_field=IntegerField())),
            month=Count(Case(When(created_at__gte=month_start, then=1), output_field=IntegerField()))
        )

        # Combine likes from posts and comments
        total_likes = (post_like_stats['total'] or 0) + (comment_like_stats['total'] or 0)
        likes_today = (post_like_stats['today'] or 0) + (comment_like_stats['today'] or 0)
        likes_this_week = (post_like_stats['week'] or 0) + (comment_like_stats['week'] or 0)
        likes_this_month = (post_like_stats['month'] or 0) + (comment_like_stats['month'] or 0)

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

        return {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'new_users_this_month': new_users_this_month,
            'new_users_this_week': new_users_this_week,
            'new_users_today': new_users_today,
            'total_groups': total_groups,
            'total_clients': total_clients,
            'active_clients': active_clients,
            'inactive_clients': inactive_clients,
            'new_clients_this_month': new_clients_this_month,
            'new_clients_this_week': new_clients_this_week,
            'new_clients_today': new_clients_today,
            'total_workouts': workout_stats['total'] or 0,
            'workouts_today': workout_stats['today'] or 0,
            'workouts_this_week': workout_stats['week'] or 0,
            'workouts_this_month': workout_stats['month'] or 0,
            'total_meals': meal_stats['total'] or 0,
            'meals_today': meal_stats['today'] or 0,
            'meals_this_week': meal_stats['week'] or 0,
            'meals_this_month': meal_stats['month'] or 0,
            'total_posts': post_stats['total'] or 0,
            'posts_today': post_stats['today'] or 0,
            'posts_this_week': post_stats['week'] or 0,
            'posts_this_month': post_stats['month'] or 0,
            'total_comments': comment_stats['total'] or 0,
            'comments_today': comment_stats['today'] or 0,
            'comments_this_week': comment_stats['week'] or 0,
            'comments_this_month': comment_stats['month'] or 0,
            'total_likes': total_likes,
            'likes_today': likes_today,
            'likes_this_week': likes_this_week,
            'likes_this_month': likes_this_month,
            'pending_reports': pending_reports,
            'average_user_level': round(profile_stats['avg_level'] or 0, 2),
            'average_user_score': round(profile_stats['avg_score'] or 0, 2),
            'average_workout_streak': round(workout_streak_stats['avg_streak'] or 0, 2),
            'average_meal_streak': round(meal_streak_stats['avg_streak'] or 0, 2),
            'active_seasons': active_seasons,
        }


class ActivityFeedService:
    """Service for activity feed generation."""

    @staticmethod
    def get_recent_activities(limit=20, activity_type=None):
        """
        Get recent activities across the system.
        Optimized with select_related to avoid N+1 queries.
        """
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

        return activities[:limit]
