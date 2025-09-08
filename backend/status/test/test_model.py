from django.core.exceptions import ValidationError
from django.test import TestCase
from unittest.mock import patch, MagicMock

from status.models import Status, TargetApp, StatusAction


class StatusModelTest(TestCase):

    def setUp(self):
        """Configuração inicial para os testes"""
        self.status_data = {
            'name': 'Publicado',
            'description': 'Status para itens publicados',
            'is_active': True,
            'app_name': TargetApp.WORKOUT,
            'action': StatusAction.PUBLISHED
        }

    def test_create_status(self):
        """Testa a criação de um status"""
        status = Status.objects.create(**self.status_data)

        self.assertEqual(status.name, 'Publicado')
        self.assertEqual(status.description, 'Status para itens publicados')
        self.assertTrue(status.is_active)
        self.assertEqual(status.app_name, TargetApp.WORKOUT)
        self.assertEqual(status.action, StatusAction.PUBLISHED)

    def test_str_method(self):
        """Testa o método __str__ do modelo Status"""
        status = Status.objects.create(**self.status_data)
        self.assertEqual(str(status), 'Publicado')

    def test_status_choices_validation(self):
        """Testa se as choices são validadas corretamente"""
        # Teste com app_name válido
        valid_apps = [TargetApp.WORKOUT, TargetApp.NUTRITION, TargetApp.COMMENT]
        for app in valid_apps:
            status = Status(
                name=f'Test {app}',
                app_name=app,
                action=StatusAction.PUBLISHED
            )
            status.full_clean()  # Não deve levantar exceção

    def test_status_action_choices_validation(self):
        """Testa se as choices de action são validadas corretamente"""
        valid_actions = [
            StatusAction.PUBLISHED, StatusAction.APPROVED,
            StatusAction.UNDER_REVIEW, StatusAction.BLOCKED,
            StatusAction.REJECTED, StatusAction.PENDING
        ]

        for action in valid_actions:
            status = Status(
                name=f'Test {action}',
                app_name=TargetApp.WORKOUT,
                action=action
            )
            status.full_clean()  # Não deve levantar exceção

    def test_blank_description(self):
        """Testa que description pode ser em branco"""
        status_data = self.status_data.copy()
        status_data['description'] = ''

        status = Status.objects.create(**status_data)
        self.assertEqual(status.description, '')

    def test_is_active_default(self):
        """Testa que is_active tem valor padrão True"""
        status_data = self.status_data.copy()
        del status_data['is_active']

        status = Status.objects.create(**status_data)
        self.assertTrue(status.is_active)

    @patch('importlib.import_module')
    def test_delete_with_related_objects_and_substitute(self, mock_import):
        """Testa a exclusão de status com objetos relacionados e substituto disponível"""
        # Criar status original
        original_status = Status.objects.create(**self.status_data)

        # Criar status substituto
        substitute_data = self.status_data.copy()
        substitute_data['name'] = 'Substituto'
        substitute_status = Status.objects.create(**substitute_data)

        # Mock do modelo relacionado
        mock_related_model = MagicMock()
        mock_related_objects = MagicMock()
        mock_related_objects.exists.return_value = True
        mock_related_objects.update.return_value = None
        mock_related_model.objects.filter.return_value = mock_related_objects

        # Patch para simular a importação do módulo
        mock_module = MagicMock()
        mock_module.WorkoutCheckin = mock_related_model
        mock_import.return_value = mock_module

        # Tentar deletar o status original
        original_status.delete()

        # Verificar se foi chamado update para substituir
        mock_related_objects.update.assert_called_once_with(status=substitute_status)

    @patch('importlib.import_module')
    def test_delete_with_related_objects_no_substitute(self, mock_import):
        """Testa a exclusão de status com objetos relacionados mas sem substituto"""
        # Criar apenas um status
        status = Status.objects.create(**self.status_data)

        # Mock do modelo relacionado
        mock_related_model = MagicMock()
        mock_related_objects = MagicMock()
        mock_related_objects.exists.return_value = True
        mock_related_model.objects.filter.return_value = mock_related_objects

        # Patch para simular a importação do módulo
        mock_module = MagicMock()
        mock_module.WorkoutCheckin = mock_related_model
        mock_import.return_value = mock_module

        # Tentar deletar deve levantar ValidationError
        with self.assertRaises(ValidationError) as context:
            status.delete()

        self.assertIn("Cannot delete status", str(context.exception))

    @patch('importlib.import_module')
    def test_delete_without_related_objects(self, mock_import):
        """Testa a exclusão de status sem objetos relacionados"""
        status = Status.objects.create(**self.status_data)

        # Mock do modelo relacionado sem objetos
        mock_related_model = MagicMock()
        mock_related_objects = MagicMock()
        mock_related_objects.exists.return_value = False
        mock_related_model.objects.filter.return_value = mock_related_objects

        # Patch para simular a importação do módulo
        mock_module = MagicMock()
        mock_module.WorkoutCheckin = mock_related_model
        mock_import.return_value = mock_module

        # Deletar deve funcionar normalmente
        status_id = status.id
        status.delete()

        # Verificar se foi deletado
        self.assertFalse(Status.objects.filter(id=status_id).exists())

    def test_delete_app_without_related_model(self):
        """Testa a exclusão de status para app sem modelo relacionado configurado"""
        # Criar status para COMMENT (comentado no código)
        status_data = self.status_data.copy()
        status_data['app_name'] = TargetApp.COMMENT
        status = Status.objects.create(**status_data)

        # Deletar deve funcionar normalmente
        status_id = status.id
        status.delete()

        # Verificar se foi deletado
        self.assertFalse(Status.objects.filter(id=status_id).exists())

    def test_multiple_status_same_app_action_different_active(self):
        """Testa que pode haver múltiplos status para mesmo app/action se is_active for diferente"""
        # Criar primeiro status ativo
        status1 = Status.objects.create(**self.status_data)

        # Criar segundo status inativo com mesmo app_name e action
        status2_data = self.status_data.copy()
        status2_data['name'] = 'Publicado Inativo'
        status2_data['is_active'] = False
        status2 = Status.objects.create(**status2_data)

        self.assertEqual(Status.objects.count(), 2)
        self.assertTrue(status1.is_active)
        self.assertFalse(status2.is_active)

    def test_target_app_choices(self):
        """Testa as opções de TargetApp"""
        self.assertEqual(TargetApp.WORKOUT, 'WORKOUT')
        self.assertEqual(TargetApp.NUTRITION, 'NUTRITION')
        self.assertEqual(TargetApp.COMMENT, 'COMMENT')

    def test_status_action_choices(self):
        """Testa as opções de StatusAction"""
        self.assertEqual(StatusAction.PUBLISHED, 'PUBLISHED')
        self.assertEqual(StatusAction.APPROVED, 'APPROVED')
        self.assertEqual(StatusAction.UNDER_REVIEW, 'UNDER_REVIEW')
        self.assertEqual(StatusAction.BLOCKED, 'BLOCKED')
        self.assertEqual(StatusAction.REJECTED, 'REJECTED')
        self.assertEqual(StatusAction.PENDING, 'PENDING')

    @patch('importlib.import_module')
    def test_alter_status_with_related_objects(self, mock_import):
        """Testa a alteração de status com objetos relacionados"""
        # Criar status atual
        current_status = Status.objects.create(
            name='Publicado',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.PUBLISHED,
            is_active=True
        )

        # Criar novo status
        new_status = Status.objects.create(
            name='Sob Revisão',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.UNDER_REVIEW,
            is_active=True
        )

        # Mock do modelo relacionado
        mock_related_model = MagicMock()
        mock_related_objects = MagicMock()
        mock_related_objects.exists.return_value = True
        mock_related_objects.update.return_value = None
        mock_related_model.objects.filter.return_value = mock_related_objects

        # Mock do import
        mock_module = MagicMock()
        mock_module.WorkoutCheckin = mock_related_model
        mock_import.return_value = mock_module

        # Executar alter_status
        Status.alter_status(TargetApp.WORKOUT, StatusAction.PUBLISHED, StatusAction.UNDER_REVIEW)

        # Verificar se foi chamado filter com o status correto
        mock_related_model.objects.filter.assert_called_once_with(status=current_status)
        # Verificar se foi chamado update com o novo status
        mock_related_objects.update.assert_called_once_with(status=new_status)

    @patch('importlib.import_module')
    def test_alter_status_without_related_objects(self, mock_import):
        """Testa a alteração de status sem objetos relacionados"""
        # Criar status atual
        Status.objects.create(
            name='Publicado',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.PUBLISHED,
            is_active=True
        )

        # Criar novo status
        Status.objects.create(
            name='Aprovado',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.APPROVED,
            is_active=True
        )

        # Mock do modelo relacionado sem objetos
        mock_related_model = MagicMock()
        mock_related_objects = MagicMock()
        mock_related_objects.exists.return_value = False
        mock_related_model.objects.filter.return_value = mock_related_objects

        # Mock do import
        mock_module = MagicMock()
        mock_module.WorkoutCheckin = mock_related_model
        mock_import.return_value = mock_module

        # Executar alter_status - não deve levantar exceção
        Status.alter_status(TargetApp.WORKOUT, StatusAction.PUBLISHED, StatusAction.APPROVED)

        # Verificar que foi chamado mas update não foi executado
        mock_related_model.objects.filter.assert_called_once()
        mock_related_objects.update.assert_not_called()

    def test_alter_status_app_without_related_model(self):
        """Testa a alteração de status para app sem modelo relacionado configurado"""
        # Criar status atual
        Status.objects.create(
            name='Publicado',
            app_name=TargetApp.COMMENT,
            action=StatusAction.PUBLISHED,
            is_active=True
        )

        # Criar novo status
        Status.objects.create(
            name='Aprovado',
            app_name=TargetApp.COMMENT,
            action=StatusAction.APPROVED,
            is_active=True
        )

        # Executar alter_status - deve funcionar normalmente (não há modelo relacionado)
        Status.alter_status(TargetApp.COMMENT, StatusAction.PUBLISHED, StatusAction.APPROVED)

    def test_alter_status_current_not_exists(self):
        """Testa erro quando o status atual não existe"""
        # Criar apenas o novo status
        Status.objects.create(
            name='Aprovado',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.APPROVED,
            is_active=True
        )

        # Tentar alterar de um status que não existe
        with self.assertRaises(ValidationError) as context:
            Status.alter_status(TargetApp.WORKOUT, StatusAction.PUBLISHED, StatusAction.APPROVED)

        self.assertIn("Current or new status does not exist or is not active", str(context.exception))

    def test_alter_status_new_not_exists(self):
        """Testa erro quando o novo status não existe"""
        # Criar apenas o status atual
        Status.objects.create(
            name='Publicado',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.PUBLISHED,
            is_active=True
        )

        # Tentar alterar para um status que não existe
        with self.assertRaises(ValidationError) as context:
            Status.alter_status(TargetApp.WORKOUT, StatusAction.PUBLISHED, StatusAction.APPROVED)

        self.assertIn("Current or new status does not exist or is not active", str(context.exception))

    def test_alter_status_current_inactive(self):
        """Testa erro quando o status atual está inativo"""
        # Criar status atual inativo
        Status.objects.create(
            name='Publicado',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.PUBLISHED,
            is_active=False
        )

        # Criar novo status
        Status.objects.create(
            name='Aprovado',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.APPROVED,
            is_active=True
        )

        # Tentar alterar - deve falhar pois status atual está inativo
        with self.assertRaises(ValidationError) as context:
            Status.alter_status(TargetApp.WORKOUT, StatusAction.PUBLISHED, StatusAction.APPROVED)

        self.assertIn("Current or new status does not exist or is not active", str(context.exception))

    def test_alter_status_new_inactive(self):
        """Testa erro quando o novo status está inativo"""
        # Criar status atual
        Status.objects.create(
            name='Publicado',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.PUBLISHED,
            is_active=True
        )

        # Criar novo status inativo
        Status.objects.create(
            name='Aprovado',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.APPROVED,
            is_active=False
        )

        # Tentar alterar - deve falhar pois novo status está inativo
        with self.assertRaises(ValidationError) as context:
            Status.alter_status(TargetApp.WORKOUT, StatusAction.PUBLISHED, StatusAction.APPROVED)

        self.assertIn("Current or new status does not exist or is not active", str(context.exception))

    def test_alter_status_different_apps(self):
        """Testa que não altera status de apps diferentes"""
        # Criar status de WORKOUT
        Status.objects.create(
            name='Publicado Workout',
            app_name=TargetApp.WORKOUT,
            action=StatusAction.PUBLISHED,
            is_active=True
        )

        # Criar status de NUTRITION
        Status.objects.create(
            name='Aprovado Nutrition',
            app_name=TargetApp.NUTRITION,
            action=StatusAction.APPROVED,
            is_active=True
        )

        # Tentar alterar - deve falhar pois são apps diferentes
        with self.assertRaises(ValidationError) as context:
            Status.alter_status(TargetApp.WORKOUT, StatusAction.PUBLISHED, StatusAction.APPROVED)

        self.assertIn("Current or new status does not exist or is not active", str(context.exception))
