from django.urls import path
from .views import GroupsAPIView, GroupAPIView, InviteGroupAPIView, GroupMemberAPIView, InviteGroupAccept

urlpatterns = [
    path('', GroupsAPIView.as_view(), name='groups-list'),
    path('<int:pk>/', GroupAPIView.as_view(), name='groups-detail'),
    path('<int:group_id>/members/<int:member_id>/', GroupMemberAPIView.as_view(), name='group-members-detail'),
    path('<int:group_id>/invite/<str:user>/', InviteGroupAPIView.as_view(), name='invite-group'),
    path('<int:group_id>/accept-invite/', InviteGroupAccept.as_view(), name='accept-invite-group'),
]
