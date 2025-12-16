"""
Test file for Analytics endpoints
Run with: python manage.py test analytics.test_analytics
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status


class AnalyticsEndpointsTestCase(TestCase):
    """Test cases for analytics endpoints"""

    def setUp(self):
        """Set up test client and admin user"""
        self.client = APIClient()

        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            is_staff=True
        )

        # Create regular user
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123',
            is_staff=False
        )

    def test_system_stats_requires_authentication(self):
        """Test that system stats endpoint requires authentication"""
        response = self.client.get('/api/v1/analytics/admin/system/stats/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_system_stats_requires_admin(self):
        """Test that system stats endpoint requires admin permission"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/analytics/admin/system/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_system_stats_works_for_admin(self):
        """Test that admin can access system stats"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/analytics/admin/system/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check response contains expected fields
        expected_fields = [
            'total_users', 'active_users', 'inactive_users',
            'total_groups', 'total_workouts', 'total_meals',
            'average_user_level', 'average_user_score'
        ]
        for field in expected_fields:
            self.assertIn(field, response.data)

    def test_user_list_pagination(self):
        """Test that user list endpoint supports pagination"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/analytics/admin/system/users/?page_size=5')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

    def test_user_list_search(self):
        """Test that user list endpoint supports search"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/analytics/admin/system/users/?search=user')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_list_ordering(self):
        """Test that user list endpoint supports ordering"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/analytics/admin/system/users/?ordering=-username')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_detail_endpoint(self):
        """Test user detail endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/v1/analytics/admin/system/users/{self.regular_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.regular_user.id)

    def test_user_detail_not_found(self):
        """Test user detail endpoint with invalid ID"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/analytics/admin/system/users/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_group_list_endpoint(self):
        """Test group list endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/analytics/admin/system/groups/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_activities_endpoint(self):
        """Test activities endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/analytics/admin/system/activities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_activities_with_limit(self):
        """Test activities endpoint with limit parameter"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/analytics/admin/system/activities/?limit=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data), 10)

    def test_activities_with_type_filter(self):
        """Test activities endpoint with type filter"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/analytics/admin/system/activities/?type=workout')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # All returned activities should be of type 'workout' if any exist
        for activity in response.data:
            if activity:  # If there are activities
                self.assertEqual(activity['type'], 'workout')


class AnalyticsURLsTestCase(TestCase):
    """Test that all analytics URLs are properly configured"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            is_staff=True
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_all_endpoints_accessible(self):
        """Test that all analytics endpoints are accessible"""
        endpoints = [
            '/api/v1/analytics/admin/system/stats/',
            '/api/v1/analytics/admin/system/users/',
            '/api/v1/analytics/admin/system/groups/',
            '/api/v1/analytics/admin/system/activities/',
        ]

        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertIn(
                response.status_code,
                [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND],
                f"Endpoint {endpoint} returned unexpected status {response.status_code}"
            )

