"""
Models for the notifications app.

Defines Notification, PushSubscription, and NotificationPreference models.
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import URLValidator
from django.utils import timezone


class Notification(models.Model):
    """
    In-app notification model.
    
    Stores notifications for users with metadata for different notification types.
    """
    
    TYPE_CHOICES = [
        ('social', 'Social Interaction'),
        ('group', 'Group Activity'),
        ('achievement', 'Achievement'),
        ('streak', 'Streak Milestone'),
        ('reminder', 'Reminder'),
        ('level_up', 'Level Up'),
        ('rank_change', 'Rank Change'),
    ]
    
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='User who will receive the notification'
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        help_text='Type of notification'
    )
    title = models.CharField(
        max_length=255,
        help_text='Notification title'
    )
    message = models.TextField(
        help_text='Notification message content'
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional data specific to notification type (post_id, user_id, etc.)'
    )
    read = models.BooleanField(
        default=False,
        help_text='Whether the notification has been read'
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the notification was marked as read'
    )
    sent_push = models.BooleanField(
        default=False,
        help_text='Whether a push notification was sent'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='When the notification was created'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'read', 'created_at']),
            models.Index(fields=['recipient', 'created_at']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
    
    def __str__(self):
        return f'{self.type} notification for {self.recipient.username}: {self.title}'
    
    def mark_as_read(self):
        """Mark this notification as read."""
        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            self.save(update_fields=['read', 'read_at'])


class PushSubscription(models.Model):
    """
    Web Push subscription model.
    
    Stores Push API subscription data for sending web push notifications to PWA.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
        help_text='User who owns this subscription'
    )
    endpoint = models.URLField(
        max_length=500,
        validators=[URLValidator()],
        help_text='Push service endpoint URL'
    )
    p256dh_key = models.CharField(
        max_length=255,
        help_text='P256DH key for encrypting push messages (base64 encoded)'
    )
    auth_key = models.CharField(
        max_length=255,
        help_text='Auth secret for encrypting push messages (base64 encoded)'
    )
    user_agent = models.TextField(
        blank=True,
        help_text='User agent string from the browser'
    )
    active = models.BooleanField(
        default=True,
        help_text='Whether this subscription is active'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='When the subscription was created'
    )
    last_used = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Last time a push was sent to this subscription'
    )
    
    class Meta:
        unique_together = ['user', 'endpoint']
        indexes = [
            models.Index(fields=['user', 'active']),
        ]
        verbose_name = 'Push Subscription'
        verbose_name_plural = 'Push Subscriptions'
    
    def __str__(self):
        return f'Push subscription for {self.user.username} ({self.endpoint[:50]}...)'


class NotificationPreference(models.Model):
    """
    User notification preferences.
    
    Controls which types of notifications a user wants to receive
    and when they should receive them.
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preference',
        help_text='User these preferences belong to'
    )
    enable_push = models.BooleanField(
        default=True,
        help_text='Enable push notifications'
    )
    enable_social = models.BooleanField(
        default=True,
        help_text='Enable social interaction notifications (likes, comments)'
    )
    enable_groups = models.BooleanField(
        default=True,
        help_text='Enable group notifications (invites, promotions)'
    )
    enable_achievements = models.BooleanField(
        default=True,
        help_text='Enable achievement notifications'
    )
    enable_reminders = models.BooleanField(
        default=True,
        help_text='Enable reminder notifications (workout, meal)'
    )
    enable_streaks = models.BooleanField(
        default=True,
        help_text='Enable streak milestone notifications'
    )
    enable_level_ups = models.BooleanField(
        default=True,
        help_text='Enable level up notifications'
    )
    quiet_hours_start = models.TimeField(
        null=True,
        blank=True,
        help_text='Start of quiet hours (no push notifications)'
    )
    quiet_hours_end = models.TimeField(
        null=True,
        blank=True,
        help_text='End of quiet hours (no push notifications)'
    )
    
    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f'Notification preferences for {self.user.username}'
    
    def is_notification_enabled(self, notification_type):
        """
        Check if a specific notification type is enabled.
        
        Args:
            notification_type: One of the Notification.TYPE_CHOICES values
        
        Returns:
            bool: True if enabled, False otherwise
        """
        type_mapping = {
            'social': self.enable_social,
            'group': self.enable_groups,
            'achievement': self.enable_achievements,
            'streak': self.enable_streaks,
            'reminder': self.enable_reminders,
            'level_up': self.enable_level_ups,
            'rank_change': True,  # Always enabled
        }
        return type_mapping.get(notification_type, True)
    
    def is_in_quiet_hours(self):
        """
        Check if current time is within quiet hours.
        
        Returns:
            bool: True if in quiet hours, False otherwise
        """
        if not self.quiet_hours_start or not self.quiet_hours_end:
            return False
        
        now = timezone.localtime().time()
        
        # Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if self.quiet_hours_start > self.quiet_hours_end:
            return now >= self.quiet_hours_start or now <= self.quiet_hours_end
        else:
            return self.quiet_hours_start <= now <= self.quiet_hours_end
