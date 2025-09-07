from django.test import TestCase
from rest_framework.exceptions import ValidationError

from status.models import Status, TargetApp, StatusAction
from status.serializer import StatusSerializer


class StatusSerializerTest(TestCase):

    def setUp(self):
        """Configuração inicial para os testes"""
        self.status_data = {
            'name': 'Publicado',
            'description': 'Status para itens publicados',
            'is_active': True,
            'app_name': TargetApp.WORKOUT,
            'action': StatusAction.PUBLISHED
        }
        self.status = Status.objects.create(**self.status_data)

    def test_serialize_status(self):
        """Testa a serialização de um status"""
        serializer = StatusSerializer(self.status)
        data = serializer.data

        self.assertEqual(data['name'], 'Publicado')
        self.assertEqual(data['description'], 'Status para itens publicados')
        self.assertTrue(data['is_active'])
        self.assertEqual(data['app_name'], TargetApp.WORKOUT)
        self.assertEqual(data['action'], StatusAction.PUBLISHED)
        self.assertEqual(data['id'], self.status.id)

    def test_deserialize_valid_data(self):
        """Testa a deserialização de dados válidos"""
        data = {
            'name': 'Aprovado',
            'description': 'Status para itens aprovados',
            'is_active': True,
            'app_name': TargetApp.NUTRITION,
            'action': StatusAction.APPROVED
        }

        serializer = StatusSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        status = serializer.save()
        self.assertEqual(status.name, 'Aprovado')
        self.assertEqual(status.app_name, TargetApp.NUTRITION)
        self.assertEqual(status.action, StatusAction.APPROVED)

    def test_deserialize_without_description(self):
        """Testa deserialização sem description (campo opcional)"""
        data = {
            'name': 'Pendente',
            'is_active': True,
            'app_name': TargetApp.WORKOUT,
            'action': StatusAction.PENDING
        }

        serializer = StatusSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        status = serializer.save()
        self.assertEqual(status.name, 'Pendente')
        self.assertEqual(status.description, '')

    def test_deserialize_with_empty_description(self):
        """Testa deserialização com description vazia"""
        data = {
            'name': 'Bloqueado',
            'description': '',
            'is_active': True,
            'app_name': TargetApp.COMMENT,
            'action': StatusAction.BLOCKED
        }

        serializer = StatusSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        status = serializer.save()
        self.assertEqual(status.description, '')

    def test_deserialize_without_is_active(self):
        """Testa deserialização sem is_active (deve usar valor padrão)"""
        data = {
            'name': 'Rejeitado',
            'description': 'Status rejeitado',
            'app_name': TargetApp.NUTRITION,
            'action': StatusAction.REJECTED
        }

        serializer = StatusSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        status = serializer.save()
        self.assertTrue(status.is_active)  # Valor padrão

    def test_deserialize_missing_required_fields(self):
        """Testa deserialização com campos obrigatórios faltando"""
        # Sem name
        data = {
            'description': 'Status sem nome',
            'app_name': TargetApp.WORKOUT,
            'action': StatusAction.PUBLISHED
        }

        serializer = StatusSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

        # Sem app_name
        data = {
            'name': 'Status sem app',
            'action': StatusAction.PUBLISHED
        }

        serializer = StatusSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('app_name', serializer.errors)

        # Sem action
        data = {
            'name': 'Status sem action',
            'app_name': TargetApp.WORKOUT
        }

        serializer = StatusSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('action', serializer.errors)

    def test_deserialize_invalid_choices(self):
        """Testa deserialização com valores inválidos para choices"""
        # app_name inválido
        data = {
            'name': 'Status inválido',
            'app_name': 'INVALID_APP',
            'action': StatusAction.PUBLISHED
        }

        serializer = StatusSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('app_name', serializer.errors)

        # action inválida
        data = {
            'name': 'Status inválido',
            'app_name': TargetApp.WORKOUT,
            'action': 'INVALID_ACTION'
        }

        serializer = StatusSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('action', serializer.errors)

    def test_serialize_queryset(self):
        """Testa serialização de múltiplos objetos"""
        # Criar mais status
        Status.objects.create(
            name='Aprovado',
            app_name=TargetApp.NUTRITION,
            action=StatusAction.APPROVED
        )
        Status.objects.create(
            name='Pendente',
            app_name=TargetApp.COMMENT,
            action=StatusAction.PENDING
        )

        statuses = Status.objects.all()
        serializer = StatusSerializer(statuses, many=True)

        self.assertEqual(len(serializer.data), 3)
        names = [item['name'] for item in serializer.data]
        self.assertIn('Publicado', names)
        self.assertIn('Aprovado', names)
        self.assertIn('Pendente', names)

    def test_update_status(self):
        """Testa atualização de status através do serializer"""
        update_data = {
            'name': 'Publicado Atualizado',
            'description': 'Descrição atualizada',
            'is_active': False,
            'app_name': TargetApp.NUTRITION,
            'action': StatusAction.APPROVED
        }

        serializer = StatusSerializer(self.status, data=update_data)
        self.assertTrue(serializer.is_valid())

        updated_status = serializer.save()
        self.assertEqual(updated_status.name, 'Publicado Atualizado')
        self.assertEqual(updated_status.description, 'Descrição atualizada')
        self.assertFalse(updated_status.is_active)
        self.assertEqual(updated_status.app_name, TargetApp.NUTRITION)
        self.assertEqual(updated_status.action, StatusAction.APPROVED)

    def test_partial_update(self):
        """Testa atualização parcial de status"""
        update_data = {
            'name': 'Nome Atualizado',
            'is_active': False
        }

        serializer = StatusSerializer(self.status, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())

        updated_status = serializer.save()
        self.assertEqual(updated_status.name, 'Nome Atualizado')
        self.assertFalse(updated_status.is_active)
        # Outros campos devem permanecer iguais
        self.assertEqual(updated_status.description, 'Status para itens publicados')
        self.assertEqual(updated_status.app_name, TargetApp.WORKOUT)
        self.assertEqual(updated_status.action, StatusAction.PUBLISHED)

    def test_name_max_length_validation(self):
        """Testa validação do tamanho máximo do nome"""
        data = self.status_data.copy()
        data['name'] = 'x' * 121  # Maior que 120 caracteres

        serializer = StatusSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_all_target_app_choices(self):
        """Testa serialização com todas as opções de TargetApp"""
        for app_choice in [TargetApp.NUTRITION, TargetApp.COMMENT]: # WORKOUT removed because it's already tested in setUp
            data = {
                'name': f'Status {app_choice}',
                'app_name': app_choice,
                'action': StatusAction.PUBLISHED,
            }

            serializer = StatusSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Falhou para {app_choice}")

    def test_all_status_action_choices(self):
        """Testa serialização com todas as opções de StatusAction"""
        actions = [
            StatusAction.PUBLISHED, StatusAction.APPROVED,
            StatusAction.UNDER_REVIEW, StatusAction.BLOCKED,
            StatusAction.REJECTED, StatusAction.PENDING
        ]

        for action_choice in actions:
            data = {
                'name': f'Status {action_choice}',
                'app_name': TargetApp.NUTRITION,
                'action': action_choice
            }

            serializer = StatusSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Falhou para {action_choice}")
