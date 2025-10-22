from django.urls import path

from clients.views import ClientsAPIView, ClientAPIView

urlpatterns = [
    path('', ClientsAPIView.as_view(), name='client-list'),
    path('<int:pk>/', ClientAPIView.as_view(), name='client-detail'),
]
