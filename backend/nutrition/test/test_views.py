import json
from datetime import datetime, date, time, timedelta

from django.utils import timezone

from clients.models import Client
from gamification.models import Season
from profiles.models import Profile

from django.urls import reverse
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, Mock

from nutrition.models import Meal, MealConfig, NutritionPlan, MealStreak, meal_choices
from status.models import Status


class NutritionViewsTestCase(APITestCase):
    """
    Test cases for nutrition views covering authentication, permissions,
    and business logic validation.
    """

    def setUp(self):
        """
        Set up test data including users, meal configurations, and status objects.
        """
        # Create test users
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )

        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='otherpass123'
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

        # Create mock profile for users (assuming profile exists)
        for user in [self.user, self.superuser, self.other_user]:
            if not hasattr(user, 'profile'):
                profile = Profile.objects.create(user=user, employer=self.employer)

        # Create meal configurations
        self.breakfast_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(6, 0),
            interval_end=time(10, 0),
            description='Morning meal'
        )

        self.lunch_config = MealConfig.objects.create(
            meal_name='lunch',
            interval_start=time(11, 0),
            interval_end=time(15, 0),
            description='Afternoon meal'
        )

        # Create status object
        self.status = Status.objects.create(
            name='Aceito',
            app_name='NUTRITION',
            action='PUBLISHED'
        )

        # Create nutrition plan
        self.nutrition_plan = NutritionPlan.objects.create(
            title='Test Nutrition Plan',
            is_active=True,
            start_plan=date.today(),
            end_plan=date(2024, 12, 31),
            lifetime=False
        )

        self.client = APIClient()

    def test_meal_choices_api_view(self):
        """Test meal choices endpoint returns correct data"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meal-choices')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), len(meal_choices))

        # Check structure of response
        for item in response.data:
            self.assertIn('value', item)
            self.assertIn('label', item)

    def test_meal_choices_unauthenticated(self):
        """Test meal choices endpoint requires authentication"""
        url = reverse('meal-choices')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MealTypesAPIViewTestCase(APITestCase):
    """Test cases for meal types (MealConfig) endpoints"""

    def setUp(self):
        self.user = User.objects.create_user('user', 'user@test.com', 'pass')
        self.superuser = User.objects.create_superuser('admin', 'admin@test.com', 'pass')

        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(6, 0),
            interval_end=time(10, 0)
        )
        self.client = APIClient()

    def test_list_meal_types_authenticated(self):
        """Test listing meal configurations as authenticated user"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meal-configs-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_meal_types_unauthenticated(self):
        """Test listing meal configurations without authentication"""
        url = reverse('meal-configs-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_meal_type_as_superuser(self):
        """Test creating meal configuration as superuser"""
        self.client.force_authenticate(user=self.superuser)
        url = reverse('meal-configs-list')
        data = {
            'meal_name': 'dinner',
            'interval_start': '18:00:00',
            'interval_end': '22:00:00',
            'description': 'Evening meal'
        }
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MealConfig.objects.count(), 2)

    def test_create_meal_type_as_regular_user(self):
        """Test creating meal configuration as regular user should fail"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meal-configs-list')
        data = {
            'meal_name': 'dinner',
            'interval_start': '18:00:00',
            'interval_end': '22:00:00'
        }
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_meal_type_as_superuser(self):
        """Test updating meal configuration as superuser"""
        self.client.force_authenticate(user=self.superuser)
        url = reverse('meal-config-detail', args=[self.meal_config.pk])
        data = {'description': 'Updated description'}

        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_meal_type_as_regular_user(self):
        """Test updating meal configuration as regular user should fail"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meal-config-detail', args=[self.meal_config.pk])
        data = {'description': 'Updated description'}

        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_meal_type_as_superuser(self):
        """Test deleting meal configuration as superuser"""
        self.client.force_authenticate(user=self.superuser)
        url = reverse('meal-config-detail', args=[self.meal_config.pk])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(MealConfig.objects.count(), 0)

    def test_delete_meal_type_as_regular_user(self):
        """Test deleting meal configuration as regular user should fail"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meal-config-detail', args=[self.meal_config.pk])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MealsAPIViewTestCase(APITestCase):
    """Test cases for meal entries endpoints"""

    def setUp(self):
        self.user = User.objects.create_user('user', 'user@test.com', 'pass')
        self.other_user = User.objects.create_user('other', 'other@test.com', 'pass')

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

        # Mock profile for users
        for user in [self.user, self.other_user]:
            Profile.objects.create(user=user, employer=self.employer)

        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(6, 0),
            interval_end=time(10, 0)
        )

        self.status = Status.objects.create(
            name='Aceito',
            app_name='NUTRITION',
            action='PUBLISHED'
        )

        self.client = APIClient()

    @patch('nutrition.models.MealStreak.objects.create')
    @patch('nutrition.models.Status.objects.get_or_create')
    def test_create_meal_success(self, mock_status, mock_streak):
        """Test successful meal creation"""
        mock_status.return_value = (self.status, True)

        self.client.force_authenticate(user=self.user)
        url = reverse('meals-list')

        # Create a valid datetime within meal interval
        meal_time = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)

        data = {
            'meal_type': self.meal_config.pk,
            'meal_time': meal_time.isoformat(),
            'comments': 'Test meal'
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Meal.objects.count(), 1)

        meal = Meal.objects.first()
        self.assertEqual(meal.user, self.user)
        self.assertEqual(meal.comments, 'Test meal')

    def test_create_meal_unauthenticated(self):
        """Test meal creation without authentication"""
        url = reverse('meals-list')
        data = {
            'meal_type': self.meal_config.pk,
            'meal_time': datetime.now().isoformat()
        }

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('nutrition.models.Status.objects.get_or_create')
    def test_create_meal_with_files(self, mock_status):
        """Test meal creation with proof files"""
        mock_status.return_value = (self.status, True)

        self.client.force_authenticate(user=self.user)
        url = reverse('meals-list')

        # Create mock image file
        image_file = SimpleUploadedFile(
            "test_image.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )

        meal_time = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)

        data = {
            'meal_type': self.meal_config.pk,
            'meal_time': meal_time.isoformat(),
            'proof_files': [image_file]
        }

        response = self.client.post(url, data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_meals_authenticated(self):
        """Test listing meals as authenticated user"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-list')

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_meals_unauthenticated(self):
        """Test listing meals without authentication"""
        url = reverse('meals-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MealDetailAPIViewTestCase(APITestCase):
    """Test cases for individual meal operations"""

    def setUp(self):
        self.user = User.objects.create_user('user', 'user@test.com', 'pass')
        self.other_user = User.objects.create_user('other', 'other@test.com', 'pass')

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

        # Mock profile
        for user in [self.user, self.other_user]:
            Profile.objects.create(user=user, employer=self.employer)

        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(6, 0),
            interval_end=time(10, 0)
        )

        self.status = Status.objects.create(
            name='Aceito',
            app_name='NUTRITION',
            action='PUBLISHED'
        )

        # Create meal streak for user
        self.meal_streak = MealStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=10
        )

        self.meal = Meal.objects.create(
            user=self.user,
            meal_type=self.meal_config,
            meal_time=datetime.now().replace(hour=8),
            validation_status=self.status,
            base_points=10.0
        )

        self.client = APIClient()

    def test_retrieve_meal_as_owner(self):
        """Test retrieving meal as the owner"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meal-detail', args=[self.meal.pk])

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.meal.pk)

    def test_retrieve_meal_as_other_user(self):
        """Test retrieving meal as different user (should work - read-only)"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('meal-detail', args=[self.meal.pk])

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_meal_comments_as_owner(self):
        """Test updating meal comments as owner"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meal-detail', args=[self.meal.pk])

        data = {'comments': 'Updated comments'}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.meal.refresh_from_db()
        self.assertEqual(self.meal.comments, 'Updated comments')

    def test_update_meal_as_other_user(self):
        """Test updating meal as different user should fail"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('meal-detail', args=[self.meal.pk])

        data = {'comments': 'Hacked comments'}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_meal_as_owner(self):
        """Test deleting meal as owner"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meal-detail', args=[self.meal.pk])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Meal.objects.count(), 0)

    def test_delete_meal_as_other_user(self):
        """Test deleting meal as different user should fail"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('meal-detail', args=[self.meal.pk])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MealsByUserAPIViewTestCase(APITestCase):
    """Test cases for user-specific meal listing"""

    def setUp(self):
        self.user = User.objects.create_user('user', 'user@test.com', 'pass')
        self.other_user = User.objects.create_user('other', 'other@test.com', 'pass')

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

        # Mock profiles
        for user in [self.user, self.other_user]:
            Profile.objects.create(user=user, employer=self.employer)

        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(6, 0),
            interval_end=time(10, 0)
        )

        self.status = Status.objects.create(
            name='Aceito',
            app_name='NUTRITION',
            action='PUBLISHED'
        )

        # Create meals for different users
        self.user_meal = Meal.objects.create(
            user=self.user,
            meal_type=self.meal_config,
            meal_time=datetime.now().replace(hour=8),
            validation_status=self.status
        )

        self.other_user_meal = Meal.objects.create(
            user=self.other_user,
            meal_type=self.meal_config,
            meal_time=datetime.now().replace(hour=9),
            validation_status=self.status
        )

        self.client = APIClient()

    def test_list_meals_by_user(self):
        """Test listing meals for specific user"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user', args=[self.user.pk])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.user_meal.pk)

    def test_list_meals_by_user_unauthenticated(self):
        """Test listing meals without authentication"""
        url = reverse('meals-by-user', args=[self.user.pk])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NutritionPlansAPIViewTestCase(APITestCase):
    """Test cases for nutrition plans endpoints"""

    def setUp(self):
        self.user = User.objects.create_user('user', 'user@test.com', 'pass')
        self.superuser = User.objects.create_superuser('admin', 'admin@test.com', 'pass')

        self.nutrition_plan = NutritionPlan.objects.create(
            title='Test Plan',
            is_active=True,
            start_plan=date.today(),
            end_plan=date(2024, 12, 31)
        )

        self.client = APIClient()

    def test_list_nutrition_plans_authenticated(self):
        """Test listing nutrition plans as authenticated user"""
        self.client.force_authenticate(user=self.user)
        url = reverse('nutrition-plans-list')

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_nutrition_plans_unauthenticated(self):
        """Test listing nutrition plans without authentication"""
        url = reverse('nutrition-plans-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_nutrition_plan_authenticated(self):
        """Test creating nutrition plan as authenticated user"""
        self.client.force_authenticate(user=self.user)
        url = reverse('nutrition-plans-list')

        # Create mock PDF file
        pdf_file = SimpleUploadedFile(
            "test_plan.pdf",
            b"fake pdf content",
            content_type="application/pdf"
        )

        data = {
            'title': 'New Plan',
            'is_active': True,
            'pdf_file': pdf_file,
            'start_plan': date.today().isoformat(),
            'end_plan': date(2024, 12, 31).isoformat(),
            'lifetime': False
        }

        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_nutrition_plan_as_superuser(self):
        """Test updating nutrition plan as superuser"""
        self.client.force_authenticate(user=self.superuser)
        url = reverse('nutrition-plan-detail', args=[self.nutrition_plan.pk])

        data = {'title': 'Updated Plan'}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_nutrition_plan_as_regular_user(self):
        """Test updating nutrition plan as regular user should fail"""
        self.client.force_authenticate(user=self.user)
        url = reverse('nutrition-plan-detail', args=[self.nutrition_plan.pk])

        data = {'title': 'Hacked Plan'}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_nutrition_plan_as_superuser(self):
        """Test deleting nutrition plan as superuser"""
        self.client.force_authenticate(user=self.superuser)
        url = reverse('nutrition-plan-detail', args=[self.nutrition_plan.pk])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_nutrition_plan_as_regular_user(self):
        """Test deleting nutrition plan as regular user should fail"""
        self.client.force_authenticate(user=self.user)
        url = reverse('nutrition-plan-detail', args=[self.nutrition_plan.pk])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ValidationTestCase(APITestCase):
    """Test cases for business logic validation"""

    def setUp(self):
        self.user = User.objects.create_user('user', 'user@test.com', 'pass')

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

        Profile.objects.create(user=self.user, employer=self.employer)

        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(6, 0),
            interval_end=time(10, 0)
        )

        self.status = Status.objects.create(
            name='Aceito',
            app_name='NUTRITION',
            action='PUBLISHED'
        )

        self.client = APIClient()

    @patch('nutrition.models.Status.objects.get_or_create')
    def test_meal_time_validation_outside_interval(self, mock_status):
        """Test meal creation outside configured time interval"""
        mock_status.return_value = (self.status, True)

        self.client.force_authenticate(user=self.user)
        url = reverse('meals-list')

        # Try to create meal outside interval (5 AM, but interval is 6-10 AM)
        invalid_time = datetime.now().replace(hour=5, minute=0, second=0, microsecond=0)

        data = {
            'meal_type': self.meal_config.pk,
            'meal_time': invalid_time.isoformat()
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('nutrition.models.Status.objects.get_or_create')
    def test_duplicate_meal_validation(self, mock_status):
        """Test preventing duplicate meals for same type on same day"""
        mock_status.return_value = (self.status, True)

        # Create first meal
        Meal.objects.create(
            user=self.user,
            meal_type=self.meal_config,
            meal_time=datetime.now().replace(hour=8),
            validation_status=self.status
        )

        self.client.force_authenticate(user=self.user)
        url = reverse('meals-list')

        # Try to create duplicate meal same day
        duplicate_time = datetime.now().replace(hour=9)  # Same day, different hour

        data = {
            'meal_type': self.meal_config.pk,
            'meal_time': duplicate_time.isoformat()
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MealsByUserByIntervalDateAPIViewTestCase(APITestCase):
    """Test cases for meals by user filtered by date interval"""

    def setUp(self):
        """Set up test data for interval date tests"""
        self.user = User.objects.create_user('testuser', 'test@example.com', 'testpass')
        self.other_user = User.objects.create_user('otheruser', 'other@example.com', 'otherpass')

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

        # Create profiles
        for user in [self.user, self.other_user]:
            Profile.objects.create(user=user, employer=self.employer)

        # Create meal configurations
        self.breakfast_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(6, 0),
            interval_end=time(10, 0),
            description='Morning meal'
        )

        self.lunch_config = MealConfig.objects.create(
            meal_name='lunch',
            interval_start=time(11, 0),
            interval_end=time(15, 0),
            description='Afternoon meal'
        )

        # Create status
        self.status = Status.objects.create(
            name='Aceito',
            app_name='NUTRITION',
            action='PUBLISHED'
        )

        # Create meal streaks
        MealStreak.objects.create(user=self.user, current_streak=1, longest_streak=1)
        MealStreak.objects.create(user=self.other_user, current_streak=1, longest_streak=1)

        # Create test meals for different dates
        self.meal1 = Meal.objects.create(
            user=self.user,
            meal_type=self.breakfast_config,
            meal_time=datetime(2024, 1, 15, 8, 0),  # January 15
            validation_status=self.status,
            comments="Breakfast on Jan 15"
        )

        self.meal2 = Meal.objects.create(
            user=self.user,
            meal_type=self.lunch_config,
            meal_time=datetime(2024, 1, 20, 12, 0),  # January 20
            validation_status=self.status,
            comments="Lunch on Jan 20"
        )

        self.meal3 = Meal.objects.create(
            user=self.user,
            meal_type=self.breakfast_config,
            meal_time=datetime(2024, 2, 5, 8, 30),  # February 5 (outside interval)
            validation_status=self.status,
            comments="Breakfast on Feb 5"
        )

        # Meal from other user (should not appear in results)
        self.meal_other_user = Meal.objects.create(
            user=self.other_user,
            meal_type=self.breakfast_config,
            meal_time=datetime(2024, 1, 16, 8, 0),
            validation_status=self.status,
            comments="Other user's meal"
        )

        self.client = APIClient()

    def test_get_meals_by_user_by_interval_authenticated(self):
        """Test getting meals by user ID within date interval as authenticated user"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user-by-interval', args=[self.user.pk, '2024-01-01', '2024-01-31'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Should return meal1 and meal2

        # Check meals are ordered by meal_time descending (most recent first)
        self.assertEqual(response.data[0]['id'], self.meal2.id)  # Jan 20 (more recent)
        self.assertEqual(response.data[1]['id'], self.meal1.id)  # Jan 15

    def test_get_meals_by_user_by_interval_unauthenticated(self):
        """Test getting meals by user ID within date interval without authentication should fail"""
        url = reverse('meals-by-user-by-interval', args=[self.user.pk, '2024-01-01', '2024-01-31'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_meals_by_interval_excludes_outside_dates(self):
        """Test that meals outside the date interval are excluded"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user-by-interval', args=[self.user.pk, '2024-01-01', '2024-01-31'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Ensure February meal is not included
        meal_ids = [meal['id'] for meal in response.data]
        self.assertNotIn(self.meal3.id, meal_ids)

    def test_get_meals_by_interval_different_user(self):
        """Test getting meals for different user"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user-by-interval', args=[self.other_user.pk, '2024-01-01', '2024-01-31'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Should return only other_user's meal
        self.assertEqual(response.data[0]['id'], self.meal_other_user.id)

    def test_get_meals_empty_interval(self):
        """Test getting meals for date interval with no meals"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user-by-interval', args=[self.user.pk, '2024-03-01', '2024-03-31'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_get_meals_single_day_interval(self):
        """Test getting meals for single day interval"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user-by-interval', args=[self.user.pk, '2024-01-15', '2024-01-15'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.meal1.id)

    def test_get_meals_reverse_date_order(self):
        """Test with end_date before initial_date (should return no results)"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user-by-interval', args=[self.user.pk, '2024-01-31', '2024-01-01'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_get_meals_nonexistent_user(self):
        """Test getting meals for non-existent user ID"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user-by-interval', args=[99999, '2024-01-01', '2024-01-31'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_get_meals_response_structure(self):
        """Test that response has correct structure and fields"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user-by-interval', args=[self.user.pk, '2024-01-01', '2024-01-31'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        if response.data:
            meal_data = response.data[0]
            expected_fields = ['id', 'user', 'meal_type', 'meal_time', 'comments', 'validation_status', 'base_points', 'multiplier']
            for field in expected_fields:
                self.assertIn(field, meal_data, f"Field '{field}' should be in response")

    def test_meals_ordered_correctly(self):
        """Test that meals are ordered by meal_time descending"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user-by-interval', args=[self.user.pk, '2024-01-01', '2024-01-31'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        if len(response.data) > 1:
            # Check that meals are ordered by meal_time descending
            meal_times = [meal['meal_time'] for meal in response.data]
            sorted_meal_times = sorted(meal_times, reverse=True)
            self.assertEqual(meal_times, sorted_meal_times)

    def test_date_format_variations(self):
        """Test different date format variations"""
        self.client.force_authenticate(user=self.user)

        # Test with different date formats (should all work with YYYY-MM-DD format)
        test_cases = [
            ('2024-01-01', '2024-01-31'),
            ('2024-1-1', '2024-1-31'),  # Single digit month/day
        ]

        for initial_date, end_date in test_cases:
            with self.subTest(initial_date=initial_date, end_date=end_date):
                url = reverse('meals-by-user-by-interval', args=[self.user.pk, initial_date, end_date])
                response = self.client.get(url)
                # Should work or at least not crash
                self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_boundary_dates_inclusive(self):
        """Test that boundary dates are inclusive"""
        self.client.force_authenticate(user=self.user)

        # Create meal exactly on boundary date
        boundary_meal = Meal.objects.create(
            user=self.user,
            meal_type=self.breakfast_config,
            meal_time=datetime(2024, 1, 31, 8, 0),  # Exactly on end date
            validation_status=self.status,
            comments="Boundary meal"
        )

        url = reverse('meals-by-user-by-interval', args=[self.user.pk, '2024-01-31', '2024-01-31'])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], boundary_meal.id)

    def test_large_date_range(self):
        """Test with large date range"""
        self.client.force_authenticate(user=self.user)
        url = reverse('meals-by-user-by-interval', args=[self.user.pk, '2020-01-01', '2030-12-31'])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should include all user's meals
        self.assertEqual(len(response.data), 3)

    def test_concurrent_user_access(self):
        """Test that different authenticated users can access the endpoint simultaneously"""
        # Authenticate as first user
        self.client.force_authenticate(user=self.user)
        url1 = reverse('meals-by-user-by-interval', args=[self.user.pk, '2024-01-01', '2024-01-31'])
        response1 = self.client.get(url1)

        # Switch to second user
        self.client.force_authenticate(user=self.other_user)
        url2 = reverse('meals-by-user-by-interval', args=[self.other_user.pk, '2024-01-01', '2024-01-31'])
        response2 = self.client.get(url2)

        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        # Results should be different
        self.assertNotEqual(len(response1.data), len(response2.data))
