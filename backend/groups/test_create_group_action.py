"""
Teste básico para o action de criar grupo a partir de um grupo principal.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from groups.models import Group
from clients.models import Client


class CreateGroupFromMainTest(TestCase):
    def setUp(self):
        """Configuração inicial para os testes"""
        self.client_api = APIClient()

        # Criar usuário
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        # Criar grupo principal
        self.main_group = Group.objects.create(
            name='Grupo Principal',
            description='Grupo principal de teste',
            created_by=self.user,
            owner=self.user,
            main=True
        )

        # Criar cliente e associar ao grupo principal
        self.client_obj = Client.objects.create(
            name='Cliente Teste',
            cnpj='12345678000100',
            contact_email='cliente@example.com',
            phone='(11) 99999-9999',
            address='Endereço Teste',
            owners=self.user,
            main_group=self.main_group
        )

        # Autenticar usuário
        self.client_api.force_authenticate(user=self.user)

    def test_create_group_success(self):
        """Teste de criação de grupo com sucesso"""
        url = reverse('create-group-from-main', kwargs={'group_id': self.main_group.id})
        data = {
            'name': 'Novo Subgrupo',
            'description': 'Descrição do subgrupo',
        }

        response = self.client_api.post(url, data, format='json')

        # Verificar se foi criado com sucesso
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verificar se o grupo foi criado
        new_group = Group.objects.get(name='Novo Subgrupo')
        self.assertFalse(new_group.main)  # Não deve ser main
        self.assertEqual(new_group.owner, self.user)

        # Verificar se foi associado ao cliente
        self.assertIn(new_group, self.client_obj.groups.all())

    def test_create_group_non_main_group(self):
        """Teste de erro ao tentar criar grupo a partir de não-main group"""
        # Criar grupo não-main
        non_main_group = Group.objects.create(
            name='Grupo Não-Principal',
            created_by=self.user,
            owner=self.user,
            main=False
        )

        url = reverse('create-group-from-main', kwargs={'group_id': non_main_group.id})
        data = {
            'name': 'Novo Subgrupo',
            'description': 'Descrição do subgrupo',
        }

        response = self.client_api.post(url, data, format='json')

        # Deve retornar erro
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Apenas grupos principais', response.data['detail'])

    def test_create_group_permission_denied(self):
        """Teste de erro de permissão quando não é owner"""
        # Criar outro usuário
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )

        # Autenticar com o outro usuário
        self.client_api.force_authenticate(user=other_user)

        url = reverse('create-group-from-main', kwargs={'group_id': self.main_group.id})
        data = {
            'name': 'Novo Subgrupo',
            'description': 'Descrição do subgrupo',
        }

        response = self.client_api.post(url, data, format='json')

        # Deve retornar erro de permissão
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Apenas o proprietário', response.data['detail'])

    def test_create_group_superuser_permission(self):
        """Teste de permissão para superuser"""
        # Criar superuser
        superuser = User.objects.create_superuser(
            username='superuser',
            email='super@example.com',
            password='superpass123'
        )

        # Autenticar com superuser
        self.client_api.force_authenticate(user=superuser)

        url = reverse('create-group-from-main', kwargs={'group_id': self.main_group.id})
        data = {
            'name': 'Subgrupo Superuser',
            'description': 'Subgrupo criado por superuser',
        }

        response = self.client_api.post(url, data, format='json')

        # Deve ter sucesso
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verificar se o grupo foi criado
        new_group = Group.objects.get(name='Subgrupo Superuser')
        self.assertEqual(new_group.created_by, superuser)
        self.assertEqual(new_group.owner, superuser)
