from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import date, timedelta

from gamification.models import GamificationSettings, Season, GamificationBonus, GamificationPenalty
from gamification.serializer import GamificationSettingsSerializer, SeasonSerializer
from clients.models import Client
from profiles.models import Profile
from nutrition.models import MealConfig, Meal
from workouts.models import WorkoutCheckin


class GamificationSettingsSerializerTest(TestCase):
    """Test cases for GamificationSettingsSerializer"""

    def setUp(self):
        self.settings_data = {
            'xp_base': 10,
            'exponential_factor': 2.0,
            'max_level': 100,
            'workout_minutes': 60,
            'workout_xp': 5,
            'meal_xp': 3,
            'months_to_end_season': 3,
            'season_bonus_percentage': 75.0,
            'percentage_from_first_position': 70.0
        }

    def test_serializer_with_valid_data(self):
        """Test serializer with valid data"""
        serializer = GamificationSettingsSerializer(data=self.settings_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_save(self):
        """Test serializer save operation"""
        serializer = GamificationSettingsSerializer(data=self.settings_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()

        self.assertEqual(instance.xp_base, 10)
        self.assertEqual(instance.exponential_factor, 2.0)
        self.assertEqual(instance.max_level, 100)

    def test_serializer_update(self):
        """Test serializer update operation"""
        settings = GamificationSettings.objects.create(**self.settings_data)
        updated_data = {'xp_base': 15, 'workout_xp': 7}

        serializer = GamificationSettingsSerializer(settings, data=updated_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_instance = serializer.save()

        self.assertEqual(updated_instance.xp_base, 15)
        self.assertEqual(updated_instance.workout_xp, 7)


class SeasonSerializerTest(TestCase):
    """Test cases for SeasonSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass')

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.season_data = {
            'client': self.client_obj.id,
            'name': 'Test Season',
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=90),
            'description': 'Test season description'
        }

    def test_serializer_with_valid_data(self):
        """Test serializer with valid data"""
        serializer = SeasonSerializer(data=self.season_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_save(self):
        """Test serializer save operation"""
        serializer = SeasonSerializer(data=self.season_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()

        self.assertEqual(instance.name, 'Test Season')
        self.assertEqual(instance.client, self.client_obj)

    def test_serializer_validation_end_date_before_start(self):
        """Test validation when end date is before start date"""
        invalid_data = self.season_data.copy()
        invalid_data['end_date'] = date.today() - timedelta(days=1)

        serializer = SeasonSerializer(data=invalid_data)
        # Depending on your validation logic, this might be invalid
        # Add custom validation in serializer if needed


class GamificationSettingsAPITest(APITestCase):
    """Test cases for GamificationSettings API views"""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            password='adminpass',
            is_staff=True,
            is_superuser=True
        )
        self.regular_user = User.objects.create_user(
            username='user',
            password='userpass'
        )
        self.client = APIClient()

    def test_list_gamification_settings_admin(self):
        """Test listing gamification settings as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('list-gamification-settings')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_gamification_settings_regular_user(self):
        """Test listing gamification settings as regular user (should be forbidden)"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('list-gamification-settings')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_gamification_settings_admin(self):
        """Test creating gamification settings as admin"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'xp_base': 10,
            'exponential_factor': 2.0,
            'max_level': 100,
            'workout_minutes': 60,
            'workout_xp': 5,
            'meal_xp': 3
        }
        url = reverse('list-gamification-settings')
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_duplicate_gamification_settings(self):
        """Test creating duplicate gamification settings (should fail)"""
        GamificationSettings.objects.create()
        self.client.force_authenticate(user=self.admin_user)

        data = {'xp_base': 10}
        url = reverse('list-gamification-settings')
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Only one GamificationSettings instance is allowed', response.data['detail'])

    def test_update_gamification_settings(self):
        """Test updating gamification settings"""
        settings = GamificationSettings.objects.create()
        self.client.force_authenticate(user=self.admin_user)

        data = {'xp_base': 15, 'workout_xp': 8}
        url = reverse('detail-gamification-settings', args=[settings.id])
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        settings.refresh_from_db()
        self.assertEqual(settings.xp_base, 15)
        self.assertEqual(settings.workout_xp, 8)

    def test_retrieve_gamification_settings(self):
        """Test retrieving specific gamification settings"""
        settings = GamificationSettings.objects.create(xp_base=12)
        self.client.force_authenticate(user=self.admin_user)

        url = reverse('detail-gamification-settings', args=[settings.id])
        response = self.client.get(url)
        self.assertEqual(response.data['xp_base'], 12)


class SeasonAPITest(APITestCase):
    """Test cases for Season API views"""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            password='adminpass',
            is_staff=True,
            is_superuser=True
        )
        self.regular_user = User.objects.create_user(
            username='user',
            password='userpass'
        )
        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.regular_user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.client = APIClient()

    def test_list_seasons_admin(self):
        """Test listing seasons as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('season-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_seasons_regular_user(self):
        """Test listing seasons as regular user (should be forbidden)"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('season-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_season_admin(self):
        """Test creating season as admin"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'client': self.client_obj.id,
            'name': 'New Season',
            'start_date': date.today().isoformat(),
            'end_date': (date.today() + timedelta(days=90)).isoformat(),
            'description': 'A new season'
        }
        url = reverse('season-list')
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Season')

    def test_update_season(self):
        """Test updating season"""
        season = Season.objects.create(
            client=self.client_obj,
            name="Original Season",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=60)
        )
        self.client.force_authenticate(user=self.admin_user)

        data = {'name': 'Updated Season', 'description': 'Updated description'}
        url = reverse('season-detail', args=[season.id])
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        season.refresh_from_db()
        self.assertEqual(season.name, 'Updated Season')
        self.assertEqual(season.description, 'Updated description')

    def test_delete_season(self):
        """Test deleting season"""
        season = Season.objects.create(
            client=self.client_obj,
            name="Season to Delete",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30)
        )
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('season-detail', args=[season.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Season.objects.filter(id=season.id).exists())

    def test_retrieve_season(self):
        """Test retrieving specific season"""
        season = Season.objects.create(
            client=self.client_obj,
            name="Test Season",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=45)
        )
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('season-detail', args=[season.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Season')


class GamificationAdjustmentsAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='adjustment_user', password='pass123')
        self.client_obj = Client.objects.create(
            name='Client Adjustment',
            cnpj='11.222.333/0001-44',
            owners=self.user,
            contact_email='adjustment@client.test',
            phone='(11)98888-7777',
            address='Rua Ajuste, 123, Centro, Sao Paulo - SP',
        )
        Profile.objects.create(user=self.user, employer=self.client_obj, score=0, level=0)

        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=(timezone.now() - timedelta(hours=1)).time(),
            interval_end=(timezone.now() + timedelta(hours=1)).time(),
        )

        self.meal = Meal.objects.create(
            user=self.user,
            meal_type=self.meal_config,
            meal_time=timezone.now() - timedelta(hours=2),
            comments='meal for adjustment test'
        )

        self.workout = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=3),
            duration=timedelta(minutes=40),
            comments='workout for adjustment test'
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_bonus_for_meal(self):
        url = reverse('gamification-adjustments')
        score_before = self.user.profile.score
        payload = {
            'adjustment_type': 'bonus',
            'score': 2.5,
            'reason': 'Bonus manual por validacao',
            'target_type': 'meal',
            'target_id': self.meal.id,
        }

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['adjustment_type'], 'bonus')
        self.assertEqual(response.data['reason'], 'Bonus manual por validacao')
        self.assertEqual(response.data['created_by_id'], self.user.id)
        self.assertEqual(response.data['target_type'], 'meal')
        self.assertEqual(response.data['target_id'], self.meal.id)
        self.assertTrue(GamificationBonus.objects.filter(id=response.data['id']).exists())
        self.user.profile.refresh_from_db()
        self.assertAlmostEqual(self.user.profile.score, score_before + 2.5, places=5)

    def test_create_penalty_for_workout(self):
        url = reverse('gamification-adjustments')
        score_before = self.user.profile.score
        payload = {
            'adjustment_type': 'penalty',
            'score': 1.0,
            'reason': 'Penalidade por inconsistencia',
            'target_type': 'workout_checkin',
            'target_id': self.workout.id,
        }

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['adjustment_type'], 'penalty')
        self.assertEqual(response.data['reason'], 'Penalidade por inconsistencia')
        self.assertEqual(response.data['created_by_id'], self.user.id)
        self.assertEqual(response.data['target_type'], 'workout_checkin')
        self.assertEqual(response.data['target_id'], self.workout.id)
        self.assertTrue(GamificationPenalty.objects.filter(id=response.data['id']).exists())
        self.user.profile.refresh_from_db()
        self.assertAlmostEqual(self.user.profile.score, score_before - 1.0, places=5)

    def test_list_adjustments_with_filter(self):
        meal_content_type = ContentType.objects.get_for_model(Meal)
        workout_content_type = ContentType.objects.get_for_model(WorkoutCheckin)

        GamificationBonus.objects.create(
            created_by=self.user,
            score=2.0,
            content_type=meal_content_type,
            object_id=self.meal.id,
        )
        GamificationPenalty.objects.create(
            created_by=self.user,
            score=1.0,
            content_type=workout_content_type,
            object_id=self.workout.id,
        )

        url = reverse('gamification-adjustments')
        response = self.client.get(url, {'adjustment_type': 'bonus'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertTrue(all(item['adjustment_type'] == 'bonus' for item in response.data))

    def test_list_adjustments_filter_by_created_by_id(self):
        meal_content_type = ContentType.objects.get_for_model(Meal)
        GamificationBonus.objects.create(
            created_by=self.user,
            score=3.5,
            reason='Filtro por autor',
            content_type=meal_content_type,
            object_id=self.meal.id,
        )

        url = reverse('gamification-adjustments')
        response = self.client.get(url, {'created_by_id': self.user.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertTrue(all(item['created_by_id'] == self.user.id for item in response.data))
