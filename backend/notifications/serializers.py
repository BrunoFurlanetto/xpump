"""
Serializers for the notifications app.

Includes detailed documentation for API schema generation.
"""
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample
from .models import Notification, PushSubscription, NotificationPreference


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Social - Like notification',
            value={
                'id': 1,
                'type': 'social',
                'title': 'Nova curtida no seu post',
                'message': 'João curtiu seu post de treino',
                'metadata': {
                    'post_id': 123,
                    'liker_id': 45,
                    'liker_name': 'João Silva'
                },
                'read': False,
                'created_at': '2026-02-10T14:30:00Z'
            },
            response_only=True,
        ),
        OpenApiExample(
            'Group - Invite notification',
            value={
                'id': 2,
                'type': 'group',
                'title': 'Convite para grupo',
                'message': 'Maria convidou você para o grupo "Treino Pesado"',
                'metadata': {
                    'group_id': 78,
                    'group_name': 'Treino Pesado',
                    'inviter_id': 23,
                    'inviter_name': 'Maria Santos'
                },
                'read': False,
                'created_at': '2026-02-10T15:00:00Z'
            },
            response_only=True,
        ),
        OpenApiExample(
            'Streak milestone notification',
            value={
                'id': 3,
                'type': 'streak',
                'title': 'Marco de 7 dias!',
                'message': 'Parabéns! Você completou 7 dias consecutivos de treino',
                'metadata': {
                    'streak_days': 7,
                    'streak_type': 'workout'
                },
                'read': False,
                'created_at': '2026-02-10T16:00:00Z'
            },
            response_only=True,
        ),
        OpenApiExample(
            'Level up notification',
            value={
                'id': 4,
                'type': 'level_up',
                'title': 'Novo nível!',
                'message': 'Você subiu para o nível 12!',
                'metadata': {
                    'new_level': 12,
                    'points_earned': 150
                },
                'read': False,
                'created_at': '2026-02-10T17:00:00Z'
            },
            response_only=True,
        ),
    ]
)
class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model.
    
    Read-only serializer for listing and retrieving notifications.
    """
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'metadata',
            'read', 'read_at', 'sent_push', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at', 'sent_push']


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Web Push Subscription',
            value={
                'endpoint': 'https://fcm.googleapis.com/fcm/send/abc123...',
                'p256dh_key': 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQ...',
                'auth_key': 'tBHItJI5svbpez7KI4CCXg==',
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...'
            },
            request_only=True,
        ),
    ]
)
class PushSubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for PushSubscription model.
    
    Used to register and manage Web Push subscriptions from PWA.
    The subscription data comes from the browser's Push API (PushManager.subscribe).
    """
    
    class Meta:
        model = PushSubscription
        fields = [
            'id', 'endpoint', 'p256dh_key', 'auth_key',
            'user_agent', 'active', 'created_at', 'last_used'
        ]
        read_only_fields = ['id', 'created_at', 'last_used', 'active']
        extra_kwargs = {
            'endpoint': {
                'help_text': 'Push service endpoint URL from subscription.endpoint'
            },
            'p256dh_key': {
                'help_text': 'P256DH key from subscription.keys.p256dh (base64 encoded)'
            },
            'auth_key': {
                'help_text': 'Auth secret from subscription.keys.auth (base64 encoded)'
            },
            'user_agent': {
                'help_text': 'Browser user agent string',
                'required': False
            },
        }
    
    def validate_endpoint(self, value):
        """Validate endpoint URL format."""
        if not value.startswith('https://'):
            raise serializers.ValidationError(
                'Endpoint must be a valid HTTPS URL'
            )
        return value
    
    def create(self, validated_data):
        """
        Create or update subscription.
        
        Deactivate old subscriptions for the same user before creating new one.
        """
        user = self.context['request'].user
        
        # Deactivate old subscriptions with the same endpoint
        PushSubscription.objects.filter(
            user=user,
            endpoint=validated_data['endpoint']
        ).update(active=False)
        
        # Create new subscription
        validated_data['user'] = user
        return super().create(validated_data)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for NotificationPreference model.
    
    Manages user's notification preferences and quiet hours.
    """
    
    class Meta:
        model = NotificationPreference
        fields = [
            'enable_push', 'enable_social', 'enable_groups',
            'enable_achievements', 'enable_reminders', 'enable_streaks',
            'enable_level_ups', 'quiet_hours_start', 'quiet_hours_end'
        ]
        extra_kwargs = {
            'quiet_hours_start': {
                'help_text': 'Start time for quiet hours (HH:MM format, e.g., "22:00")'
            },
            'quiet_hours_end': {
                'help_text': 'End time for quiet hours (HH:MM format, e.g., "08:00")'
            },
        }
    
    def validate(self, attrs):
        """Validate quiet hours logic."""
        start = attrs.get('quiet_hours_start') or self.instance.quiet_hours_start if self.instance else None
        end = attrs.get('quiet_hours_end') or self.instance.quiet_hours_end if self.instance else None
        
        # Both must be set or both must be None
        if (start is not None and end is None) or (start is None and end is not None):
            raise serializers.ValidationError(
                'Both quiet_hours_start and quiet_hours_end must be set together'
            )
        
        return attrs


class MarkAsReadSerializer(serializers.Serializer):
    """
    Serializer for marking notifications as read.
    
    Accepts a list of notification IDs to mark as read.
    """
    
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text='List of notification IDs to mark as read',
        allow_empty=False
    )


class UnreadCountSerializer(serializers.Serializer):
    """
    Serializer for unread notification count response.
    """
    
    count = serializers.IntegerField(
        read_only=True,
        help_text='Number of unread notifications'
    )


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'VAPID Public Key Response',
            value={
                'public_key': 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQJo4-BaL'
            },
            response_only=True,
        ),
    ]
)
class VapidPublicKeySerializer(serializers.Serializer):
    """
    Serializer for VAPID public key response.
    
    Returns the application's VAPID public key needed for Web Push subscriptions.
    """
    
    public_key = serializers.CharField(
        read_only=True,
        help_text='VAPID public key for applicationServerKey in service worker'
    )
