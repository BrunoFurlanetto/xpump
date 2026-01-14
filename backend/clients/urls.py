from django.urls import path

from clients.views import ClientsAPIView, ClientAPIView, CreateClientWithOwnerAPIView

urlpatterns = [
    path('', ClientsAPIView.as_view(), name='client-list'),
    path('create-with-owner/', CreateClientWithOwnerAPIView.as_view(), name='client-create-with-owner'),
    path('<int:pk>/', ClientAPIView.as_view(), name='client-detail'),
]
