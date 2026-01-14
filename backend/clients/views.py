from django.shortcuts import render
from django.contrib.auth.models import User
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

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


@extend_schema(tags=['Clients'])
@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_client_with_owner(request):
    """
    Cria um novo cliente junto com um usuário owner
    """
    try:
        with transaction.atomic():
            # Extrair dados do request
            owner_data = {
                'username': request.data.get('owner_username'),
                'email': request.data.get('owner_email'),
                'password': request.data.get('owner_password'),
                'first_name': request.data.get('owner_first_name'),
                'last_name': request.data.get('owner_last_name'),
            }

            # Validar dados do owner
            if not all(owner_data.values()):
                return Response(
                    {'detail': 'Todos os campos do proprietário são obrigatórios'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Criar usuário owner
            owner = User.objects.create_user(
                username=owner_data['username'],
                email=owner_data['email'],
                password=owner_data['password'],
                first_name=owner_data['first_name'],
                last_name=owner_data['last_name']
            )

            # Criar cliente
            client_data = {
                'name': request.data.get('name'),
                'cnpj': request.data.get('cnpj'),
                'contact_email': request.data.get('contact_email'),
                'phone': request.data.get('phone'),
                'address': request.data.get('address'),
                'owners': owner,
            }

            # Validar dados do cliente
            required_fields = ['name', 'cnpj', 'contact_email', 'phone', 'address']
            if not all(client_data.get(field) for field in required_fields):
                return Response(
                    {'detail': 'Todos os campos do cliente são obrigatórios'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            client = Client.objects.create(**client_data)

            # Criar grupo principal
            create_group_for_client(
                client=client,
                name=client.name,
                owner=owner,
                created_by=owner,
                main=True
            )

            # Criar perfil para o owner
            Profile.objects.create(user=owner, employer=client)

            # Retornar dados do cliente criado
            serializer = ClientSerializer(client)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'detail': f'Erro ao criar cliente: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
