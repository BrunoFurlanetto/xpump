from django.urls import path
from .views import GroupsAPIView, GroupAPIView, InviteGroupAPIView, GroupMemberAPIView, InviteGroupAccept, \
    QuitingGroupAPIView, GroupMeAPIView

urlpatterns = [
    path('', GroupsAPIView.as_view(), name='groups-list'),
    path('<int:pk>/', GroupAPIView.as_view(), name='groups-detail'),
    # path('<int:pk>/stats/', GroupStatsAPIView.as_view(), name='groups-stats'),
    path('me/', GroupMeAPIView.as_view(), name='groups-me'),
    path('<int:group_id>/members/<int:member_id>/', GroupMemberAPIView.as_view(), name='group-members-detail'),
    path('<int:group_id>/invite/<str:user>/', InviteGroupAPIView.as_view(), name='invite-group'),
    path('<int:group_id>/accept-invite/', InviteGroupAccept.as_view(), name='accept-invite-group'),
    path('<int:group_id>/quiting/', QuitingGroupAPIView.as_view(), name='quit-group')
]
