from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from .models import Post, Comment, Report, PostLike, CommentLike
from .serializers import (
    PostSerializer, PostListSerializer, PostCreateSerializer, CommentSerializer,
    ReportSerializer, ReportCreateSerializer, CommentCreateSerializer
)
from .pagination import PostsPagination, CommentsPagination


@extend_schema(tags=['Social Feed'])
class PostViewSet(ModelViewSet):
    """ViewSet for managing posts in the social feed."""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = PostsPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        if self.action == 'create':
            return PostCreateSerializer

        return PostSerializer

    def get_queryset(self):
        """Filter posts based on visibility and user permissions."""
        user = self.request.user

        if not user.is_authenticated:
            raise PermissionDenied('User not authenticated!')

        queryset = Post.objects.select_related(
            'user__profile', 'workout_checkin', 'meal'
        ).prefetch_related(
            'comments__user', 'likes__user', 'content_files'
        )

        # Superusers can see all posts without employer filtering
        if user.is_superuser:
            # Filter by visibility (optional for superusers)
            visibility_filter = self.request.query_params.get('visibility', None)
            if visibility_filter:
                queryset = queryset.filter(visibility=visibility_filter)

            # Filter by content type
            content_type = self.request.query_params.get('content_type', None)
            if content_type:
                queryset = queryset.filter(content_type=content_type)

            # Filter by user
            user_id = self.request.query_params.get('user_id', None)
            if user_id:
                queryset = queryset.filter(user_id=user_id)

            return queryset.order_by('-created_at')

        # Regular users need employer validation
        employer = getattr(getattr(user, 'profile', None), 'employer', None)

        if employer is None:
            raise ValidationError('User has no associated employer!')

        # Filter by visibility
        visibility_filter = self.request.query_params.get('visibility', None)

        if visibility_filter:
            queryset = queryset.filter(visibility=visibility_filter, user__profile__employer=employer)
        else:
            # Default: show global posts and user's own posts
            queryset = queryset.filter(
                Q(visibility='global') | Q(user__profile__employer=employer)
            )

        # Filter by content type
        content_type = self.request.query_params.get('content_type', None)

        if content_type:
            queryset = queryset.filter(content_type=content_type)

        # Filter by user
        user_id = self.request.query_params.get('user_id', None)

        if user_id:
            queryset = queryset.filter(user_id=user_id)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a post."""
        post = self.get_object()
        serializer = CommentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user, post=post)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get all comments for a post."""
        post = self.get_object()
        comments = post.comments.select_related('user').order_by('created_at')

        # Aplicar paginação
        paginator = CommentsPagination()
        page = paginator.paginate_queryset(comments, request)

        if page is not None:
            serializer = CommentSerializer(page, many=True, context={'request': request})

            return paginator.get_paginated_response(serializer.data)

        serializer = CommentSerializer(comments, many=True, context={'request': request})

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_like(self, request, pk=None):
        """Like or unlike a post."""
        post = self.get_object()
        # user_profile = request.user.profile

        # Check if the like already exists
        like = PostLike.objects.filter(post=post, user=self.request.user).first()

        if like:
            # Unlike the post
            like.delete()
            liked = False
        else:
            # Like the post
            PostLike.objects.create(post=post, user=self.request.user)
            liked = True

        return Response({'liked': liked, 'post_id': post.id})


@extend_schema(tags=['Social Feed'])
class CommentListCreateView(generics.ListCreateAPIView):
    """List all comments or create a new comment."""
    serializer_class = CommentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CommentsPagination

    def get_queryset(self):
        """Filter comments based on user permissions."""
        return Comment.objects.select_related(
            'user', 'post'
        ).prefetch_related('likes__user').order_by('-created_at')

    def perform_create(self, serializer):
        """Set the user when creating a comment."""
        serializer.save(user=self.request.user)


@extend_schema(tags=['Social Feed'])
class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a comment."""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter comments based on user permissions."""
        return Comment.objects.select_related(
            'user', 'post'
        ).prefetch_related('likes__user').order_by('-created_at')

    def perform_destroy(self, instance):
        """Only allow users to delete their own comments."""
        if instance.user != self.request.user:
            raise PermissionDenied("You can only delete your own comments.")

        super().perform_destroy(instance)

    def perform_update(self, serializer):
        """Only allow users to update their own comments."""
        if serializer.instance.user != self.request.user:
            raise PermissionDenied("You can only update your own comments.")

        serializer.save()


@extend_schema(tags=['Social Feed'])
class CommentToggleLikeView(generics.GenericAPIView):
    """Toggle like on a comment."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        """Like or unlike a comment."""
        try:
            comment = Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return Response(
                {'error': 'Comment not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if the like already exists
        like = CommentLike.objects.filter(comment=comment, user=self.request.user).first()

        if like:
            # Unlike the comment
            like.delete()
            liked = False
        else:
            # Like the comment
            CommentLike.objects.create(comment=comment, user=self.request.user)
            liked = True

        return Response({
            'liked': liked,
            'comment_id': comment.id,
            'likes_count': comment.likes_count
        })


@extend_schema(tags=['Social Feed'])
class ReportListCreateView(generics.ListCreateAPIView):
    """List all reports or create a new report."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReportCreateSerializer

        return ReportSerializer

    def get_queryset(self):
        """Users can only see their own reports."""
        return Report.objects.filter(
            reported_by=self.request.user
        ).select_related('post__user', 'reported_by__user')

    def perform_create(self, serializer):
        """Create a report with the current user as reporter."""
        serializer.save(reported_by=self.request.user)


@extend_schema(tags=['Social Feed'])
class ReportDetailView(generics.RetrieveAPIView):
    """Retrieve a report detail."""
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Users can only see their own reports."""
        return Report.objects.filter(
            reported_by=self.request.user
        ).select_related('post__user', 'reported_by__user')


@extend_schema(tags=['Social Feed'])
class UserPostsView(generics.ListAPIView):
    """Get all posts from a specific user."""
    serializer_class = PostListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = PostsPagination

    def get_queryset(self):
        """Get posts from a specific user."""
        user_id = self.kwargs.get('user_id')

        return Post.objects.filter(
            user_id=user_id
        ).select_related('user').order_by('-created_at')


# class UserFeedView(generics.ListAPIView):
#     """Get personalized feed for a user."""
#     serializer_class = PostListSerializer
#     permission_classes = [permissions.IsAuthenticated]
#
#     def get_queryset(self):
#         """Get personalized feed based on user's groups and followed users."""
#         user_profile = self.request.user.profile
#
#         # For now, return global posts and user's own posts
#         # TODO: Implement group-based filtering when groups are integrated
#         queryset = Post.objects.filter(
#             Q(visibility='global') | Q(user=user_profile)
#         ).select_related('user__user').order_by('-created_at')
#
#         return queryset[:50]  # Limit to 50 most recent posts
