from rest_framework import serializers

from .models import Notification, PushSubscription


class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ['id', 'endpoint', 'p256dh', 'auth', 'user_agent', 'created_at']
        read_only_fields = ['id', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(
        source='get_notification_type_display', read_only=True
    )

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'notification_type_display',
            'title',
            'body',
            'data',
            'is_read',
            'created_at',
        ]
        read_only_fields = fields


class BroadcastSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    body = serializers.CharField()
    data = serializers.JSONField(required=False, default=dict)
