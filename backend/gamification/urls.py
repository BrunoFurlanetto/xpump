from django.urls import path

from gamification.views import ListGamificationSettingsAPIView, DetailGamificationSettingsAPIView, SeasonList, \
    SeasonDetail, SeasonByClient

urlpatterns = [
    path('/settings', ListGamificationSettingsAPIView.as_view(), name='list_gamification_settings'),
    path('/settings/<int:pk>', DetailGamificationSettingsAPIView.as_view(), name='detail_gamification_settings'),
    path('/seasons', SeasonList.as_view(), name='season_list'),
    path('/seasons/<int:pk>', SeasonDetail.as_view(), name='season_detail'),
    path('/seasons/client/<int:client_id>', SeasonByClient.as_view(), name='season_by_client'),
]
