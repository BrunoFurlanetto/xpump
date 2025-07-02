from django.urls import path

from .views import UsersListAPIView, UserAPIView

urlpatterns = [
    path('', UsersListAPIView.as_view(), name='users-list'),
    path('<int:pk>/', UserAPIView.as_view(), name='user-detail'),
]
