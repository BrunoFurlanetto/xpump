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

    def test_group_member_pending_status(self):
        """Test that group members can have pending status for invitations"""
        group = Group.objects.create(name="Test Group", created_by=self.user, owner=self.user)
        user2 = User.objects.create_user(username='user2', password='password')

        # Create a pending member invitation
        member = GroupMembers.objects.create(group=group, member=user2, pending=True)
        self.assertTrue(member.pending)
        self.assertFalse(member.is_admin)

        # Accept invitation
        member.pending = False
        member.save()
        self.assertFalse(member.pending)

    def test_group_member_admin_status(self):
        """Test group member admin functionality"""
        group = Group.objects.create(name="Test Group", created_by=self.user, owner=self.user)
        user2 = User.objects.create_user(username='user2', password='password')

        # Create admin member
        admin_member = GroupMembers.objects.create(group=group, member=user2, is_admin=True)
        admin_member.pending = False
        admin_member.save()

        self.assertTrue(admin_member.is_admin)
        self.assertFalse(admin_member.pending)

    def test_group_main_status(self):
        """Test group main field for enterprise groups"""
        # Regular group
        regular_group = Group.objects.create(name="Regular Group", created_by=self.user, owner=self.user)
        self.assertFalse(regular_group.main)

        # Main enterprise group
        main_group = Group.objects.create(
            name="Main Group",
            created_by=self.user,
            owner=self.user,
            main=True
        )
        self.assertTrue(main_group.main)
