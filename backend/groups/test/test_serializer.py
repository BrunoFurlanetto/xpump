from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.contrib.auth.models import User
from django.utils import timezone
from faker.proxy import Faker
from rest_framework.exceptions import ValidationError
from django.test import TestCase

from clients.models import Client
from gamification.models import Season
from groups.models import Group, GroupMembers
from groups.serializer import GroupSerializer, GroupMemberSerializer
from nutrition.models import MealStreak
from profiles.models import Profile
from workouts.models import WorkoutStreak


class GroupSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')

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
        self.group = Group.objects.create(
            name="Test Group",
            description="Test Description",
            created_by=self.user,
            owner=self.user
        )

    def test_group_serialization(self):
        """Test that GroupSerializer correctly serializes group data"""
        serializer = GroupSerializer(self.group)
        data = serializer.data

        self.assertEqual(data['id'], self.group.id)
        self.assertEqual(data['name'], 'Test Group')
        self.assertEqual(data['description'], 'Test Description')
        self.assertEqual(data['created_by'], self.user.id)
        self.assertEqual(data['owner'], self.user.id)
        self.assertFalse(data['main'])
        self.assertIn('created_at', data)

    def test_group_deserialization_valid(self):
        """Test that GroupSerializer correctly deserializes valid data"""
        data = {
            'name': 'New Group',
            'description': 'New Description'
        }
        serializer = GroupSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        # Verify validated data
        validated_data = serializer.validated_data
        self.assertEqual(validated_data['name'], 'New Group')
        self.assertEqual(validated_data['description'], 'New Description')

    def test_group_deserialization_invalid_name(self):
        """Test that GroupSerializer validates required name field"""
        data = {
            'description': 'Description without name'
        }
        serializer = GroupSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_group_deserialization_long_name(self):
        """Test that GroupSerializer validates name length"""
        data = {
            'name': 'A' * 256,  # Assuming max_length is 255
            'description': 'Valid description'
        }
        serializer = GroupSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_group_update_serialization(self):
        """Test updating a group via serializer"""
        data = {
            'name': 'Updated Group Name',
            'description': 'Updated Description'
        }
        serializer = GroupSerializer(self.group, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

        updated_group = serializer.save()
        self.assertEqual(updated_group.name, 'Updated Group Name')
        self.assertEqual(updated_group.description, 'Updated Description')

    def test_group_main_field_serialization(self):
        """Test serialization of main field for enterprise groups"""
        main_group = Group.objects.create(
            name="Main Group",
            created_by=self.user,
            owner=self.user,
            main=True
        )

        serializer = GroupSerializer(main_group)
        data = serializer.data
        self.assertTrue(data['main'])


class GroupMembersSerializerTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='password')
        self.user2 = User.objects.create_user(username='user2', password='password')

        self.employer = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user1,
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

        Profile.objects.create(user=self.user1, employer=self.employer)
        Profile.objects.create(user=self.user2, employer=self.employer)

        self.group = Group.objects.create(
            name="Test Group",
            created_by=self.user1,
            owner=self.user1
        )

        membership1 = GroupMembers.objects.get(group=self.group, member=self.user1)
        membership1.pending = False
        membership1.save()

        self.membership = GroupMembers.objects.create(
            group=self.group,
            member=self.user2,
            is_admin=False,
            pending=False
        )

    def test_group_member_serialization(self):
        """Test that GroupMembersSerializer correctly serializes membership data"""
        serializer = GroupMemberSerializer(self.membership)
        data = serializer.data

        self.assertEqual(data['member'], self.user2.id)
        self.assertFalse(data['is_admin'])
        self.assertFalse(data['pending'])
        self.assertIn('joined_at', data)

    def test_group_member_admin_serialization(self):
        """Test serialization of admin member"""
        admin_membership = GroupMembers.objects.get(
            group=self.group,
            member=self.user1,
        )

        serializer = GroupMemberSerializer(admin_membership)
        data = serializer.data

        self.assertTrue(data['is_admin'])
        self.assertFalse(data['pending'])

    def test_group_member_pending_serialization(self):
        """Test serialization of pending member invitation"""
        user3 = User.objects.create_user(username='user3', password='password')
        pending_membership = GroupMembers.objects.create(
            group=self.group,
            member=user3,
            is_admin=False,
            pending=True
        )

        serializer = GroupMemberSerializer(pending_membership)
        data = serializer.data
        self.assertFalse(data['is_admin'])
        self.assertTrue(data['pending'])

    def test_group_member_deserialization_valid(self):
        """Test that GroupMembersSerializer correctly deserializes valid data"""
        data = {
            'member': self.user2.id,
            'group': self.group.id,
            'is_admin': True,
            'pending': False
        }
        serializer = GroupMemberSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_group_member_update_serialization(self):
        """Test updating a group membership via serializer"""
        data = {
            'is_admin': True
        }
        serializer = GroupMemberSerializer(self.membership, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

        updated_membership = serializer.save()
        self.assertTrue(updated_membership.is_admin)

    def test_group_member_unique_constraint(self):
        """Test that duplicate memberships are handled properly"""
        # Try to create another membership for the same user and group
        data = {
            'member': self.user2.id,
            'group': self.group.id,
            'is_admin': False
        }
        serializer = GroupMemberSerializer(data=data)

        # The serializer should be valid, but the database constraint should prevent duplicates
        self.assertTrue(serializer.is_valid())

        # This should raise an IntegrityError when saved due to unique constraint
        with self.assertRaises(Exception):
            serializer.save()

    def test_read_only_fields(self):
        """Test that certain fields are read-only"""
        data = {
            'member': self.user2.id,
            'group': self.group.id,
            'joined_at': '2023-01-01T00:00:00Z',  # This should be ignored
            'is_admin': True
        }
        serializer = GroupMemberSerializer(self.membership, data=data, partial=True)
        serializer.is_valid()

        self.assertFalse(serializer.is_valid())

class GroupSerializerTest(TestCase):
    """
    Test suite for GroupSerializer functionality including:
    - Member ranking with scores and positions
    - Group statistics calculation
    - Pending members handling
    - Caching mechanism for performance
    """

    def setUp(self):
        """Set up test data including users, profiles, and groups"""
        faker = Faker('pt_BR')

        # Create test users
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@test.com',
            first_name='User',
            last_name='One'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@test.com',
            first_name='User',
            last_name='Two'
        )
        self.user3 = User.objects.create_user(
            username='user3',
            email='user3@test.com',
            first_name='User',
            last_name='Three'
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

        # Create profiles with different scores
        self.profile1 = Profile.objects.create(user=self.user1, score=100.0, employer=self.test_client)
        self.profile2 = Profile.objects.create(user=self.user2, score=200.0, employer=self.test_client)
        self.profile3 = Profile.objects.create(user=self.user3, score=150.0, employer=self.test_client)

        # Create workout Streaks
        WorkoutStreak.objects.create(user=self.user1)
        WorkoutStreak.objects.create(user=self.user2)
        WorkoutStreak.objects.create(user=self.user3)

        # Create meal streak
        MealStreak.objects.create(user=self.user1)
        MealStreak.objects.create(user=self.user2)
        MealStreak.objects.create(user=self.user3)

        # Create test group
        self.group = Group.objects.create(
            name="Test Group",
            description="A test group for serializer testing",
            created_by=self.user1,
            owner=self.user1
        )

        # Add additional members (user1 is already added automatically)
        GroupMembers.objects.create(
            group=self.group,
            member=self.user2,
            pending=False,
            is_admin=False
        )
        GroupMembers.objects.create(
            group=self.group,
            member=self.user3,
            pending=True,  # Pending member
            is_admin=False
        )

    def test_group_serializer_basic_fields(self):
        """Test that basic group fields are serialized correctly"""
        serializer = GroupSerializer(self.group)
        data = serializer.data

        self.assertEqual(data['id'], self.group.id)
        self.assertEqual(data['name'], "Test Group")
        self.assertEqual(data['description'], "A test group for serializer testing")
        self.assertEqual(data['created_by'], "User One")
        self.assertEqual(data['owner'], self.user1.id)
        self.assertFalse(data['main'])

    def test_members_ranking_and_position(self):
        """Test that members are ranked correctly by score with proper positions"""
        serializer = GroupSerializer(self.group)
        data = serializer.data

        members = data['members']

        # Should have 2 non-pending members
        self.assertEqual(len(members), 2)

        # Check ranking order (user2 has highest score: 200, then user1: 100)
        self.assertEqual(members[0]['username'], 'user2')
        self.assertEqual(members[0]['position'], 1)
        self.assertEqual(members[0]['score'], 200.0)

        self.assertEqual(members[1]['username'], 'user1')
        self.assertEqual(members[1]['position'], 2)
        self.assertEqual(members[1]['score'], 100.0)

    def test_pending_members_separation(self):
        """Test that pending members are properly separated and don't have position/score"""
        serializer = GroupSerializer(self.group)
        data = serializer.data

        pending_members = data['pending_members']

        # Should have 1 pending member
        self.assertEqual(len(pending_members), 1)
        self.assertEqual(pending_members[0]['username'], 'user3')
        self.assertEqual(pending_members[0]['email'], 'user3@test.com')

    @patch('groups.serializer.GroupSerializer.get_members')
    def test_stats_with_cache(self, mock_get_members):
        """Test that stats calculation uses cached members data when available"""
        # Mock the cached members data
        mock_members = [
            MagicMock(
                member=MagicMock(
                    workouts=MagicMock(count=lambda: 5),
                    meals=MagicMock(count=lambda: 10),
                    workout_streak=MagicMock(current_streak=7),
                    meal_streak=MagicMock(current_streak=5)
                ),
                score=100.0
            ),
            MagicMock(
                member=MagicMock(
                    workouts=MagicMock(count=lambda: 3),
                    meals=MagicMock(count=lambda: 8),
                    workout_streak=MagicMock(current_streak=3),
                    meal_streak=MagicMock(current_streak=2)
                ),
                score=80.0
            )
        ]

        serializer = GroupSerializer(self.group)
        serializer._members_cache = mock_members
        serializer._members_count_cache = 2

        stats = serializer.get_stats(self.group)

        self.assertEqual(stats['total_members'], 2)
        self.assertEqual(stats['total_points'], 180.0)
        self.assertEqual(stats['total_workouts'], 8)
        self.assertEqual(stats['total_meals'], 18)
        self.assertEqual(stats['mean_workout_streak'], 5.0)  # (7+3)/2
        self.assertEqual(stats['mean_meal_streak'], 3.5)     # (5+2)/2
        self.assertEqual(stats['mean_streak'], 4.25)         # (5.0+3.5)/2

    def test_stats_without_cache(self):
        """Test that stats calculation works without cached data"""
        serializer = GroupSerializer(self.group)
        stats = serializer.get_stats(self.group)

        # Should have basic stats even without workouts/meals
        self.assertEqual(stats['total_members'], 2)  # 2 non-pending members
        self.assertEqual(stats['total_points'], 300.0)  # 100 + 200
        self.assertIsInstance(stats['total_workouts'], int)
        self.assertIsInstance(stats['total_meals'], int)

    @patch('groups.models.User.workouts')
    @patch('groups.models.User.meals')
    def test_member_workouts_and_meals_count(self, mock_meals, mock_workouts):
        """Test that member workout and meal counts are calculated correctly"""
        # Mock workout and meal counts
        mock_workouts.all.return_value = ['workout1', 'workout2', 'workout3']
        mock_meals.all.return_value = ['meal1', 'meal2']

        serializer = GroupSerializer(self.group)
        data = serializer.data

        members = data['members']

        # Check that workout and meal counts are included
        for member in members:
            self.assertIn('workouts', member)
            self.assertIn('meals', member)
            self.assertIsInstance(member['workouts'], int)
            self.assertIsInstance(member['meals'], int)

    def test_member_serializer_fields(self):
        """Test that member data includes all required fields"""
        serializer = GroupSerializer(self.group)
        data = serializer.data

        members = data['members']

        for member in members:
            required_fields = [
                'id', 'username', 'email', 'is_admin',
                'joined_at', 'pending', 'position', 'score',
                'workouts', 'meals'
            ]
            for field in required_fields:
                self.assertIn(field, member)

    def test_group_stats_edge_cases(self):
        """Test stats calculation with edge cases like no members or null values"""
        # Create a group with no additional members
        empty_group = Group.objects.create(
            name="Empty Group",
            created_by=self.user1,
            owner=self.user1
        )

        # Remove the auto-created member to make it truly empty
        GroupMembers.objects.filter(group=empty_group).delete()

        serializer = GroupSerializer(empty_group)
        stats = serializer.get_stats(empty_group)

        self.assertEqual(stats['total_members'], 0)
        self.assertEqual(stats['total_points'], 0)
        self.assertEqual(stats['total_workouts'], 0)
        self.assertEqual(stats['total_meals'], 0)


class GroupMemberSerializerTest(TestCase):
    """Test suite for GroupMemberSerializer validation and read-only fields"""

    def setUp(self):
        """Set up test data"""
        faker = Faker('pt_BR')
        self.user = User.objects.create_user(username='testuser', email='test@test.com')
        # Create test client for profiles
        self.test_client = Client.objects.create(
            name='Test Client',
            cnpj=faker.unique.cnpj(),
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )
        self.profile = Profile.objects.create(user=self.user, employer=self.test_client)
        self.group = Group.objects.create(
            name="Test Group",
            created_by=self.user,
            owner=self.user
        )
        self.group_member = GroupMembers.objects.filter(group=self.group, member=self.user).first()

    def test_read_only_fields_validation(self):
        """Test that read-only fields cannot be modified"""
        serializer = GroupMemberSerializer(data={
            'member': self.user.id,
            'joined_at': timezone.now(),
            'pending': False,
            'is_admin': True
        })

        # Should be invalid due to read-only fields in data
        self.assertFalse(serializer.is_valid())
        self.assertIn('joined_at', serializer.errors)
        self.assertIn('pending', serializer.errors)

    def test_valid_admin_update(self):
        """Test that admin status can be updated"""
        serializer = GroupMemberSerializer(
            instance=self.group_member,
            data={'is_admin': False},
            partial=True
        )

        self.assertTrue(serializer.is_valid())
        updated_member = serializer.save()
        self.assertFalse(updated_member.is_admin)

    def test_serializer_output_fields(self):
        """Test that serializer outputs all expected fields"""
        serializer = GroupMemberSerializer(self.group_member)
        data = serializer.data

        expected_fields = ['member', 'joined_at', 'is_admin', 'pending']
        for field in expected_fields:
            self.assertIn(field, data)

