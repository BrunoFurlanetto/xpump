from django.test import TestCase
from django.contrib.auth.models import User
from groups.models import Group, GroupMembers


class GroupModelTest(TestCase):
    def setUp(self):
        # Create a user for testing purposes
        self.user = User.objects.create_user(username='user', password='password')

    def test_group_creation(self):
        # Create a group and check its properties
        group = Group.objects.create(name="Test Group", created_by=self.user, owner=self.user)
        self.assertEqual(group.name, "Test Group")  # Check the name
        self.assertEqual(group.created_by, self.user)  # Check the creator
        self.assertEqual(group.owner, self.user)  # Check the owner

    def test_group_member_creation(self):
        # Create a group and try to add a member to it
        group = Group.objects.create(name="Test Group", created_by=self.user, owner=self.user)

        # Check if the member already exists before creating
        member, created = GroupMembers.objects.get_or_create(group=group, member=self.user)
        self.assertEqual(created, False)  # This should be True on the first creation

        # Try to create the same member again
        member, created = GroupMembers.objects.get_or_create(group=group, member=self.user)
        self.assertFalse(created)  # This should be False on the second attempt (no duplicates allowed)

    def test_unique_invite_code(self):
        # Create a group and check if the invite code is unique
        group = Group.objects.create(name="Test Group", created_by=self.user, owner=self.user)
        self.assertIsNotNone(group.invite_code)  # Ensure invite code is not None
        another_group = Group.objects.create(name="Another Group", created_by=self.user, owner=self.user)
        self.assertIsNotNone(another_group.invite_code)  # Ensure invite code is not None for another group
        self.assertNotEqual(group.invite_code, another_group.invite_code)  # Check that invite codes are different
