from django.urls import path

from status.views import StatusAPIVew, StatusDetailAPIView

urlpatterns = [
    path('', StatusAPIVew.as_view(), name='status-list'),
    path('<int:pk>/', StatusDetailAPIView.as_view(), name='status-detail')
]
