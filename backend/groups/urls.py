from django.urls import path
from .views import GroupsAPIView, GroupAPIView, GroupMembersAPIView, JoinGroupAPIView

urlpatterns = [
    path('', GroupsAPIView.as_view(), name='groups-list'),
    path('<int:pk>/', GroupAPIView.as_view(), name='groups-detail'),
    path('<int:group_id>/members/', GroupMembersAPIView.as_view(), name='group-members'),
    path('<int:group_id>/members/<int:user_id>/', GroupMembersAPIView.as_view(), name='group-member'),
    path('join/<str:invite_code>/', JoinGroupAPIView.as_view(), name='join-group'),
]
