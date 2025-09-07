from django.urls import path

from status.views import StatusAPIView, StatusDetailAPIView

urlpatterns = [
    path('', StatusAPIView.as_view(), name='status-list'),
    path('<int:pk>/', StatusDetailAPIView.as_view(), name='status-detail')
]
