"""
URL configuration for notifications app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationViewSet,
    PushSubscriptionViewSet,
    NotificationPreferenceViewSet,
    VapidPublicKeyView
)

app_name = 'notifications'

# Create router for viewsets
router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')
router.register(r'subscriptions', PushSubscriptionViewSet, basename='subscription')
router.register(r'preferences', NotificationPreferenceViewSet, basename='preference')

urlpatterns = [
    path('vapid-key/', VapidPublicKeyView.as_view(), name='vapid-key'),
    path('', include(router.urls)),
]
