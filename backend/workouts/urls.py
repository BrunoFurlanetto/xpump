from django.urls import path
from .views import WorkoutCheckinsAPIView, WorkoutCheckinAPIView, WorkoutCheckinsByUserAPIView

urlpatterns = [
    path('', WorkoutCheckinsAPIView.as_view(), name='workout-list'),
    path('<int:pk>/', WorkoutCheckinAPIView.as_view(), name='workout-detail'),
    path('user/<int:user_id>/', WorkoutCheckinsByUserAPIView.as_view(), name='workout-by-user'),
]
