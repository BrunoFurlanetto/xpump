from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.db import models

from nutrition.models import Meal
from profiles.models import Profile
from status.models import Status
from workouts.models import WorkoutCheckin


# ---------------------------------- Helper Functions ---------------------------------- #
def get_post_published_status_id():
    obj, _ = Status.objects.get_or_create(
        app_name='POST',
        action='PUBLISHED',
        is_active=True,
        defaults={'name': 'Publicado'}
    )

    return obj.id


def get_comment_published_status_id():
    obj, _ = Status.objects.get_or_create(
        app_name='COMMENT',
        action='PUBLISHED',
        is_active=True,
        defaults={'name': 'Publicado'}
    )

    return obj.id


# ------------------------------------- Models ------------------------------------- #
class Post(models.Model):
    """
    Model for social feed posts.
    Represents items in the social feed (workouts/meals/Social).
    """
    VISIBILITY_CHOICES = [
        ('global', 'Global'),
        ('group', 'Group'),
        ('private', 'Private'),
    ]

    CONTENT_TYPE_CHOICES = [
        ('workout', 'Workout'),
        ('meal', 'Meal'),
        ('social', 'Social'),
        ('achievement', 'Achievement'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    content_text = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='global')
    comments_count = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)
    allow_comments = models.BooleanField(default=True)
    status = models.ForeignKey(
        Status,
        on_delete=models.PROTECT,
        limit_choices_to={'is_active': True, 'app_name': 'POST'},
        default=get_post_published_status_id
    )
    # quality_score = models.FloatField(default=0.0)  TODO: To the Future

    workout_checkin = models.ForeignKey(
        WorkoutCheckin,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='posts'
    )
    meal = models.ForeignKey(
        Meal,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='posts'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['visibility', '-created_at']),
            models.Index(fields=['content_type', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.content_type} post - {self.created_at}"


class ContentFilePost(models.Model):
    """
    Model to handle multiple media files for a single post.
    """
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='content_files')
    file = models.FileField(
        upload_to='post_media/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'mp4', 'mov'])]
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['post', 'uploaded_at']),
        ]

    def __str__(self):
        return f"File for post {self.post.id} uploaded at {self.uploaded_at}"


class PostLike(models.Model):
    """
    Record user likes on posts.
    Use unique together to ensure only one like per (post, user).
    """
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')
        indexes = [
            models.Index(fields=['post', 'user']),
            models.Index(fields=['user', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} liked post {self.post_id} at {self.created_at}"


class Comment(models.Model):
    """
    Model for comments on posts.
    """
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.ForeignKey(
        Status,
        on_delete=models.PROTECT,
        limit_choices_to={'is_active': True, 'app_name': 'COMMENT'},
        default=get_comment_published_status_id
    )

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} comment on {self.post.id} - {self.created_at}"


class CommentLike(models.Model):
    """
    Record user likes on comments.
    Use unique together to ensure only one like per (comment, user).
    """
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('comment', 'user')
        indexes = [
            models.Index(fields=['comment', 'user']),
            models.Index(fields=['user', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} liked comment {self.comment_id} at {self.created_at}"


class Report(models.Model):
    """
    Model for moderation system.
    Allows users to report inappropriate posts.
    """
    REPORT_TYPE_CHOICES = [
        ('post', 'Post'),
        ('comment', 'Comentário'),
    ]

    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('inappropriate', 'Conteúdo Inapropriado'),
        ('harassment', 'Assédio'),
        ('fake', 'Informação Falsa'),
        ('other', 'Outro'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('reviewed', 'Sob revisão'),
        ('resolved', 'Resolvido'),
        ('dismissed', 'Descartado'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    report_type = models.CharField(max_length=10, choices=REPORT_TYPE_CHOICES)
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    other_reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    response = models.TextField(blank=True, null=True)
    # resolved_by = models.ForeignKey(
    #     User,
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='resolved_reports'
    # )  TODO: Study viability for te future

    class Meta:
        ordering = ['-created_at']
        unique_together = ['post', 'reported_by']  # Prevent duplicate reports from same user
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['post', '-created_at']),
            models.Index(fields=['reported_by', '-created_at']),
        ]

    def __str__(self):
        if self.report_type == 'comment':
            return f"Report by {self.reported_by.username} on comment {self.comment.id} - {self.status}"

        return f"Report by {self.reported_by.username} on post {self.post.id} - {self.status}"
