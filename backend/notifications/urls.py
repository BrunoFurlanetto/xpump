from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BroadcastView,
    NotificationViewSet,
    PushSubscriptionViewSet,
    VapidPublicKeyView,
)

app_name = 'notifications'

router = DefaultRouter()
router.register(r'subscribe', PushSubscriptionViewSet, basename='push-subscription')
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('vapid-public-key/', VapidPublicKeyView.as_view(), name='vapid-public-key'),
    path('broadcast/', BroadcastView.as_view(), name='broadcast'),
    path('', include(router.urls)),
]
