"""
WebSocket routing configuration for notifications.
"""
from django.urls import path
from .consumers import NotificationConsumer

# WebSocket URL patterns
websocket_urlpatterns = [
    path('ws/notifications/', NotificationConsumer.as_asgi()),
]
