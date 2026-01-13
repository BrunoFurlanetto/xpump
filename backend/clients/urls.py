from django.urls import path

from clients.views import ClientsAPIView, ClientAPIView, create_client_with_owner

urlpatterns = [
    path('', ClientsAPIView.as_view(), name='client-list'),
    path('create-with-owner/', create_client_with_owner, name='client-create-with-owner'),
    path('<int:pk>/', ClientAPIView.as_view(), name='client-detail'),
]
