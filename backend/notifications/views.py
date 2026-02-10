"""
Views for notifications app.

Provides REST API endpoints for managing notifications.
"""
from django.conf import settings
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse

from .models import Notification, PushSubscription, NotificationPreference
from .serializers import (
    NotificationSerializer, PushSubscriptionSerializer,
    NotificationPreferenceSerializer, MarkAsReadSerializer,
    UnreadCountSerializer, VapidPublicKeySerializer
)
from .permissions import IsNotificationRecipient, IsSubscriptionOwner
from .pagination import NotificationPagination
from .services import NotificationService


@extend_schema_view(
    list=extend_schema(
        summary='List user notifications',
        description='Get paginated list of all notifications for the authenticated user, ordered by creation date (newest first).',
        parameters=[
            OpenApiParameter(
                name='page',
                type=int,
                description='Page number for pagination'
            ),
            OpenApiParameter(
                name='page_size',
                type=int,
                description='Number of notifications per page (max 100)'
            ),
        ],
        responses={200: NotificationSerializer(many=True)},
        tags=['Notifications']
    ),
    retrieve=extend_schema(
        summary='Get notification details',
        description='Retrieve a specific notification by ID. Automatically marks it as read when accessed.',
        responses={200: NotificationSerializer},
        tags=['Notifications']
    ),
)
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing and retrieving notifications.
    
    Endpoints:
    - GET /api/v1/notifications/ - List all notifications
    - GET /api/v1/notifications/{id}/ - Get specific notification
    - POST /api/v1/notifications/mark_as_read/ - Mark notifications as read
    - POST /api/v1/notifications/mark_all_as_read/ - Mark all as read
    - GET /api/v1/notifications/unread_count/ - Get unread count
    """
    
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsNotificationRecipient]
    pagination_class = NotificationPagination
    
    def get_queryset(self):
        """Return notifications for the current user only."""
        return Notification.objects.filter(recipient=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve notification and mark as read.
        
        Automatically marks the notification as read when accessed.
        """
        instance = self.get_object()
        
        # Mark as read if not already
        if not instance.read:
            instance.mark_as_read()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @extend_schema(
        summary='Mark notifications as read',
        description='Mark one or more specific notifications as read by providing their IDs.',
        request=MarkAsReadSerializer,
        responses={
            200: OpenApiResponse(
                description='Notifications marked as read',
                response={'type': 'object', 'properties': {'marked': {'type': 'integer'}}}
            )
        },
        tags=['Notifications']
    )
    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """Mark specific notifications as read."""
        serializer = MarkAsReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data['notification_ids']
        
        # Mark notifications as read
        count = NotificationService.mark_as_read(notification_ids, request.user)
        
        return Response({'marked': count}, status=status.HTTP_200_OK)
    
    @extend_schema(
        summary='Mark all notifications as read',
        description='Mark all notifications for the authenticated user as read.',
        request=None,
        responses={
            200: OpenApiResponse(
                description='All notifications marked as read',
                response={'type': 'object', 'properties': {'marked': {'type': 'integer'}}}
            )
        },
        tags=['Notifications']
    )
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read for current user."""
        count = NotificationService.mark_all_as_read(request.user)
        
        return Response({'marked': count}, status=status.HTTP_200_OK)
    
    @extend_schema(
        summary='Get unread notification count',
        description='Get the total number of unread notifications for the authenticated user.',
        responses={200: UnreadCountSerializer},
        tags=['Notifications']
    )
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = NotificationService.get_unread_count(request.user)
        
        serializer = UnreadCountSerializer({'count': count})
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary='List push subscriptions',
        description='Get all active push subscriptions for the authenticated user.',
        responses={200: PushSubscriptionSerializer(many=True)},
        tags=['Push Subscriptions']
    ),
    create=extend_schema(
        summary='Register push subscription',
        description='Register a new Web Push subscription from the PWA. Deactivates any existing subscription with the same endpoint.',
        request=PushSubscriptionSerializer,
        responses={201: PushSubscriptionSerializer},
        tags=['Push Subscriptions']
    ),
    destroy=extend_schema(
        summary='Remove push subscription',
        description='Remove (unsubscribe) a push subscription by ID.',
        responses={204: None},
        tags=['Push Subscriptions']
    ),
)
class PushSubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Web Push subscriptions.
    
    Endpoints:
    - GET /api/v1/notifications/subscriptions/ - List subscriptions
    - POST /api/v1/notifications/subscriptions/ - Register new subscription
    - DELETE /api/v1/notifications/subscriptions/{id}/ - Remove subscription
    """
    
    serializer_class = PushSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionOwner]
    http_method_names = ['get', 'post', 'delete']
    
    def get_queryset(self):
        """Return active subscriptions for the current user only."""
        return PushSubscription.objects.filter(user=self.request.user, active=True)


@extend_schema_view(
    retrieve=extend_schema(
        summary='Get notification preferences',
        description='Get notification preferences for the authenticated user. Creates default preferences if they don\'t exist.',
        responses={200: NotificationPreferenceSerializer},
        tags=['Notification Preferences']
    ),
    update=extend_schema(
        summary='Update notification preferences',
        description='Update all notification preferences for the authenticated user.',
        request=NotificationPreferenceSerializer,
        responses={200: NotificationPreferenceSerializer},
        tags=['Notification Preferences']
    ),
    partial_update=extend_schema(
        summary='Partially update preferences',
        description='Update specific notification preferences fields.',
        request=NotificationPreferenceSerializer,
        responses={200: NotificationPreferenceSerializer},
        tags=['Notification Preferences']
    ),
)
class NotificationPreferenceViewSet(viewsets.GenericViewSet):
    """
    ViewSet for managing notification preferences.
    
    Endpoints:
    - GET /api/v1/notifications/preferences/ - Get preferences
    - PUT /api/v1/notifications/preferences/ - Update all preferences
    - PATCH /api/v1/notifications/preferences/ - Update specific preferences
    """
    
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get or create preferences for current user."""
        preference, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preference
    
    def retrieve(self, request):
        """Get notification preferences."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def update(self, request):
        """Update all notification preferences."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def partial_update(self, request):
        """Partially update notification preferences."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@extend_schema(
    summary='Get VAPID public key',
    description='Get the application\'s VAPID public key needed for Web Push subscriptions in the service worker.',
    responses={200: VapidPublicKeySerializer},
    tags=['Push Subscriptions']
)
class VapidPublicKeyView(APIView):
    """
    View to expose VAPID public key.
    
    The frontend needs this key to create Push subscriptions in the service worker.
    """
    
    permission_classes = [permissions.AllowAny]  # Public endpoint
    
    def get(self, request):
        """Return VAPID public key."""
        serializer = VapidPublicKeySerializer({
            'public_key': settings.VAPID_PUBLIC_KEY
        })
        return Response(serializer.data)
