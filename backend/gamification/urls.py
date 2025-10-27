from django.urls import path

from gamification.views import ListGamificationSettingsAPIView, DetailGamificationSettingsAPIView, SeasonList, \
    SeasonDetail, SeasonByClient

urlpatterns = [
    path('settings', ListGamificationSettingsAPIView.as_view(), name='list-gamification-settings'),
    path('settings/<int:pk>', DetailGamificationSettingsAPIView.as_view(), name='detail-gamification-settings'),
    path('seasons', SeasonList.as_view(), name='season-list'),
    path('seasons/<int:pk>', SeasonDetail.as_view(), name='season-detail'),
    path('seasons/client/<int:client_id>', SeasonByClient.as_view(), name='season-by-client'),
]
