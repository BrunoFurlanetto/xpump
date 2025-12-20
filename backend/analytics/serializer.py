from rest_framework import serializers


class SystemStatsSerializer(serializers.Serializer):
    """Serializer for overall system statistics"""
    # User statistics
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    inactive_users = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
    new_users_this_week = serializers.IntegerField()
    new_users_today = serializers.IntegerField()

    # Group statistics
    total_groups = serializers.IntegerField()

    # Client statistics
    total_clients = serializers.IntegerField()
    active_clients = serializers.IntegerField()
    inactive_clients = serializers.IntegerField()
    new_clients_this_month = serializers.IntegerField()
    new_clients_this_week = serializers.IntegerField()
    new_clients_today = serializers.IntegerField()

    # Workout statistics
    total_workouts = serializers.IntegerField()
    workouts_today = serializers.IntegerField()
    workouts_this_week = serializers.IntegerField()
    workouts_this_month = serializers.IntegerField()

    # Meal statistics
    total_meals = serializers.IntegerField()
    meals_today = serializers.IntegerField()
    meals_this_week = serializers.IntegerField()
    meals_this_month = serializers.IntegerField()

    # Social feed statistics
    total_posts = serializers.IntegerField()
    posts_today = serializers.IntegerField()
    posts_this_week = serializers.IntegerField()
    posts_this_month = serializers.IntegerField()

    total_comments = serializers.IntegerField()
    comments_today = serializers.IntegerField()
    comments_this_week = serializers.IntegerField()
    comments_this_month = serializers.IntegerField()

    total_likes = serializers.IntegerField()
    likes_today = serializers.IntegerField()
    likes_this_week = serializers.IntegerField()
    likes_this_month = serializers.IntegerField()

    # Moderation statistics
    pending_reports = serializers.IntegerField()

    # Gamification statistics
    average_user_level = serializers.FloatField()
    average_user_score = serializers.FloatField()
    average_workout_streak = serializers.FloatField()
    average_meal_streak = serializers.FloatField()

    # Season statistics
    active_seasons = serializers.IntegerField()


class UserStatsSerializer(serializers.Serializer):
    """Serializer for individual user statistics"""
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    date_joined = serializers.DateTimeField()

    # Profile info
    profile_score = serializers.FloatField()
    profile_level = serializers.IntegerField()

    # Activity counts
    workout_count = serializers.IntegerField()
    meal_count = serializers.IntegerField()
    post_count = serializers.IntegerField()

    # Streaks
    current_workout_streak = serializers.IntegerField()
    longest_workout_streak = serializers.IntegerField()
    current_meal_streak = serializers.IntegerField()
    longest_meal_streak = serializers.IntegerField()

    # Last activity
    last_activity = serializers.DateTimeField(allow_null=True)
    is_active = serializers.BooleanField()

    # Group memberships
    group_count = serializers.IntegerField()


class GroupStatsSerializer(serializers.Serializer):
    """Serializer for group statistics"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField()
    created_at = serializers.DateTimeField()
    created_by = serializers.CharField()
    owner = serializers.CharField()
    is_main = serializers.BooleanField()

    # Member statistics
    member_count = serializers.IntegerField()
    active_members_today = serializers.IntegerField()
    active_members_this_week = serializers.IntegerField()

    # Activity statistics
    total_workouts = serializers.IntegerField()
    total_meals = serializers.IntegerField()
    workouts_this_week = serializers.IntegerField()
    meals_this_week = serializers.IntegerField()

    # Top performer
    top_performer_username = serializers.CharField(allow_null=True)
    top_performer_score = serializers.FloatField(allow_null=True)


class ActivitySerializer(serializers.Serializer):
    """Serializer for recent activities"""
    id = serializers.IntegerField()
    type = serializers.CharField()
    user_id = serializers.IntegerField()
    user_name = serializers.CharField()
    description = serializers.CharField()
    timestamp = serializers.DateTimeField()
    related_id = serializers.IntegerField(allow_null=True)

    # Optional details based on type
    details = serializers.JSONField(required=False, allow_null=True)


class UserDetailSerializer(serializers.Serializer):
    """Detailed serializer for a specific user"""
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    date_joined = serializers.DateTimeField()

    # Profile information
    profile_score = serializers.FloatField()
    profile_level = serializers.IntegerField()
    height = serializers.IntegerField(allow_null=True)
    weight = serializers.IntegerField(allow_null=True)

    # Activity counts
    workout_count = serializers.IntegerField()
    meal_count = serializers.IntegerField()
    post_count = serializers.IntegerField()
    comment_count = serializers.IntegerField()

    # Streaks
    current_workout_streak = serializers.IntegerField()
    longest_workout_streak = serializers.IntegerField()
    current_meal_streak = serializers.IntegerField()
    longest_meal_streak = serializers.IntegerField()
    workout_frequency = serializers.IntegerField()

    # Last activity
    last_workout = serializers.DateTimeField(allow_null=True)
    last_meal = serializers.DateTimeField(allow_null=True)
    last_post = serializers.DateTimeField(allow_null=True)
    last_activity = serializers.DateTimeField(allow_null=True)
    is_active = serializers.BooleanField()

    # Groups
    groups = serializers.ListField(child=serializers.DictField())

    # Client/Employer info
    employer_name = serializers.CharField(allow_null=True)


class GroupDetailSerializer(serializers.Serializer):
    """Detailed serializer for a specific group"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField()
    created_at = serializers.DateTimeField()
    created_by = serializers.CharField()
    owner = serializers.CharField()
    is_main = serializers.BooleanField()

    # Member statistics
    member_count = serializers.IntegerField()
    admin_count = serializers.IntegerField()
    pending_members = serializers.IntegerField()

    # Activity statistics
    total_workouts = serializers.IntegerField()
    total_meals = serializers.IntegerField()
    total_posts = serializers.IntegerField()
    workouts_today = serializers.IntegerField()
    workouts_this_week = serializers.IntegerField()
    workouts_this_month = serializers.IntegerField()
    meals_today = serializers.IntegerField()
    meals_this_week = serializers.IntegerField()
    meals_this_month = serializers.IntegerField()

    # Member activity
    active_members_today = serializers.IntegerField()
    active_members_this_week = serializers.IntegerField()
    active_members_this_month = serializers.IntegerField()

    # Rankings
    top_members = serializers.ListField(child=serializers.DictField())

