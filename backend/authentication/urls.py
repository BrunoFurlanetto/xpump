from django.urls import path

from .views import UsersListAPIView, UserAPIView

urlpatterns = [
    path('users/', UsersListAPIView.as_view(), name='users-list'),
    path('users/<int:pk>/', UserAPIView.as_view(), name='user-detail'),
]
