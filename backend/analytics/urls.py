
from django.urls import path

from analytics.views import (
    SystemStatsAPIView,
    UserListAPIView,
    GroupListAPIView,
    RecentActivitiesAPIView,
    UserDetailAPIView,
    GroupDetailAPIView
)

urlpatterns = [
    # System statistics
    path('admin/system/stats/', SystemStatsAPIView.as_view(), name='admin-system-stats'),

    # User management
    path('admin/system/users/', UserListAPIView.as_view(), name='admin-system-users'),
    path('admin/system/users/<int:user_id>/', UserDetailAPIView.as_view(), name='admin-user-detail'),

    # Group management
    path('admin/system/groups/', GroupListAPIView.as_view(), name='admin-system-groups'),
    path('admin/system/groups/<int:group_id>/', GroupDetailAPIView.as_view(), name='admin-group-detail'),

    # Activities
    path('admin/system/activities/', RecentActivitiesAPIView.as_view(), name='admin-system-activities'),
]
