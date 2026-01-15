from django.db.models import ProtectedError
from django.contrib.auth.models import User
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from clients.models import Client
from clients.serializer import ClientSerializer
from profiles.models import Profile
from groups.services import create_group_for_client


@extend_schema(tags=['Clients'])
class ClientsAPIView(ListCreateAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAdminUser]


@extend_schema(tags=['Clients'])
class ClientAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAdminUser]

    def delete(self, request, *args, **kwargs):
        try:
            return self.destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({
                'detail': 'This client cannot be deleted because it is associated with other records. Delete the users related to this client or deactivate it.'},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(tags=['Clients'])
class CreateClientWithOwnerAPIView(APIView):
    """
    Creates a new client together with an owner user
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            with transaction.atomic():
                # Extract request data
                owner_data = {
                    'username': request.data.get('owner_username'),
                    'email': request.data.get('owner_email'),
                    'password': request.data.get('owner_password'),
                    'first_name': request.data.get('owner_first_name'),
                    'last_name': request.data.get('owner_last_name'),
                }

                # Validate owner data
                if not all(owner_data.values()):
                    return Response(
                        {'detail': 'All owner fields are required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Create user owner
                owner = User.objects.create_user(
                    username=owner_data['username'],
                    email=owner_data['email'],
                    password=owner_data['password'],
                    first_name=owner_data['first_name'],
                    last_name=owner_data['last_name']
                )

                # Create customer
                client_data = {
                    'name': request.data.get('name'),
                    'cnpj': request.data.get('cnpj'),
                    'contact_email': request.data.get('contact_email'),
                    'phone': request.data.get('phone'),
                    'address': request.data.get('address'),
                    'owners': owner,
                }

                # Validate customer data
                required_fields = ['name', 'cnpj', 'contact_email', 'phone', 'address']
                if not all(client_data.get(field) for field in required_fields):
                    return Response(
                        {'detail': 'Todos os campos do cliente são obrigatórios'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                client = Client.objects.create(**client_data)

                # Create Parent Group
                create_group_for_client(
                    client=client,
                    name=client.name,
                    owner=owner,
                    created_by=owner,
                    main=True
                )

                # Create profile for the owner
                Profile.objects.create(user=owner, employer=client)

                # Return data from the created customer
                serializer = ClientSerializer(client)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'detail': f'Error creating client: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
