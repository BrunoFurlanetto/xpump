from django.urls import path
from .views import GroupsAPIView, GroupAPIView, GroupMembersAPIView

urlpatterns = [
    path('', GroupsAPIView.as_view(), name='groups-list'),
    path('<int:pk>/', GroupAPIView.as_view(), name='groups-detail'),
    path('groups/<int:group_id>/members/', GroupMembersAPIView.as_view(), name='group-members'),
    path('groups/<int:group_id>/members/<int:user_id>/', GroupMembersAPIView.as_view(), name='group-member'),
]
