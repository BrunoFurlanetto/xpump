from django.test import TestCase
from django.urls import reverse, resolve
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from clients.models import Client
from gamification.models import Season
from workouts.views import (
    WorkoutCheckinsAPIView,
    WorkoutCheckinAPIView,
    WorkoutCheckinsByUserAPIView,
    WorkoutPlansAPIView,
    WorkoutPlanAPIView
)
from workouts.models import WorkoutCheckin, WorkoutPlan, WorkoutStreak
from status.models import Status
from profiles.models import Profile


class WorkoutURLsTest(TestCase):
    def setUp(self):
        """Configuração inicial para os testes de URLs"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.employer = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.season = Season.objects.create(
            name='Season 1',
            start_date=timezone.now() - timedelta(days=180),
            end_date=timezone.now() + timedelta(days=180),
            client=self.employer
        )

        Profile.objects.create(user=self.user, score=0, employer=self.employer)
        WorkoutStreak.objects.create(user=self.user)

        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

        self.checkin = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        self.plan = WorkoutPlan.objects.create(
            title='Plano Teste',
            start_plan=timezone.now().date(),
            end_plan=timezone.now().date() + timedelta(days=30)
        )

    def test_workout_list_url_resolves(self):
        """Testa se a URL da lista de workouts resolve corretamente"""
        url = reverse('workout-list')
        self.assertEqual(url, '/api/v1/workouts/')

        resolved = resolve(url)
        self.assertEqual(resolved.func.view_class, WorkoutCheckinsAPIView)

    def test_workout_detail_url_resolves(self):
        """Testa se a URL de detalhes do workout resolve corretamente"""
        url = reverse('workout-detail', kwargs={'pk': self.checkin.pk})
        self.assertEqual(url, f'/api/v1/workouts/{self.checkin.pk}/')

        resolved = resolve(url)
        self.assertEqual(resolved.func.view_class, WorkoutCheckinAPIView)

    def test_workout_by_user_url_resolves(self):
        """Testa se a URL de workouts por usuário resolve corretamente"""
        url = reverse('workout-by-user', kwargs={'user_id': self.user.id})
        self.assertEqual(url, f'/api/v1/workouts/user/{self.user.id}/')

        resolved = resolve(url)
        self.assertEqual(resolved.func.view_class, WorkoutCheckinsByUserAPIView)

    def test_workout_plans_list_url_resolves(self):
        """Testa se a URL da lista de planos resolve corretamente"""
        url = reverse('workout-plans-list')
        self.assertEqual(url, '/api/v1/workouts/plans/')

        resolved = resolve(url)
        self.assertEqual(resolved.func.view_class, WorkoutPlansAPIView)

    def test_workout_plan_detail_url_resolves(self):
        """Testa se a URL de detalhes do plano resolve corretamente"""
        url = reverse('workout-plan-detail', kwargs={'pk': self.plan.pk})
        self.assertEqual(url, f'/api/v1/workouts/plans/{self.plan.pk}/')

        resolved = resolve(url)
        self.assertEqual(resolved.func.view_class, WorkoutPlanAPIView)

    def test_all_url_names_exist(self):
        """Testa se todos os nomes de URLs estão definidos"""
        url_names = [
            'workout-list',
            'workout-detail',
            'workout-by-user',
            'workout-plans-list',
            'workout-plan-detail'
        ]

        for url_name in url_names:
            with self.subTest(url_name=url_name):
                try:
                    if url_name in ['workout-detail', 'workout-plan-detail']:
                        reverse(url_name, kwargs={'pk': 1})
                    elif url_name == 'workout-by-user':
                        reverse(url_name, kwargs={'user_id': 1})
                    else:
                        reverse(url_name)
                except Exception as e:
                    self.fail(f"URL name '{url_name}' not found: {e}")

    def test_url_patterns_coverage(self):
        """Testa se todas as views têm URLs correspondentes"""
        view_classes = [
            WorkoutCheckinsAPIView,
            WorkoutCheckinAPIView,
            WorkoutCheckinsByUserAPIView,
            WorkoutPlansAPIView,
            WorkoutPlanAPIView
        ]

        # Mapear URLs e verificar se todas as views estão cobertas
        url_patterns = [
            f'/api/v1/workouts/',
            f'/api/v1/workouts/{self.checkin.pk}/',
            f'/api/v1/workouts/user/{self.user.id}/',
            f'/api/v1/workouts/plans/',
            f'/api/v1/workouts/plans/{self.plan.pk}/'
        ]

        for pattern in url_patterns:
            with self.subTest(pattern=pattern):
                try:
                    resolved = resolve(pattern)
                    self.assertIn(resolved.func.view_class, view_classes)
                except Exception as e:
                    self.fail(f"URL pattern '{pattern}' failed to resolve: {e}")

    def test_url_parameters_validation(self):
        """Testa validação de parâmetros nas URLs"""
        # Testa parâmetros numéricos válidos
        valid_ids = [1, 999, self.checkin.pk, self.user.id]

        for valid_id in valid_ids:
            with self.subTest(id=valid_id):
                # URL de detalhes do workout
                url = reverse('workout-detail', kwargs={'pk': valid_id})
                self.assertTrue(url.endswith(f'{valid_id}/'))

                # URL de workouts por usuário
                url = reverse('workout-by-user', kwargs={'user_id': valid_id})
                self.assertTrue(url.endswith(f'user/{valid_id}/'))

                # URL de detalhes do plano
                url = reverse('workout-plan-detail', kwargs={'pk': valid_id})
                self.assertTrue(url.endswith(f'plans/{valid_id}/'))

    def test_url_namespace_consistency(self):
        """Testa consistência de namespace nas URLs"""
        # Todas as URLs devem começar com '/api/v1/workouts/'
        base_urls = [
            reverse('workout-list'),
            reverse('workout-detail', kwargs={'pk': 1}),
            reverse('workout-by-user', kwargs={'user_id': 1}),
            reverse('workout-plans-list'),
            reverse('workout-plan-detail', kwargs={'pk': 1})
        ]

        for url in base_urls:
            with self.subTest(url=url):
                self.assertTrue(url.startswith('/api/v1/workouts/'))

    def test_url_trailing_slash_consistency(self):
        """Testa consistência de trailing slash nas URLs"""
        # Todas as URLs devem terminar com '/'
        base_urls = [
            reverse('workout-list'),
            reverse('workout-detail', kwargs={'pk': 1}),
            reverse('workout-by-user', kwargs={'user_id': 1}),
            reverse('workout-plans-list'),
            reverse('workout-plan-detail', kwargs={'pk': 1})
        ]

        for url in base_urls:
            with self.subTest(url=url):
                self.assertTrue(url.endswith('/'))

    def test_url_pattern_specificity(self):
        """Testa especificidade dos padrões de URL"""
        # URLs mais específicas não devem ser confundidas com genéricas

        # '/workouts/plans/' deve resolver para planos, não para detalhes de workout
        plans_url = reverse('workout-plans-list')
        resolved = resolve(plans_url)
        self.assertEqual(resolved.func.view_class, WorkoutPlansAPIView)

        # '/workouts/user/1/' deve resolver para workouts por usuário
        user_workouts_url = reverse('workout-by-user', kwargs={'user_id': 1})
        resolved = resolve(user_workouts_url)
        self.assertEqual(resolved.func.view_class, WorkoutCheckinsByUserAPIView)

    def test_dynamic_url_parameters(self):
        """Testa parâmetros dinâmicos nas URLs"""
        # Criar diferentes objetos para testar
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='pass123'
        )

        Profile.objects.create(user=user2, score=0, employer=self.employer)
        WorkoutStreak.objects.create(user=user2)

        checkin2 = WorkoutCheckin.objects.create(
            user=user2,
            workout_date=timezone.now() - timedelta(hours=2),
            duration=timedelta(minutes=45)
        )

        plan2 = WorkoutPlan.objects.create(
            title='Segundo Plano',
            start_plan=timezone.now().date(),
            end_plan=timezone.now().date() + timedelta(days=60)
        )

        # Testar URLs com diferentes IDs
        test_cases = [
            ('workout-detail', {'pk': checkin2.pk}),
            ('workout-by-user', {'user_id': user2.id}),
            ('workout-plan-detail', {'pk': plan2.pk})
        ]

        for url_name, kwargs in test_cases:
            with self.subTest(url_name=url_name, kwargs=kwargs):
                url = reverse(url_name, kwargs=kwargs)
                resolved = resolve(url)
                self.assertEqual(resolved.kwargs, kwargs)
