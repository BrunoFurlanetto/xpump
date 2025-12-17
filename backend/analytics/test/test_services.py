"""
Tests for analytics services
"""
from datetime import timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from faker import Faker

from analytics.services import (
    DateRangeService,
    UserAnalyticsService,
    GroupAnalyticsService,
    SystemAnalyticsService,
    ActivityFeedService
)
from clients.models import Client
from gamification.models import Season
from profiles.models import Profile
from groups.models import Group, GroupMembers
from workouts.models import WorkoutCheckin, WorkoutStreak
from nutrition.models import Meal, MealStreak, MealConfig


faker = Faker('pt_BR')


class DateRangeServiceTest(TestCase):
    """Test DateRangeService"""

    def test_get_time_ranges(self):
        """Test get_time_ranges returns correct date ranges"""
        time_ranges = DateRangeService.get_time_ranges()

        self.assertIn('now', time_ranges)
        self.assertIn('today_start', time_ranges)
        self.assertIn('week_start', time_ranges)
        self.assertIn('month_start', time_ranges)

        # Verify today_start is at midnight
        today_start = time_ranges['today_start']
        self.assertEqual(today_start.hour, 0)
        self.assertEqual(today_start.minute, 0)
        self.assertEqual(today_start.second, 0)

        # Verify week_start is 7 days ago
        week_start = time_ranges['week_start']
        expected_week = today_start - timedelta(days=7)
        self.assertEqual(week_start, expected_week)

        # Verify month_start is first day of current month
        month_start = time_ranges['month_start']
        self.assertEqual(month_start.day, 1)
        self.assertEqual(month_start.hour, 0)


class UserAnalyticsServiceTest(TestCase):
    """Test UserAnalyticsService"""

    def setUp(self):
        """Set up test data"""
        # Create owner for client
        self.client_owner = User.objects.create_user(
            username='clientowner',
            email='clientowner@example.com',
            password='testpass123'
        )

        # Create client (employer)
        self.client = Client.objects.create(
            name='Test Company',
            cnpj='12345678000190',
            contact_email='company@example.com',
            phone='11999999999',
            address='Test Address',
            owners=self.client_owner
        )

        self.season = Season.objects.create(
            name='Season 1',
            start_date=timezone.now() - timedelta(days=180),
            end_date=timezone.now() + timedelta(days=180),
            client=self.client
        )

        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.profile = Profile.objects.create(
            user=self.user,
            score=1500.0,
            level=5,
            employer=self.client
        )

    def test_get_active_user_ids_with_workouts(self):
        """Test get_active_user_ids identifies users with recent workouts"""
        now = timezone.now()
        week_ago = now - timedelta(days=7)

        # Create workout within the week
        WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=now,
            duration=timedelta(hours=1),
            location='gym',
            base_points=100
        )

        active_ids = UserAnalyticsService.get_active_user_ids(week_ago)
        self.assertIn(self.user.id, active_ids)

    def test_get_active_user_ids_excludes_old_activity(self):
        """Test get_active_user_ids excludes users with old activity"""
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        old_date = now - timedelta(days=10)

        # Create old workout
        WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=old_date,
            duration=timedelta(hours=1),
            location='gym',
            base_points=100
        )

        active_ids = UserAnalyticsService.get_active_user_ids(week_ago)
        users_ids_test = set()
        users_ids_test.add(self.user.id)

        self.assertNotIn(users_ids_test, active_ids)

    def test_get_user_queryset_with_stats(self):
        """Test get_user_queryset_with_stats returns annotated queryset"""
        queryset = UserAnalyticsService.get_user_queryset_with_stats()

        # Should exclude staff and superusers
        self.assertFalse(queryset.filter(is_staff=True).exists())
        self.assertFalse(queryset.filter(is_superuser=True).exists())

        # Should include regular user
        self.assertTrue(queryset.filter(id=self.user.id).exists())

        # Check annotations exist
        user_data = queryset.get(id=self.user.id)
        self.assertTrue(hasattr(user_data, 'workout_count'))
        self.assertTrue(hasattr(user_data, 'meal_count'))
        self.assertTrue(hasattr(user_data, 'post_count'))

    def test_get_streaks_for_users(self):
        """Test get_streaks_for_users returns streak dictionaries"""
        # Create streaks
        WorkoutStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=10,
            frequency=3
        )
        MealStreak.objects.create(
            user=self.user,
            current_streak=7,
            longest_streak=15
        )

        workout_streaks, meal_streaks = UserAnalyticsService.get_streaks_for_users([self.user.id])

        self.assertIn(self.user.id, workout_streaks)
        self.assertIn(self.user.id, meal_streaks)
        self.assertEqual(workout_streaks[self.user.id].current_streak, 5)
        self.assertEqual(meal_streaks[self.user.id].current_streak, 7)

    def test_build_user_stats(self):
        """Test build_user_stats creates correct statistics dictionary"""
        # Create streak
        workout_streak = WorkoutStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=10,
            frequency=3
        )
        meal_streak = MealStreak.objects.create(
            user=self.user,
            current_streak=7,
            longest_streak=15
        )

        # Get annotated user
        user_qs = UserAnalyticsService.get_user_queryset_with_stats()
        user = user_qs.get(id=self.user.id)

        workout_streaks = {self.user.id: workout_streak}
        meal_streaks = {self.user.id: meal_streak}
        week_ago = timezone.now() - timedelta(days=7)

        stats = UserAnalyticsService.build_user_stats(
            user, workout_streaks, meal_streaks, week_ago
        )

        self.assertEqual(stats['id'], self.user.id)
        self.assertEqual(stats['username'], 'testuser')
        self.assertEqual(stats['profile_score'], 1500.0)
        self.assertEqual(stats['profile_level'], 5)
        self.assertEqual(stats['current_workout_streak'], 5)
        self.assertEqual(stats['current_meal_streak'], 7)

    def test_get_user_detail_stats(self):
        """Test get_user_detail_stats returns comprehensive user data"""
        # Create some activity
        WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now(),
            duration=timedelta(hours=1),
            location='gym',
            base_points=100
        )

        stats = UserAnalyticsService.get_user_detail_stats(self.user)

        self.assertEqual(stats['id'], self.user.id)
        self.assertEqual(stats['username'], 'testuser')
        self.assertEqual(stats['workout_count'], 1)
        self.assertIsNotNone(stats['last_workout'])
        self.assertEqual(stats['groups'], [])


class GroupAnalyticsServiceTest(TestCase):
    """Test GroupAnalyticsService"""

    def setUp(self):
        """Set up test data"""
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='testpass123'
        )
        self.test_client = Client.objects.create(
            name='Test Client',
            cnpj=faker.unique.cnpj(),
            owners=self.owner,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )
        self.season = Season.objects.create(
            name='Season 1',
            start_date=timezone.now() - timedelta(days=180),
            end_date=timezone.now() + timedelta(days=180),
            client=self.test_client
        )
        self.member = User.objects.create_user(
            username='member',
            email='member@example.com',
            password='testpass123'
        )
        Profile.objects.create(user=self.owner, employer=self.test_client)
        Profile.objects.create(user=self.member, employer=self.test_client)

        self.group = Group.objects.create(
            name='Test Group',
            description='A test group',
            created_by=self.owner,
            owner=self.owner
        )

        # Check if membership already exists before creating
        GroupMembers.objects.get_or_create(
            group=self.group,
            member=self.owner,
            defaults={'is_admin': True, 'pending': False}
        )
        GroupMembers.objects.get_or_create(
            group=self.group,
            member=self.member,
            defaults={'is_admin': False, 'pending': False}
        )

    def test_get_group_member_ids_bulk(self):
        """Test get_group_member_ids_bulk returns member IDs"""
        groups = [self.group]
        member_ids_by_group = GroupAnalyticsService.get_group_member_ids_bulk(groups)

        self.assertIn(self.group.id, member_ids_by_group)
        self.assertEqual(len(member_ids_by_group[self.group.id]), 2)
        self.assertIn(self.owner.id, member_ids_by_group[self.group.id])
        self.assertIn(self.member.id, member_ids_by_group[self.group.id])

    def test_get_active_members_by_groups(self):
        """Test get_active_members_by_groups identifies active members"""
        now = timezone.now()

        # Create workout for member
        WorkoutCheckin.objects.create(
            user=self.member,
            workout_date=now,
            duration=timedelta(hours=1),
            location='gym',
            base_points=100
        )

        member_ids_by_group = {self.group.id: [self.owner.id, self.member.id]}
        active_by_group = GroupAnalyticsService.get_active_members_by_groups(
            member_ids_by_group, now - timedelta(days=1)
        )

        self.assertIn(self.group.id, active_by_group)
        self.assertIn(self.member.id, active_by_group[self.group.id])

    def test_build_group_stats(self):
        """Test build_group_stats creates correct statistics"""
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)

        member_ids = [self.owner.id, self.member.id]
        active_today = set()
        active_week = set()

        stats = GroupAnalyticsService.build_group_stats(
            self.group, member_ids, active_today, active_week, today_start, week_start
        )

        self.assertEqual(stats['id'], self.group.id)
        self.assertEqual(stats['name'], 'Test Group')
        self.assertEqual(stats['member_count'], 2)
        self.assertEqual(stats['created_by'], 'owner')


class SystemAnalyticsServiceTest(TestCase):
    """Test SystemAnalyticsService"""
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = Client.objects.create(
            name='Test Company',
            cnpj='12345678000190',
            contact_email='company@example.com',
            phone='11999999999',
            address='Test Address',
            owners=self.user
        )
        self.season = Season.objects.create(
            name='Season 1',
            start_date=timezone.now() - timedelta(days=180),
            end_date=timezone.now() + timedelta(days=180),
            client=self.client
        )
        Profile.objects.create(user=self.user, score=1000, level=3, employer=self.client)

    def test_get_system_stats(self):
        """Test get_system_stats returns comprehensive statistics"""
        stats = SystemAnalyticsService.get_system_stats()

        # Check required fields exist
        self.assertIn('total_users', stats)
        self.assertIn('active_users', stats)
        self.assertIn('total_workouts', stats)
        self.assertIn('total_meals', stats)
        self.assertIn('total_posts', stats)
        self.assertIn('average_user_level', stats)
        self.assertIn('average_user_score', stats)

        # At least one non-staff user should exist
        self.assertGreaterEqual(stats['total_users'], 1)

    def test_get_system_stats_includes_activity_counts(self):
        """Test system stats includes activity counts"""
        # Create some activity
        now = timezone.now()
        WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=now,
            duration=timedelta(hours=1),
            location='gym',
            base_points=100
        )

        stats = SystemAnalyticsService.get_system_stats()

        self.assertEqual(stats['total_workouts'], 1)
        self.assertEqual(stats['workouts_today'], 1)


class ActivityFeedServiceTest(TestCase):
    """Test ActivityFeedService"""

    def setUp(self):
        """Set up test data"""
        # Create client owner and client
        self.client_owner = User.objects.create_user(
            username='clientowner',
            email='clientowner@example.com',
            password='testpass123'
        )

        self.client = Client.objects.create(
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
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        # Create profile for user
        Profile.objects.create(
            user=self.user,
            score=1000,
            level=3,
            employer=self.client
        )

    def test_get_recent_activities_returns_list(self):
        """Test get_recent_activities returns a list"""
        activities = ActivityFeedService.get_recent_activities(limit=10)

        self.assertIsInstance(activities, list)

    def test_get_recent_activities_user_joined(self):
        """Test get_recent_activities includes new user activities"""
        activities = ActivityFeedService.get_recent_activities(limit=10, activity_type='user_joined')

        self.assertGreaterEqual(len(activities), 1)
        user_activities = [a for a in activities if a['type'] == 'user_joined']
        self.assertGreater(len(user_activities), 0)

    def test_get_recent_activities_limit_parameter(self):
        """Test get_recent_activities accepts limit parameter"""
        activities = ActivityFeedService.get_recent_activities(limit=5)

        self.assertIsInstance(activities, list)
        self.assertLessEqual(len(activities), 5)


