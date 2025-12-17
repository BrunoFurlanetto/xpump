from django.contrib.auth.models import User
from django.db.models import Q
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
from analytics.services import (
    DateRangeService,
    UserAnalyticsService,
    GroupAnalyticsService,
    SystemAnalyticsService,
    ActivityFeedService
)
from groups.models import Group


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
        stats = SystemAnalyticsService.get_system_stats()
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
        time_ranges = DateRangeService.get_time_ranges()
        week_ago = time_ranges['week_start']

        # Use optimized queryset from service
        queryset = UserAnalyticsService.get_user_queryset_with_stats()

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
            active_ids = UserAnalyticsService.get_active_user_ids(week_ago)

            if is_active:
                queryset = queryset.filter(id__in=active_ids)
            else:
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

        time_ranges = DateRangeService.get_time_ranges()
        week_ago = time_ranges['week_start']

        # Get users for processing
        users = page if page is not None else queryset
        user_ids = [user.id for user in users]

        # Batch fetch streaks to avoid N+1 queries
        workout_streaks, meal_streaks = UserAnalyticsService.get_streaks_for_users(user_ids)

        # Build user data using service
        users_data = [
            UserAnalyticsService.build_user_stats(user, workout_streaks, meal_streaks, week_ago)
            for user in users
        ]


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

        time_ranges = DateRangeService.get_time_ranges()
        today_start = time_ranges['today_start']
        week_start = time_ranges['week_start']

        groups = page if page is not None else queryset

        # Batch fetch member IDs for all groups to avoid N+1 queries
        member_ids_by_group = GroupAnalyticsService.get_group_member_ids_bulk(list(groups))

        # Batch fetch active members for all groups
        active_today_by_group = GroupAnalyticsService.get_active_members_by_groups(
            member_ids_by_group, today_start
        )
        active_week_by_group = GroupAnalyticsService.get_active_members_by_groups(
            member_ids_by_group, week_start
        )

        # Build group data using service
        groups_data = [
            GroupAnalyticsService.build_group_stats(
                group,
                member_ids_by_group.get(group.id, []),
                active_today_by_group.get(group.id, set()),
                active_week_by_group.get(group.id, set()),
                today_start,
                week_start
            )
            for group in groups
        ]

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

        activities = ActivityFeedService.get_recent_activities(limit, activity_type)
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

        user_data = UserAnalyticsService.get_user_detail_stats(user)
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

        group_data = GroupAnalyticsService.get_group_detail_stats(group)
        serializer = GroupDetailSerializer(group_data)

        return Response(serializer.data, status=status.HTTP_200_OK)

