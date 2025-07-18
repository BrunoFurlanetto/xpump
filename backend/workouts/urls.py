from django.urls import path
from .views import WorkoutCheckinsAPIView, WorkoutCheckinAPIView, WorkoutCheckinsByUserAPIView, WorkoutPlanAPIView, \
    WorkoutPlansAPIView

urlpatterns = [
    path('', WorkoutCheckinsAPIView.as_view(), name='workout-list'),
    path('<int:pk>/', WorkoutCheckinAPIView.as_view(), name='workout-detail'),
    path('user/<int:user_id>/', WorkoutCheckinsByUserAPIView.as_view(), name='workout-by-user'),
    path('plans/', WorkoutPlansAPIView.as_view(), name='workout-plans-list'),
    path('plans/<int:pk>/', WorkoutPlanAPIView.as_view(), name='workout-plan-detail'),
]
