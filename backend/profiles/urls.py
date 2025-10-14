from django.urls import path

from .views import ProfilesAPIView, ProfileAPIView, ProfileMeAPIView

urlpatterns = [
    path('', ProfilesAPIView.as_view(), name='profiles-list'),
    path('<int:pk>/', ProfileAPIView.as_view(), name='profile-detail'),
    path('me/', ProfileMeAPIView.as_view(), name='profile-me'),
]
