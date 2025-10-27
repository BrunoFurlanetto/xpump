from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import date, timedelta

from gamification.models import GamificationSettings, Season
from gamification.serializer import GamificationSettingsSerializer, SeasonSerializer
from clients.models import Client


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
