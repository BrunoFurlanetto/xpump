from datetime import timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from workouts.models import WorkoutCheckin, WorkoutCheckinProof, WorkoutPlan, WorkoutStreak
from workouts.views import IsOwnerOrReadOnly
from status.models import Status
from profiles.models import Profile


class IsOwnerOrReadOnlyPermissionTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='testpass123'
        )

        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )

        Profile.objects.create(user=self.user1, score=0)
        Profile.objects.create(user=self.user2, score=0)
        WorkoutStreak.objects.create(user=self.user1)
        WorkoutStreak.objects.create(user=self.user2)

        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

        self.checkin = WorkoutCheckin.objects.create(
            user=self.user1,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

    def test_owner_can_modify_object(self):
        """Testa que o proprietário pode modificar o objeto"""
        permission = IsOwnerOrReadOnly()

        # Simular request de modificação do proprietário
        class MockRequest:
            method = 'PUT'
            user = self.user1

        request = MockRequest()
        has_permission = permission.has_object_permission(request, None, self.checkin)
        self.assertTrue(has_permission)

    def test_non_owner_cannot_modify_object(self):
        """Testa que não-proprietário não pode modificar o objeto"""
        permission = IsOwnerOrReadOnly()

        # Simular request de modificação de não-proprietário
        class MockRequest:
            method = 'PUT'
            user = self.user2

        request = MockRequest()
        has_permission = permission.has_object_permission(request, None, self.checkin)
        self.assertFalse(has_permission)

    def test_anyone_can_read_object(self):
        """Testa que qualquer um pode ler o objeto"""

        class MockRequest:
            def __init__(self, method_name, user):
                self.method = method_name
                self.user = user

        permission = IsOwnerOrReadOnly()
        safe_methods = ['GET', 'HEAD', 'OPTIONS']

        for method in safe_methods:
            with self.subTest(method_name=method):
                request = MockRequest(method, self.user2)
                self.assertTrue(
                    permission.has_object_permission(request, None, self.checkin)
                )

                request = MockRequest(method, self.user2)
                has_permission = permission.has_object_permission(request, None, self.checkin)
                self.assertTrue(has_permission)


class WorkoutCheckinsAPIViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        Profile.objects.create(user=self.user, score=0)
        WorkoutStreak.objects.create(user=self.user)

        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

        self.client = APIClient()
        self.url = reverse('workout-list')

    def test_unauthenticated_access_denied(self):
        """Testa que acesso não autenticado é negado"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_can_list_workouts(self):
        """Testa que usuário autenticado pode listar workouts"""
        self.client.force_authenticate(user=self.user)

        # Criar alguns check-ins
        WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=2),
            duration=timedelta(minutes=60)
        )
        WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=45)
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_workout_checkin_success(self):
        """Testa criação bem-sucedida de check-in"""
        self.client.force_authenticate(user=self.user)
        test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content",
            content_type="image/jpeg"
        )

        data = {
            'proof_files': [test_file],
            'comments': 'Treino de peito',
            'workout_date': timezone.now() - timedelta(hours=1),
            'duration': timedelta(minutes=60)
        }

        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WorkoutCheckin.objects.count(), 1)

        checkin = WorkoutCheckin.objects.first()
        self.assertEqual(checkin.user, self.user)

    def test_create_workout_checkin_with_files(self):
        """Testa criação de check-in com arquivos"""
        self.client.force_authenticate(user=self.user)
        test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content",
            content_type="image/jpeg"
        )

        data = {
            'comments': 'Treino com prova',
            'workout_date': timezone.now() - timedelta(hours=1),
            'duration': timedelta(minutes=45),
            'proof_files': [test_file]
        }

        response = self.client.post(self.url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        checkin = WorkoutCheckin.objects.first()
        self.assertEqual(checkin.proofs.count(), 1)

    def test_create_workout_checkin_validation_error(self):
        """Testa erro de validação na criação"""
        self.client.force_authenticate(user=self.user)

        # Data futura (deve gerar erro)
        data = {
            'workout_date': timezone.now() + timedelta(days=1),
            'duration': timedelta(minutes=60)
        }

        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_create_workout_checkin_invalid_data(self):
        """Testa criação com dados inválidos"""
        self.client.force_authenticate(user=self.user)

        data = {
            'workout_date': 'invalid_date',
            'duration': 'invalid_duration'
        }

        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class WorkoutCheckinAPIViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )

        Profile.objects.create(user=self.user, score=0)
        Profile.objects.create(user=self.other_user, score=0)
        WorkoutStreak.objects.create(user=self.user)
        WorkoutStreak.objects.create(user=self.other_user)

        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

        self.checkin = WorkoutCheckin.objects.create(
            user=self.user,
            comments='Treino original',
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        self.client = APIClient()
        self.url = reverse('workout-detail', kwargs={'pk': self.checkin.pk})

    def test_retrieve_workout_checkin(self):
        """Testa recuperação de check-in específico"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.checkin.id)

    def test_owner_can_update_comments(self):
        """Testa que proprietário pode atualizar comentários"""
        self.client.force_authenticate(user=self.user)

        data = {'comments': 'Comentário atualizado'}
        response = self.client.patch(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.checkin.refresh_from_db()
        self.assertEqual(self.checkin.comments, 'Comentário atualizado')

    def test_non_owner_cannot_update(self):
        """Testa que não-proprietário não pode atualizar"""
        self.client.force_authenticate(user=self.other_user)

        data = {'comments': 'Tentativa de atualização'}
        response = self.client.patch(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_other_fields_forbidden(self):
        """Testa que outros campos não podem ser atualizados"""
        self.client.force_authenticate(user=self.user)

        data = {
            'comments': 'Novo comentário',
            'duration': timedelta(minutes=90)
        }

        response = self.client.patch(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_delete(self):
        """Testa que proprietário pode deletar"""
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WorkoutCheckin.objects.filter(pk=self.checkin.pk).exists())

    def test_non_owner_cannot_delete(self):
        """Testa que não-proprietário não pode deletar"""
        self.client.force_authenticate(user=self.other_user)

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class WorkoutCheckinsByUserAPIViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        Profile.objects.create(user=self.user, score=0)
        WorkoutStreak.objects.create(user=self.user)

        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

        # Criar check-ins em diferentes datas com intervalos maiores para evitar sobreposição
        self.checkin1 = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(days=2),
            duration=timedelta(minutes=60)
        )

        self.checkin2 = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(days=1, hours=12),  # Maior intervalo
            duration=timedelta(minutes=45)
        )

        self.client = APIClient()
        self.url = reverse('workout-by-user', kwargs={'user_id': self.user.id})

    def test_get_user_workouts_ordered_by_date(self):
        """Testa recuperação de workouts do usuário ordenados por data"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Verificar ordenação (mais recente primeiro)
        dates = [item['workout_date'] for item in response.data]
        self.assertGreater(dates[0], dates[1])

    def test_only_authenticated_access(self):
        """Testa que apenas usuários autenticados podem acessar"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_result_for_user_without_workouts(self):
        """Testa resultado vazio para usuário sem workouts"""
        user_no_workouts = User.objects.create_user(
            username='noworkouts',
            email='no@example.com',
            password='testpass123',
            id=2,
        )

        url = reverse('workout-by-user', kwargs={'user_id': user_no_workouts.id})
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)


class WorkoutPlansAPIViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        Profile.objects.create(user=self.user, score=0)

        self.plan1 = WorkoutPlan.objects.create(
            title='Plano de Hipertrofia',
            start_plan=timezone.now().date(),
            end_plan=timezone.now().date() + timedelta(days=30)
        )

        self.plan2 = WorkoutPlan.objects.create(
            title='Plano de Definição',
            start_plan=timezone.now().date(),
            end_plan=timezone.now().date() + timedelta(days=60),
            is_active=False
        )

        self.client = APIClient()
        self.url = reverse('workout-plans-list')

    def test_list_all_workout_plans(self):
        """Testa listagem de todos os planos"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_unauthenticated_access_denied(self):
        """Testa que acesso não autenticado é negado"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_includes_inactive_plans(self):
        """Testa que planos inativos também são incluídos"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        plan_titles = [plan['title'] for plan in response.data]
        self.assertIn('Plano de Hipertrofia', plan_titles)
        self.assertIn('Plano de Definição', plan_titles)


class WorkoutPlanAPIViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            is_superuser=True
        )

        Profile.objects.create(user=self.user, score=0)

        self.plan = WorkoutPlan.objects.create(
            title='Plano Teste',
            start_plan=timezone.now().date(),
            end_plan=timezone.now().date() + timedelta(days=30)
        )

        self.client = APIClient()
        self.url = reverse('workout-plan-detail', kwargs={'pk': self.plan.pk})

    def test_retrieve_workout_plan(self):
        """Testa recuperação de plano específico"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.plan.id)
        self.assertEqual(response.data['title'], 'Plano Teste')

    def test_update_workout_plan(self):
        """Testa atualização de plano"""
        self.client.force_authenticate(user=self.user)

        data = {'title': 'Plano Atualizado'}
        response = self.client.patch(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.plan.refresh_from_db()
        self.assertEqual(self.plan.title, 'Plano Atualizado')

    def test_delete_workout_plan(self):
        """Testa exclusão de plano"""
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WorkoutPlan.objects.filter(pk=self.plan.pk).exists())

    def test_unauthenticated_access_denied(self):
        """Testa que acesso não autenticado é negado"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_plan_returns_404(self):
        """Testa que plano inexistente retorna 404"""
        self.client.force_authenticate(user=self.user)

        url = reverse('workout-plan-detail', kwargs={'pk': 9999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class WorkoutViewsIntegrationTest(APITestCase):
    """Testes de integração para as views de workout"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        Profile.objects.create(user=self.user, score=0)
        WorkoutStreak.objects.create(user=self.user)

        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

        self.client = APIClient()

    def test_complete_workout_flow(self):
        """Testa fluxo completo de workout"""
        self.client.force_authenticate(user=self.user)

        test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content",
            content_type="image/jpeg"
        )

        # 1. Criar check-in
        create_data = {
            'proof_files': [test_file],
            'comments': 'Treino completo',
            'workout_date': timezone.now() - timedelta(hours=1),
            'duration': timedelta(minutes=60)
        }

        create_response = self.client.post(reverse('workout-list'), create_data)
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        checkin_id = create_response.data['id']

        # 2. Recuperar check-in criado
        detail_response = self.client.get(
            reverse('workout-detail', kwargs={'pk': checkin_id})
        )
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)

        # 3. Atualizar comentários
        update_data = {'comments': 'Treino atualizado'}
        update_response = self.client.patch(
            reverse('workout-detail', kwargs={'pk': checkin_id}),
            update_data
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)

        # 4. Verificar em lista de usuário
        user_list_response = self.client.get(
            reverse('workout-by-user', kwargs={'user_id': self.user.id})
        )
        self.assertEqual(user_list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(user_list_response.data), 1)

        # 5. Deletar check-in
        delete_response = self.client.delete(
            reverse('workout-detail', kwargs={'pk': checkin_id})
        )
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

    def test_streak_calculation_through_api(self):
        """Testa cálculo de streak através da API"""
        self.client.force_authenticate(user=self.user)

        # Criar múltiplos check-ins para testar streak
        for i in range(3):
            test_file = SimpleUploadedFile(
                "test_image.jpg",
                b"file_content",
                content_type="image/jpeg"
            )

            data = {
                'proof_files': [test_file],
                'workout_date': timezone.now() - timedelta(days=i),
                'duration': timedelta(minutes=60)
            }

            response = self.client.post(reverse('workout-list'), data, format='multipart')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verificar streak no último check-in
        last_checkin_response = self.client.get(reverse('workout-list'))
        self.assertEqual(last_checkin_response.status_code, status.HTTP_200_OK)

        # Pelo menos um check-in deve ter streak > 0
        has_streak = any(
            item['current_streak'] > 0
            for item in last_checkin_response.data
        )
        self.assertTrue(has_streak)
