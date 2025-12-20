"""
Tests for analytics URL patterns
"""
from django.test import TestCase
from django.urls import reverse, resolve

from analytics.views import (
    SystemStatsAPIView,
    UserListAPIView,
    GroupListAPIView,
    RecentActivitiesAPIView,
    UserDetailAPIView,
    GroupDetailAPIView
)


class AnalyticsURLsTest(TestCase):
    """Test analytics URL patterns resolve correctly"""

    def test_system_stats_url(self):
        """Test system stats URL resolves correctly"""
        url = reverse('admin-system-stats')
        self.assertEqual(url, '/api/v1/analytics/admin/system/stats/')
        self.assertEqual(resolve(url).func.view_class, SystemStatsAPIView)

    def test_user_list_url(self):
        """Test user list URL resolves correctly"""
        url = reverse('admin-system-users')
        self.assertEqual(url, '/api/v1/analytics/admin/system/users/')
        self.assertEqual(resolve(url).func.view_class, UserListAPIView)

    def test_user_detail_url(self):
        """Test user detail URL resolves correctly"""
        url = reverse('admin-user-detail', kwargs={'user_id': 1})
        self.assertEqual(url, '/api/v1/analytics/admin/system/users/1/')
        self.assertEqual(resolve(url).func.view_class, UserDetailAPIView)

    def test_group_list_url(self):
        """Test group list URL resolves correctly"""
        url = reverse('admin-system-groups')
        self.assertEqual(url, '/api/v1/analytics/admin/system/groups/')
        self.assertEqual(resolve(url).func.view_class, GroupListAPIView)

    def test_group_detail_url(self):
        """Test group detail URL resolves correctly"""
        url = reverse('admin-group-detail', kwargs={'group_id': 1})
        self.assertEqual(url, '/api/v1/analytics/admin/system/groups/1/')
        self.assertEqual(resolve(url).func.view_class, GroupDetailAPIView)

    def test_activities_url(self):
        """Test activities URL resolves correctly"""
        url = reverse('admin-system-activities')
        self.assertEqual(url, '/api/v1/analytics/admin/system/activities/')
        self.assertEqual(resolve(url).func.view_class, RecentActivitiesAPIView)

