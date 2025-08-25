from django.urls import path
from .views import GroupsAPIView, GroupAPIView, JoinGroupAPIView, GroupMemberAPIView

urlpatterns = [
    path('', GroupsAPIView.as_view(), name='groups-list'),
    path('<int:pk>/', GroupAPIView.as_view(), name='groups-detail'),
    path('<int:group_id>/members/<int:member_id>/', GroupMemberAPIView.as_view(), name='group-members-detail'),
    path('join/<str:invite_code>/', JoinGroupAPIView.as_view(), name='join-group'),
]
