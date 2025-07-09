from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError
from django.test import TestCase
from groups.models import Group, GroupMembers
from groups.serializer import GroupSerializer, GroupMemberSerializer


class GroupSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user', password='password')
        self.group = Group.objects.create(name="Test Group", created_by=self.user, owner=self.user)

    def test_valid_group_serializer(self):
        data = {
            'name': "Test Group",
            'created_by': self.user.id,
            'owner': self.user.id,
        }
        serializer = GroupSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_invalid_group_serializer(self):
        data = {'name': "", 'created_by': self.user.id}
        serializer = GroupSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)


class GroupMemberSerializerTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='password')
        self.user2 = User.objects.create_user(username='user2', password='password')
        self.group = Group.objects.create(name="Test Group", created_by=self.user1, owner=self.user1)
        # self.member = GroupMembers.objects.create(group=self.group, member=self.user2)

    def test_valid_member_serializer(self):
        data = {'member': self.user2.id, 'group': self.group.id}
        serializer = GroupMemberSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_read_only_fields(self):
        data = {'member': self.user1.id, 'group': self.group.id, 'joined_at': '2025-07-08'}
        serializer = GroupMemberSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('joined_at', serializer.errors)
