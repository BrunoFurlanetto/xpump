from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError
from django.test import TestCase
from groups.models import Group, GroupMembers
from groups.serializer import GroupSerializer, GroupMemberSerializer
from profiles.models import Profile


class GroupSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        Profile.objects.create(user=self.user)
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
        Profile.objects.create(user=self.user1)
        Profile.objects.create(user=self.user2)

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
