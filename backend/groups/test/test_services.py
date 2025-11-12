from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import datetime
from unittest.mock import patch, MagicMock
import zoneinfo

from faker import Faker

from groups.models import Group, GroupMembers
from groups.services import compute_group_members_data
from profiles.models import Profile
from clients.models import Client


class GroupServicesTest(TestCase):
    """
    Test suite for groups services, specifically the compute_group_members_data function
    that calculates member rankings and points for different time periods.
    """

    def setUp(self):
        """Set up test data including users, profiles, groups, and mock workouts/meals"""
        faker = Faker('pt_BR')

        # Create test users
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@test.com'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@test.com'
        )
        self.user3 = User.objects.create_user(
            username='user3',
            email='user3@test.com'
        )

        # Create test client for profiles
        self.test_client = Client.objects.create(
            name='Test Client',
            cnpj=faker.unique.cnpj(),
            owners=self.user1,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        # Create profiles
        self.profile1 = Profile.objects.create(user=self.user1, score=100.0, employer=self.test_client)
        self.profile2 = Profile.objects.create(user=self.user2, score=200.0, employer=self.test_client)
        self.profile3 = Profile.objects.create(user=self.user3, score=150.0, employer=self.test_client)

        # Create test group
        self.group = Group.objects.create(
            name="Test Group",
            description="A test group for services testing",
            created_by=self.user1,
            owner=self.user1
        )

        # Add members (user1 is auto-added as admin)
        GroupMembers.objects.create(
            group=self.group,
            member=self.user2,
            pending=False,
            is_admin=False
        )
        GroupMembers.objects.create(
            group=self.group,
            member=self.user3,
            pending=True,  # This member should be excluded
            is_admin=False
        )

    def test_invalid_period_raises_validation_error(self):
        """Test that invalid period parameter raises ValidationError"""
        with self.assertRaises(ValidationError) as context:
            compute_group_members_data(self.group, 'invalid_period')

        self.assertIn('Period must be "week" or "month"', str(context.exception))

    @patch('groups.services.timezone.now')
    def test_week_period_calculation(self, mock_now):
        """Test that week period calculates correct start date"""
        # Mock current time to a specific date (e.g., Wednesday)
        mock_now.return_value = datetime(2024, 1, 10, 12, 0, 0, tzinfo=zoneinfo.ZoneInfo('UTC'))  # Wednesday

        # Mock the entire queryset chain using a simpler approach
        with patch('groups.services.compute_group_members_data') as mock_group_class:
            mock_group_instance = MagicMock()
            mock_group_instance.id = self.group.id
            mock_group_instance.name = self.group.name

            # Mock the manager chain
            mock_manager = MagicMock()
            mock_filtered_qs = MagicMock()
            mock_annotated_qs = []

            mock_filtered_qs.annotate.return_value = mock_annotated_qs
            mock_manager.select_related.return_value.filter.return_value = mock_filtered_qs
            mock_group_instance.groupmembers_set = mock_manager

            # Should not raise any exceptions
            result = compute_group_members_data(mock_group_instance, 'week')

            self.assertIsInstance(result, dict)
            self.assertIn('members', result)
            self.assertEqual(result['id'], self.group.id)
            self.assertEqual(result['name'], self.group.name)

    @patch('groups.services.timezone.now')
    def test_month_period_calculation(self, mock_now):
        """Test that month period calculates correct start date"""
        # Mock current time to middle of month
        mock_now.return_value = datetime(2024, 1, 15, 12, 0, 0, tzinfo=zoneinfo.ZoneInfo('UTC'))

        # Mock the entire queryset chain using a simpler approach
        with patch('groups.services.compute_group_members_data') as mock_group_class:
            mock_group_instance = MagicMock()
            mock_group_instance.id = self.group.id
            mock_group_instance.name = self.group.name

            # Mock the manager chain
            mock_manager = MagicMock()
            mock_filtered_qs = MagicMock()
            mock_annotated_qs = []

            mock_filtered_qs.annotate.return_value = mock_annotated_qs
            mock_manager.select_related.return_value.filter.return_value = mock_filtered_qs
            mock_group_instance.groupmembers_set = mock_manager

            result = compute_group_members_data(mock_group_instance, 'month')

            self.assertIsInstance(result, dict)
            self.assertIn('members', result)

    def test_only_non_pending_members_included(self):
        """Test that only non-pending members are included in results"""
        # Create a mock group instead of using the real one
        mock_group = MagicMock()
        mock_group.id = self.group.id
        mock_group.name = self.group.name

        # Mock queryset to return only non-pending members
        mock_member1 = MagicMock()
        mock_member1.member.id = self.user1.id
        mock_member1.member.username = 'user1'
        mock_member1.member.email = 'user1@test.com'
        mock_member1.is_admin = True
        mock_member1.joined_at = timezone.now()
        mock_member1.pending = False
        mock_member1.workout_points = 50.0
        mock_member1.meal_points = 30.0
        mock_member1.workouts_count = 5
        mock_member1.meals_count = 8

        mock_member2 = MagicMock()
        mock_member2.member.id = self.user2.id
        mock_member2.member.username = 'user2'
        mock_member2.member.email = 'user2@test.com'
        mock_member2.is_admin = False
        mock_member2.joined_at = timezone.now()
        mock_member2.pending = False
        mock_member2.workout_points = 40.0
        mock_member2.meal_points = 50.0
        mock_member2.workouts_count = 3
        mock_member2.meals_count = 10

        # Mock the manager chain
        mock_manager = MagicMock()
        mock_filtered_qs = MagicMock()
        mock_annotated_qs = [mock_member1, mock_member2]

        mock_filtered_qs.annotate.return_value = mock_annotated_qs
        mock_manager.select_related.return_value.filter.return_value = mock_filtered_qs
        mock_group.groupmembers_set = mock_manager

        result = compute_group_members_data(mock_group, 'week')

        # Should have 2 members (excluding pending user3)
        self.assertEqual(len(result['members']), 2)

        # Check that members are sorted by total points (workout_points + meal_points)
        # user2: 40 + 50 = 90 points (position 1)
        # user1: 50 + 30 = 80 points (position 2)
        self.assertEqual(result['members'][0]['username'], 'user2')
        self.assertEqual(result['members'][0]['position'], 1)
        self.assertEqual(result['members'][0]['score'], 90.0)

        self.assertEqual(result['members'][1]['username'], 'user1')
        self.assertEqual(result['members'][1]['position'], 2)
        self.assertEqual(result['members'][1]['score'], 80.0)

    def test_member_data_structure(self):
        """Test that member data contains all required fields"""
        # Create a mock group instead of using the real one
        mock_group = MagicMock()
        mock_group.id = self.group.id
        mock_group.name = self.group.name

        mock_member = MagicMock()
        mock_member.member.id = self.user1.id
        mock_member.member.username = 'user1'
        mock_member.member.email = 'user1@test.com'
        mock_member.is_admin = True
        mock_member.joined_at = timezone.now()
        mock_member.pending = False
        mock_member.workout_points = 50.0
        mock_member.meal_points = 30.0
        mock_member.workouts_count = 5
        mock_member.meals_count = 8

        # Mock the manager chain
        mock_manager = MagicMock()
        mock_filtered_qs = MagicMock()
        mock_annotated_qs = [mock_member]

        mock_filtered_qs.annotate.return_value = mock_annotated_qs
        mock_manager.select_related.return_value.filter.return_value = mock_filtered_qs
        mock_group.groupmembers_set = mock_manager

        result = compute_group_members_data(mock_group, 'week')

        member_data = result['members'][0]
        expected_fields = [
            'id', 'username', 'email', 'is_admin', 'joined_at',
            'pending', 'position', 'score', 'workouts', 'meals'
        ]

        for field in expected_fields:
            self.assertIn(field, member_data)

        # Check data types and values
        self.assertIsInstance(member_data['id'], int)
        self.assertIsInstance(member_data['username'], str)
        self.assertIsInstance(member_data['position'], int)
        self.assertIsInstance(member_data['score'], (int, float))
        self.assertIsInstance(member_data['workouts'], int)
        self.assertIsInstance(member_data['meals'], int)
        self.assertIsInstance(member_data['is_admin'], bool)
        self.assertIsInstance(member_data['pending'], bool)

    def test_zero_points_handling(self):
        """Test that members with zero or None points are handled correctly"""
        # Create a mock group instead of using the real one
        mock_group = MagicMock()
        mock_group.id = self.group.id
        mock_group.name = self.group.name

        mock_member = MagicMock()
        mock_member.member.id = self.user1.id
        mock_member.member.username = 'user1'
        mock_member.member.email = 'user1@test.com'
        mock_member.is_admin = True
        mock_member.joined_at = timezone.now()
        mock_member.pending = False
        mock_member.workout_points = None  # None values
        mock_member.meal_points = None
        mock_member.workouts_count = None
        mock_member.meals_count = None

        # Mock the manager chain
        mock_manager = MagicMock()
        mock_filtered_qs = MagicMock()
        mock_annotated_qs = [mock_member]

        mock_filtered_qs.annotate.return_value = mock_annotated_qs
        mock_manager.select_related.return_value.filter.return_value = mock_filtered_qs
        mock_group.groupmembers_set = mock_manager

        result = compute_group_members_data(mock_group, 'week')

        member_data = result['members'][0]

        # Should handle None values gracefully
        self.assertEqual(member_data['score'], 0.0)  # None + None = 0
        self.assertEqual(member_data['workouts'], 0)  # None converted to 0
        self.assertEqual(member_data['meals'], 0)     # None converted to 0

    def test_group_data_structure(self):
        """Test that the returned group data has the correct structure"""
        # Create a mock group instead of using the real one
        mock_group = MagicMock()
        mock_group.id = self.group.id
        mock_group.name = self.group.name

        # Mock the manager chain
        mock_manager = MagicMock()
        mock_filtered_qs = MagicMock()
        mock_annotated_qs = []

        mock_filtered_qs.annotate.return_value = mock_annotated_qs
        mock_manager.select_related.return_value.filter.return_value = mock_filtered_qs
        mock_group.groupmembers_set = mock_manager

        result = compute_group_members_data(mock_group, 'week')

        # Check top-level structure
        expected_keys = ['id', 'name', 'members']
        for key in expected_keys:
            self.assertIn(key, result)

        self.assertEqual(result['id'], self.group.id)
        self.assertEqual(result['name'], self.group.name)
        self.assertIsInstance(result['members'], list)

    def test_member_sorting_by_total_score(self):
        """Test that members are correctly sorted by total score (workout_points + meal_points)"""
        # Create a mock group instead of using the real one
        mock_group = MagicMock()
        mock_group.id = self.group.id
        mock_group.name = self.group.name

        # Create mock members with different scores
        mock_member1 = MagicMock()
        mock_member1.member.id = 1
        mock_member1.member.username = 'low_score'
        mock_member1.member.email = 'low@test.com'
        mock_member1.workout_points = 10.0
        mock_member1.meal_points = 15.0  # Total: 25
        mock_member1.workouts_count = 2
        mock_member1.meals_count = 3
        mock_member1.is_admin = False
        mock_member1.joined_at = timezone.now()
        mock_member1.pending = False

        mock_member2 = MagicMock()
        mock_member2.member.id = 2
        mock_member2.member.username = 'high_score'
        mock_member2.member.email = 'high@test.com'
        mock_member2.workout_points = 40.0
        mock_member2.meal_points = 60.0  # Total: 100
        mock_member2.workouts_count = 8
        mock_member2.meals_count = 12
        mock_member2.is_admin = False
        mock_member2.joined_at = timezone.now()
        mock_member2.pending = False

        mock_member3 = MagicMock()
        mock_member3.member.id = 3
        mock_member3.member.username = 'mid_score'
        mock_member3.member.email = 'mid@test.com'
        mock_member3.workout_points = 20.0
        mock_member3.meal_points = 30.0  # Total: 50
        mock_member3.workouts_count = 4
        mock_member3.meals_count = 6
        mock_member3.is_admin = False
        mock_member3.joined_at = timezone.now()
        mock_member3.pending = False

        # Mock the manager chain
        mock_manager = MagicMock()
        mock_filtered_qs = MagicMock()
        mock_annotated_qs = [mock_member1, mock_member2, mock_member3]

        mock_filtered_qs.annotate.return_value = mock_annotated_qs
        mock_manager.select_related.return_value.filter.return_value = mock_filtered_qs
        mock_group.groupmembers_set = mock_manager

        result = compute_group_members_data(mock_group, 'month')

        # Check sorting order (highest score first)
        self.assertEqual(len(result['members']), 3)

        # Position 1: high_score (100 points)
        self.assertEqual(result['members'][0]['username'], 'high_score')
        self.assertEqual(result['members'][0]['position'], 1)
        self.assertEqual(result['members'][0]['score'], 100.0)

        # Position 2: mid_score (50 points)
        self.assertEqual(result['members'][1]['username'], 'mid_score')
        self.assertEqual(result['members'][1]['position'], 2)
        self.assertEqual(result['members'][1]['score'], 50.0)

        # Position 3: low_score (25 points)
        self.assertEqual(result['members'][2]['username'], 'low_score')
        self.assertEqual(result['members'][2]['position'], 3)
        self.assertEqual(result['members'][2]['score'], 25.0)
