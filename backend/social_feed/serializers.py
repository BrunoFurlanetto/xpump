from rest_framework import serializers
from .models import Post, Comment, Report, PostLike, CommentLike
from profiles.serializers import ProfilesSerialializer
from workouts.serializer import WorkoutCheckinSerializer
from nutrition.serializer import MealSerializer


class PostLikeSerializer(serializers.ModelSerializer):
    user = ProfilesSerialializer(read_only=True)

    class Meta:
        model = PostLike
        fields = ['id', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']


class CommentLikeSerializer(serializers.ModelSerializer):
    user = ProfilesSerialializer(read_only=True)

    class Meta:
        model = CommentLike
        fields = ['id', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    user = ProfilesSerialializer(read_only=True)
    likes = CommentLikeSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'user', 'text', 'created_at', 'likes', 'likes_count', 'is_liked_by_user']
        read_only_fields = ['id', 'created_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')

        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()

        return False


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['post', 'text']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user

        return super().create(validated_data)


class PostSerializer(serializers.ModelSerializer):
    user = ProfilesSerialializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    likes = PostLikeSerializer(many=True, read_only=True)
    workout_checkin = WorkoutCheckinSerializer(read_only=True)
    meal = MealSerializer(read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'content_type', 'content', 'workout_checkin', 'meal',
            'comments_count', 'likes_count', 'created_at', 'visibility',
            'allow_comments', 'comments', 'likes', 'is_liked_by_user'
        ]
        read_only_fields = ['id', 'created_at', 'comments_count', 'likes_count']

    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')

        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()

        return False


class PostListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views without comments"""
    user = ProfilesSerialializer(read_only=True)
    workout_checkin = WorkoutCheckinSerializer(read_only=True)
    meal = MealSerializer(read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'content_type', 'content', 'workout_checkin', 'meal',
            'comments_count', 'likes_count', 'created_at', 'visibility',
            'allow_comments', 'is_liked_by_user'
        ]
        read_only_fields = ['id', 'created_at', 'comments_count', 'likes_count']

    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')

        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()

        return False


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts"""
    class Meta:
        model = Post
        fields = [
            'content_type', 'content', 'workout_checkin', 'meal',
            'visibility', 'allow_comments'
        ]

    def validate(self, data):
        content_type = data.get('content_type')
        workout_checkin = data.get('workout_checkin')
        meal = data.get('meal')
        content = data.get('content')

        if content_type == 'workout' and not workout_checkin:
            raise serializers.ValidationError("workout_checkin is required for workout posts")
        if content_type == 'meal' and not meal:
            raise serializers.ValidationError("meal is required for meal posts")
        if content_type == 'social' and not content:
            raise serializers.ValidationError("content is required for social posts")

        # Ensure only one content type is set
        if content_type == 'workout' and (meal or content):
            raise serializers.ValidationError("Only workout_checkin should be set for workout posts")
        if content_type == 'meal' and (workout_checkin or content):
            raise serializers.ValidationError("Only meal should be set for meal posts")
        if content_type == 'social' and (workout_checkin or meal):
            raise serializers.ValidationError("Only content should be set for social posts")

        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user

        return super().create(validated_data)


class ReportSerializer(serializers.ModelSerializer):
    reported_by = ProfilesSerialializer(read_only=True)
    post = PostListSerializer(read_only=True)
    comment = CommentSerializer(read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'report_type', 'post', 'comment', 'reported_by', 'reason',
            'other_reason', 'status', 'created_at', 'resolved_at', 'notes', 'response'
        ]
        read_only_fields = [
            'id', 'created_at', 'resolved_at', 'status', 'notes', 'response'
        ]


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['report_type', 'post', 'comment', 'reason', 'other_reason']

    def validate(self, data):
        report_type = data.get('report_type')
        post = data.get('post')
        comment = data.get('comment')

        if report_type == 'post' and not post:
            raise serializers.ValidationError("post is required for post reports")
        if report_type == 'comment' and not comment:
            raise serializers.ValidationError("comment is required for comment reports")

        # Ensure only one content type is set
        if report_type == 'post' and comment:
            raise serializers.ValidationError("Only post should be set for post reports")
        if report_type == 'comment' and post:
            raise serializers.ValidationError("Only comment should be set for comment reports")

        return data

    def create(self, validated_data):
        validated_data['reported_by'] = self.context['request'].user

        return super().create(validated_data)
