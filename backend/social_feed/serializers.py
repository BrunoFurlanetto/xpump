from rest_framework import serializers

from authentication.serializer import UserSimpleSerializer
from .models import Post, Comment, Report, PostLike, CommentLike, ContentFilePost
from workouts.serializer import WorkoutCheckinSerializer
from nutrition.serializer import MealSerializer


class ContentFilePostSerializer(serializers.ModelSerializer):
    """Serializer for post media files"""
    class Meta:
        model = ContentFilePost
        fields = ['id', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class PostLikeSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer(read_only=True)

    class Meta:
        model = PostLike
        fields = ['id', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']


class CommentLikeSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer(read_only=True)

    class Meta:
        model = CommentLike
        fields = ['id', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer(read_only=True)
    likes = CommentLikeSerializer(many=True, read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'user', 'text', 'created_at', 'likes', 'likes_count', 'is_liked_by_user']
        read_only_fields = ['id', 'created_at', 'likes_count']

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
    user = UserSimpleSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    likes = PostLikeSerializer(many=True, read_only=True)
    workout_checkin = WorkoutCheckinSerializer(read_only=True)
    meal = MealSerializer(read_only=True)
    content_files = ContentFilePostSerializer(many=True, read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    is_superuser_post = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'content_type', 'content_text', 'content_files', 'workout_checkin', 'meal',
            'comments_count', 'likes_count', 'created_at', 'visibility',
            'allow_comments', 'comments', 'likes', 'is_liked_by_user', 'is_superuser_post'
        ]
        read_only_fields = ['id', 'created_at', 'comments_count', 'likes_count', 'is_superuser_post']

    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')

        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()

        return False

    def get_is_superuser_post(self, obj):
        # Safely check if the post's author is a superuser. If user is missing, return False.
        author = getattr(obj, 'user', None)
        return bool(getattr(author, 'is_superuser', False))


class PostListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views without comments"""
    user = UserSimpleSerializer(read_only=True)
    workout_checkin = WorkoutCheckinSerializer(read_only=True)
    meal = MealSerializer(read_only=True)
    content_files = ContentFilePostSerializer(many=True, read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    is_superuser_post = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'content_type', 'content_text', 'content_files', 'workout_checkin', 'meal',
            'comments_count', 'likes_count', 'created_at', 'visibility',
            'allow_comments', 'is_liked_by_user', 'is_superuser_post'
        ]
        read_only_fields = ['id', 'created_at', 'comments_count', 'likes_count', 'is_superuser_post']

    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')

        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()

        return False

    def get_is_superuser_post(self, obj):
        author = getattr(obj, 'user', None)
        return bool(getattr(author, 'is_superuser', False))


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts"""
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        allow_empty=True
    )

    class Meta:
        model = Post
        fields = [
            'content_type', 'content_text', 'files', 'workout_checkin', 'meal',
            'visibility', 'allow_comments'
        ]

    def validate(self, data):
        content_type = data.get('content_type')
        workout_checkin = data.get('workout_checkin')
        meal = data.get('meal')
        content_text = data.get('content_text')
        files = data.get('files', [])

        if content_type == 'workout' and not workout_checkin:
            raise serializers.ValidationError("workout_checkin is required for workout posts")
        if content_type == 'meal' and not meal:
            raise serializers.ValidationError("meal is required for meal posts")
        if content_type == 'social' and not content_text and not files:
            raise serializers.ValidationError("content_text or files is required for social posts")

        # Ensure only one content type is set
        if content_type == 'workout' and (meal or content_text or files):
            raise serializers.ValidationError("Only workout_checkin should be set for workout posts")
        if content_type == 'meal' and (workout_checkin or content_text or files):
            raise serializers.ValidationError("Only meal should be set for meal posts")
        if content_type == 'social' and (workout_checkin or meal):
            raise serializers.ValidationError("workout_checkin and meal should not be set for social posts")

        return data

    def create(self, validated_data):
        files = validated_data.pop('files', [])
        validated_data['user'] = self.context['request'].user

        post = super().create(validated_data)

        # Create ContentFilePost instances for each uploaded file
        for file in files:
            ContentFilePost.objects.create(post=post, file=file)

        return post


class PostUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para PATCH de posts.
    - add_files: novos arquivos a incluir no post
    - remove_file_ids: IDs de ContentFilePost a remover
    """
    add_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )
    remove_file_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True,
        help_text='IDs de ContentFilePost a remover',
    )
    content_files = ContentFilePostSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            'content_text', 'visibility', 'allow_comments',
            'add_files', 'remove_file_ids', 'content_files',
        ]

    def validate(self, data):
        instance = self.instance
        remove_ids = data.get('remove_file_ids', [])

        if remove_ids:
            existing_ids = set(
                instance.content_files.filter(id__in=remove_ids).values_list('id', flat=True)
            )
            invalid = set(remove_ids) - existing_ids
            if invalid:
                raise serializers.ValidationError(
                    {'remove_file_ids': f'IDs n\u00e3o encontrados neste post: {list(invalid)}'}
                )

        # Posts do tipo social precisam de ao menos texto ou arquivo ap\u00f3s a edi\u00e7\u00e3o
        if instance.content_type == 'social':
            new_text = data.get('content_text', instance.content_text)
            remaining_files = instance.content_files.exclude(id__in=remove_ids).count()
            new_files = len(data.get('add_files', []))
            if not new_text and (remaining_files + new_files) == 0:
                raise serializers.ValidationError(
                    'Posts sociais precisam de texto ou ao menos uma imagem.'
                )

        return data

    def update(self, instance, validated_data):
        add_files = validated_data.pop('add_files', [])
        remove_ids = validated_data.pop('remove_file_ids', [])

        # Atualiza campos simples
        instance = super().update(instance, validated_data)

        # Remove arquivos solicitados (verifica que pertencem ao post)
        if remove_ids:
            ContentFilePost.objects.filter(id__in=remove_ids, post=instance).delete()

        # Adiciona novos arquivos
        for f in add_files:
            ContentFilePost.objects.create(post=instance, file=f)

        return instance


class ReportSerializer(serializers.ModelSerializer):
    # reported_by = ProfilesSerialializer(read_only=True)
    # post = PostListSerializer(read_only=True)
    # comment = CommentSerializer(read_only=True)

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
