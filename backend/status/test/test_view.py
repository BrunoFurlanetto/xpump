from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch

from status.models import Status, TargetApp, StatusAction


User = get_user_model()


class StatusAPIViewTest(TestCase):

    def setUp(self):
        """Configuração inicial para os testes"""
        self.client = APIClient()

        # Criar usuário admin
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123'
        )
        self.admin_user.is_staff = True
        self.admin_user.is_superuser = True
        self.admin_user.save()

        # Criar usuário comum
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )

        # Criar dados de teste
        self.status_data = {
            'name': 'Publicado',
            'description': 'Status para itens publicados',
            'is_active': True,
            'app_name': TargetApp.WORKOUT,
            'action': StatusAction.PUBLISHED
        }

        self.status = Status.objects.create(**self.status_data)

        # URLs
        self.list_url = reverse('status-list')
        self.detail_url = reverse('status-detail', kwargs={'pk': self.status.pk})

    def test_get_status_list_as_admin(self):
        """Testa buscar lista de status como admin"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Publicado')

    def test_get_status_list_as_regular_user(self):
        """Testa buscar lista de status como usuário comum (deve ser negado)"""
        self.client.force_authenticate(user=self.regular_user)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_status_list_unauthenticated(self):
        """Testa buscar lista de status sem autenticação"""
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_status_as_admin(self):
        """Testa criar status como admin"""
        self.client.force_authenticate(user=self.admin_user)

        new_status_data = {
            'name': 'Aprovado',
            'description': 'Status aprovado',
            'is_active': True,
            'app_name': TargetApp.NUTRITION,
            'action': StatusAction.APPROVED
        }

        response = self.client.post(self.list_url, new_status_data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Aprovado')
        self.assertEqual(Status.objects.count(), 2)

    def test_create_status_as_regular_user(self):
        """Testa criar status como usuário comum (deve ser negado)"""
        self.client.force_authenticate(user=self.regular_user)

        new_status_data = {
            'name': 'Aprovado',
            'app_name': TargetApp.NUTRITION,
            'action': StatusAction.APPROVED
        }

        response = self.client.post(self.list_url, new_status_data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Status.objects.count(), 1)

    def test_create_status_invalid_data(self):
        """Testa criar status com dados inválidos"""
        self.client.force_authenticate(user=self.admin_user)

        invalid_data = {
            'name': '',  # Nome vazio
            'app_name': 'INVALID',
            'action': StatusAction.APPROVED
        }

        response = self.client.post(self.list_url, invalid_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_filter_by_app_name(self):
        """Testa filtro por app_name"""
        # Criar outro status
        Status.objects.create(
            name='Nutrition Status',
            app_name=TargetApp.NUTRITION,
            action=StatusAction.PUBLISHED
        )

        self.client.force_authenticate(user=self.admin_user)

        # Filtrar por WORKOUT
        response = self.client.get(self.list_url, {'app_name': TargetApp.WORKOUT})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['app_name'], TargetApp.WORKOUT)

        # Filtrar por NUTRITION
        response = self.client.get(self.list_url, {'app_name': TargetApp.NUTRITION})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['app_name'], TargetApp.NUTRITION)

    def test_filter_by_action(self):
        """Testa filtro por action"""
        # Criar outro status
        Status.objects.create(
            name='Pending Status',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.PENDING
        )

        self.client.force_authenticate(user=self.admin_user)

        # Filtrar por PUBLISHED
        response = self.client.get(self.list_url, {'action': StatusAction.PUBLISHED})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['action'], StatusAction.PUBLISHED)

        # Filtrar por PENDING
        response = self.client.get(self.list_url, {'action': StatusAction.PENDING})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['action'], StatusAction.PENDING)

    def test_combined_filters(self):
        """Testa combinação de filtros"""
        # Criar mais status
        Status.objects.create(
            name='Nutrition Pending',
            app_name=TargetApp.NUTRITION,
            action=StatusAction.PENDING
        )
        Status.objects.create(
            name='Workout Pending',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.PENDING
        )

        self.client.force_authenticate(user=self.admin_user)

        # Filtrar por app_name e action
        response = self.client.get(self.list_url, {
            'app_name': TargetApp.WORKOUT,
            'action': StatusAction.PENDING
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Workout Pending')


class StatusDetailAPIViewTest(TestCase):

    def setUp(self):
        """Configuração inicial para os testes"""
        self.client = APIClient()

        # Criar usuário admin
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123'
        )
        self.admin_user.is_staff = True
        self.admin_user.is_superuser = True
        self.admin_user.save()

        # Criar usuário comum
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )

        # Criar status de teste
        self.status = Status.objects.create(
            name='Publicado',
            description='Status publicado',
            is_active=True,
            app_name=TargetApp.WORKOUT,
            action=StatusAction.PUBLISHED
        )

        self.detail_url = reverse('status-detail', kwargs={'pk': self.status.pk})

    def test_get_status_detail_as_admin(self):
        """Testa buscar detalhe de status como admin"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Publicado')
        self.assertEqual(response.data['id'], self.status.id)

    def test_get_status_detail_as_regular_user(self):
        """Testa buscar detalhe de status como usuário comum"""
        self.client.force_authenticate(user=self.regular_user)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_nonexistent_status(self):
        """Testa buscar status inexistente"""
        self.client.force_authenticate(user=self.admin_user)

        nonexistent_url = reverse('status-detail', kwargs={'pk': 9999})
        response = self.client.get(nonexistent_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_status_as_admin(self):
        """Testa atualizar status como admin"""
        self.client.force_authenticate(user=self.admin_user)

        update_data = {
            'name': 'Publicado Atualizado',
            'description': 'Descrição atualizada',
            'is_active': False,
            'app_name': TargetApp.NUTRITION,
            'action': StatusAction.APPROVED
        }

        response = self.client.put(self.detail_url, update_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Publicado Atualizado')

        # Verificar se foi atualizado no banco
        self.status.refresh_from_db()
        self.assertEqual(self.status.name, 'Publicado Atualizado')
        self.assertFalse(self.status.is_active)

    def test_partial_update_status(self):
        """Testa atualização parcial de status"""
        self.client.force_authenticate(user=self.admin_user)

        update_data = {
            'name': 'Nome Parcialmente Atualizado'
        }

        response = self.client.patch(self.detail_url, update_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Nome Parcialmente Atualizado')

        # Verificar se outros campos permaneceram iguais
        self.status.refresh_from_db()
        self.assertEqual(self.status.description, 'Status publicado')
        self.assertTrue(self.status.is_active)

    def test_update_status_as_regular_user(self):
        """Testa atualizar status como usuário comum"""
        self.client.force_authenticate(user=self.regular_user)

        update_data = {
            'name': 'Tentativa de Atualização'
        }

        response = self.client.patch(self.detail_url, update_data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verificar se não foi atualizado
        self.status.refresh_from_db()
        self.assertEqual(self.status.name, 'Publicado')

    @patch('status.models.Status.delete')
    def test_delete_status_as_admin(self, mock_delete):
        """Testa deletar status como admin"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        mock_delete.assert_called_once()

    def test_delete_status_as_regular_user(self):
        """Testa deletar status como usuário comum"""
        self.client.force_authenticate(user=self.regular_user)

        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verificar se ainda existe
        self.assertTrue(Status.objects.filter(id=self.status.id).exists())

    def test_update_with_invalid_data(self):
        """Testa atualização com dados inválidos"""
        self.client.force_authenticate(user=self.admin_user)

        invalid_data = {
            'name': '',  # Nome vazio
            'app_name': 'INVALID_APP'
        }

        response = self.client.patch(self.detail_url, invalid_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_content_type_json(self):
        """Testa que as respostas são em JSON"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['content-type'], 'application/json')

    def test_response_structure(self):
        """Testa a estrutura da resposta"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verificar se todos os campos estão presentes
        expected_fields = ['id', 'name', 'description', 'is_active', 'app_name', 'action']
        for field in expected_fields:
            self.assertIn(field, response.data)
