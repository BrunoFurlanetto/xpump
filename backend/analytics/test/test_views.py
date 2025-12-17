"""
Tests for analytics views and API endpoints
"""
from datetime import timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from faker import Faker
from rest_framework.test import APIClient
from rest_framework import status

from clients.models import Client
from gamification.models import Season
from profiles.models import Profile
from groups.models import Group, GroupMembers
from workouts.models import WorkoutCheckin


faker = Faker('pt_BR')


class SystemStatsAPIViewTest(TestCase):
    """Test SystemStatsAPIView"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )

        # Create client owner and client (employer)
        self.client_owner = User.objects.create_user(
            username='clientowner',
            email='clientowner@example.com',
            password='testpass123'
        )

        self.employer = Client.objects.create(
            name='Test Company',
            cnpj='12345678000190',
            contact_email='company@example.com',
            phone='11999999999',
            address='Test Address',
            owners=self.client_owner
        )

        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        Profile.objects.create(user=self.user, score=1000, level=3, employer=self.employer)

    def test_unauthenticated_access_denied(self):
        """Test unauthenticated users cannot access system stats"""
        url = reverse('admin-system-stats')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_access_denied(self):
        """Test non-admin users cannot access system stats"""
        self.client.force_authenticate(user=self.user)
        url = reverse('admin-system-stats')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_system_stats(self):
        """Test admin users can access system stats"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-stats')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', response.data)
        self.assertIn('active_users', response.data)
        self.assertIn('total_workouts', response.data)

    def test_system_stats_data_structure(self):
        """Test system stats returns correct data structure"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-stats')
        response = self.client.get(url)

        required_fields = [
            'total_users', 'active_users', 'total_workouts', 'total_meals',
            'total_posts', 'average_user_level', 'average_user_score'
        ]

        for field in required_fields:
            self.assertIn(field, response.data)


class UserListAPIViewTest(TestCase):
    """Test UserListAPIView"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        self.owner = User.objects.create_user(
            username=faker.user_name(),
            email=faker.email(),
            password='testepass123',
            first_name=faker.first_name(),
        )
        self.employer = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.owner,
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

        # Create test users
        for i in range(5):
            user = User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@example.com',
                password='testpass123',
                first_name=f'First{i}',
                last_name=f'Last{i}'
            )
            Profile.objects.create(user=user, score=1000 + i * 100, level=i + 1, employer=self.employer)

    def test_admin_can_list_users(self):
        """Test admin users can list all users"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-users')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_user_list_pagination(self):
        """Test user list is paginated"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-users')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_user_list_search(self):
        """Test user list search functionality"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-users')
        response = self.client.get(url, {'search': 'user0'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertGreater(len(results), 0)

    def test_user_list_ordering(self):
        """Test user list can be ordered"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-users')
        response = self.client.get(url, {'ordering': '-date_joined'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_list_active_filter(self):
        """Test user list active filter"""
        # Create active user with recent workout
        active_user = User.objects.create_user(
            username='activeuser',
            email='active@example.com',
            password='testpass123'
        )
        Profile.objects.create(user=active_user, score=1000, level=1, employer=self.employer)
        WorkoutCheckin.objects.create(
            user=active_user,
            workout_date=timezone.now(),
            duration=timedelta(hours=1),
            location='gym',
            base_points=100
        )

        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-users')
        response = self.client.get(url, {'is_active': 'true'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class GroupListAPIViewTest(TestCase):
    """Test GroupListAPIView"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='testpass123'
        )
        self.employer = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.owner,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )
        Profile.objects.create(user=self.owner, score=1000 + 10 * 100, level=1, employer=self.employer)

        # Create test groups
        for i in range(3):
            Group.objects.create(
                name=f'Group {i}',
                description=f'Description {i}',
                created_by=self.owner,
                owner=self.owner
            )

    def test_admin_can_list_groups(self):
        """Test admin users can list all groups"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-groups')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_group_list_pagination(self):
        """Test group list is paginated"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-groups')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)


class RecentActivitiesAPIViewTest(TestCase):
    """Test RecentActivitiesAPIView"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.owner = User.objects.create_user(
            username=faker.user_name(),
            email=faker.email(),
            password='testepass123',
            first_name=faker.first_name(),
        )
        self.employer = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.owner,
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
        Profile.objects.create(user=self.user, score=1000, level=3, employer=self.employer)


    def test_admin_can_access_activities(self):
        """Test admin users can access recent activities"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-activities')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_activities_limit_parameter(self):
        """Test activities endpoint respects limit parameter"""
        # Create multiple workouts
        for i in range(15):
            WorkoutCheckin.objects.create(
                user=self.user,
                workout_date=timezone.now() - timedelta(days=i),
                duration=timedelta(hours=1),
                location='gym',
                base_points=100
            )

        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-activities')
        response = self.client.get(url, {'limit': 5})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data), 5)

    def test_activities_type_filter(self):
        """Test activities endpoint filters by type"""
        WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now(),
            duration=timedelta(hours=1),
            location='gym',
            base_points=100
        )

        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-system-activities')
        response = self.client.get(url, {'type': 'workout'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        for activity in response.data:
            self.assertEqual(activity['type'], 'workout')


class UserDetailAPIViewTest(TestCase):
    """Test UserDetailAPIView"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.employer = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.admin,
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
        Profile.objects.create(
            user=self.user,
            score=1500,
            level=5,
            height=175,
            weight=70,
            employer=self.employer
        )

    def test_admin_can_access_user_detail(self):
        """Test admin users can access user detail"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-user-detail', kwargs={'user_id': self.user.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.user.id)
        self.assertEqual(response.data['username'], 'testuser')

    def test_user_detail_not_found(self):
        """Test user detail returns 404 for non-existent user"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-user-detail', kwargs={'user_id': 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_detail_contains_profile_info(self):
        """Test user detail includes profile information"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-user-detail', kwargs={'user_id': self.user.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_score', response.data)
        self.assertIn('profile_level', response.data)
        self.assertIn('height', response.data)
        self.assertEqual(response.data['profile_score'], 1500)
        self.assertEqual(response.data['profile_level'], 5)

    def test_user_detail_contains_activity_counts(self):
        """Test user detail includes activity counts"""
        # Create some activity
        WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now(),
            duration=timedelta(hours=1),
            location='gym',
            base_points=100
        )

        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-user-detail', kwargs={'user_id': self.user.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('workout_count', response.data)
        self.assertEqual(response.data['workout_count'], 1)


class GroupDetailAPIViewTest(TestCase):
    """Test GroupDetailAPIView"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='testpass123'
        )
        self.group = Group.objects.create(
            name='Test Group',
            description='A test group',
            created_by=self.owner,
            owner=self.owner
        )
        self.employer = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.owner,
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
        Profile.objects.create(user=self.owner, score=2000, level=6, employer=self.employer)

    def test_admin_can_access_group_detail(self):
        """Test admin users can access group detail"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-group-detail', kwargs={'group_id': self.group.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.group.id)
        self.assertEqual(response.data['name'], 'Test Group')

    def test_group_detail_not_found(self):
        """Test group detail returns 404 for non-existent group"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-group-detail', kwargs={'group_id': 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_group_detail_contains_member_stats(self):
        """Test group detail includes member statistics"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-group-detail', kwargs={'group_id': self.group.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('member_count', response.data)
        self.assertIn('admin_count', response.data)
        self.assertIn('pending_members', response.data)
        self.assertEqual(response.data['member_count'], 1)
        self.assertEqual(response.data['admin_count'], 1)

    def test_group_detail_contains_activity_stats(self):
        """Test group detail includes activity statistics"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-group-detail', kwargs={'group_id': self.group.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_workouts', response.data)
        self.assertIn('total_meals', response.data)
        self.assertIn('workouts_today', response.data)
        self.assertIn('meals_this_week', response.data)

    def test_group_detail_contains_top_members(self):
        """Test group detail includes top members"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-group-detail', kwargs={'group_id': self.group.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('top_members', response.data)
        self.assertIsInstance(response.data['top_members'], list)

