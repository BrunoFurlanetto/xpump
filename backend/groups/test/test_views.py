from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from groups.models import Group, GroupMembers
from groups.views import (
    GroupsAPIView,
    GroupAPIView,
    GroupMemberAPIView,
    InviteGroupAPIView,
    InviteGroupAccept,
    QuitingGroupAPIView
)
from profiles.models import Profile


class GroupViewsTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        # Users of test
        self.user1 = User.objects.create_user(username='user1', password='password')
        self.user2 = User.objects.create_user(username='user2', password='password')
        self.profile_user_2 = Profile.objects.create(user=self.user2)
        self.user3 = User.objects.create_user(username='user3', password='password')
        # Created group by user1 (automatically GroupMember created for user1 with admin)
        self.group = Group.objects.create(name="Test Group", created_by=self.user1, owner=self.user1)
        self.member1 = GroupMembers.objects.get(member=self.user1, group=self.group)
        self.member1.pending = False
        self.member1.save()
        # Additional member
        self.member2 = GroupMembers.objects.create(member=self.user2, group=self.group)
        self.member2.pending = False
        self.member2.save()
        self.profile_user_2.groups.add(self.group)

    def test_list_groups(self):
        request = self.factory.get('/groups/')
        force_authenticate(request, user=self.user1)
        response = GroupsAPIView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only group create by us
        self.assertEqual(len(response.data), 1)

    def test_create_group(self):
        data = {'name': 'New Group', 'description': 'Uma descrição'}
        request = self.factory.post('/groups/', data, format='json')
        force_authenticate(request, user=self.user2)
        response = GroupsAPIView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # created_by and owner must be assigned automatically
        self.assertEqual(response.data['created_by'], self.user2.id)
        self.assertEqual(response.data['owner'], self.user2.id)
        # Initial member must be assigned also automatically
        self.assertTrue(
            GroupMembers.objects.filter(
                group_id=response.data['id'],
                member=self.user2,
                is_admin=True
            ).exists()
        )

    def test_retrieve_group(self):
        request = self.factory.get(f'/groups/{self.group.id}/')
        force_authenticate(request, user=self.user1)
        response = GroupAPIView.as_view()(request, pk=self.group.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.group.id)

    def test_delete_group_not_owner(self):
        request = self.factory.delete(f'/groups/{self.group.id}/')
        force_authenticate(request, user=self.user2)
        response = GroupAPIView.as_view()(request, pk=self.group.id)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.data['detail'],
            'Only the group owner can delete it'
        )

    def test_delete_group_owner(self):
        request = self.factory.delete(f'/groups/{self.group.id}/')
        force_authenticate(request, user=self.user1)
        response = GroupAPIView.as_view()(request, pk=self.group.id)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Group.objects.filter(id=self.group.id).exists())

    def test_retrieve_group_member(self):
        request = self.factory.get(f'/groups/{self.group.id}/members/{self.user2.id}/')
        force_authenticate(request, user=self.user1)
        response = GroupMemberAPIView.as_view()(
            request, group_id=self.group.id, member_id=self.user2.id
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['member'], self.user2.id)

    def test_update_group_member_invalid_field(self):
        # Owner try update the not permitted fields
        data = {'joined_at': '2025-07-09T00:00:00Z'}
        request = self.factory.patch(
            f'/groups/{self.group.id}/members/{self.user2.id}/',
            data, format='json'
        )
        force_authenticate(request, user=self.user1)
        response = GroupMemberAPIView.as_view()(
            request, group_id=self.group.id, member_id=self.user2.id
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_update_group_member_non_owner(self):
        data = {'is_admin': True}
        request = self.factory.patch(
            f'/groups/{self.group.id}/members/{self.user2.id}/',
            data, format='json'
        )
        force_authenticate(request, user=self.user2)
        response = GroupMemberAPIView.as_view()(
            request, group_id=self.group.id, member_id=self.user2.id
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.data['detail'],
            'Only the group owner can update admin members'
        )

    def test_update_group_member_owner(self):
        # The owner promote user2
        data = {'is_admin': True}
        request = self.factory.patch(
            f'/groups/{self.group.id}/members/{self.user2.id}/',
            data, format='json'
        )
        force_authenticate(request, user=self.user1)
        response = GroupMemberAPIView.as_view()(
            request, group_id=self.group.id, member_id=self.user2.id
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_admin'])

    def test_delete_group_member_not_member(self):
        # User3 is not a member
        request = self.factory.delete(f'/groups/{self.group.id}/members/{self.user2.id}/')
        force_authenticate(request, user=self.user3)
        response = GroupMemberAPIView.as_view()(
            request, group_id=self.group.id, member_id=self.user2.id
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'User not a member of the group or membership is pending.')

    def test_delete_group_member_non_admin(self):
        request = self.factory.delete(
            f'/groups/{self.group.id}/members/{self.user1.id}/'
        )
        force_authenticate(request, user=self.user2)
        response = GroupMemberAPIView.as_view()(
            request, group_id=self.group.id, member_id=self.user1.id
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.data['detail'],
            'Only admin group can delete another members'
        )

    def test_delete_admin_member_not_owner(self):
        # user2 turn admin
        membership2 = GroupMembers.objects.get(member=self.user2, group=self.group)
        membership2.pending = False
        membership2.is_admin = True
        membership2.save()

        # user2 try remove user1 (the owner of the group)
        request = self.factory.delete(f'/groups/{self.group.id}/members/{self.user1.id}/')
        force_authenticate(request, user=self.user2)

        response = GroupMemberAPIView.as_view()(
            request, group_id=self.group.id, member_id=self.user1.id
        )

        # It is expected the 403 error (Forbidden), because user2 is not the owner
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.data['detail'],
            'Only group owner can delete admin members'
        )

    def test_delete_member_by_owner(self):
        # Owner remove user2
        request = self.factory.delete(f'/groups/{self.group.id}/members/{self.user2.id}/')
        force_authenticate(request, user=self.user1)
        response = GroupMemberAPIView.as_view()(
            request, group_id=self.group.id, member_id=self.user2.id
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GroupMembers.objects.filter(member=self.user2, group=self.group).exists())
        self.assertFalse(self.profile_user_2.groups.all())


class InviteGroupViewTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user1 = User.objects.create_user(username='user1', password='password')
        self.user2 = User.objects.create_user(username='user2', password='password')
        self.user3 = User.objects.create_user(username='user3', password='password')
        Profile.objects.create(user=self.user1)
        Profile.objects.create(user=self.user2)
        Profile.objects.create(user=self.user3)

        # Group created by user1 (owner and admin)
        self.group = Group.objects.create(name="Test Group", created_by=self.user1, owner=self.user1)

        # user2 as admin member
        self.member2 = GroupMembers.objects.create(member=self.user2, group=self.group, is_admin=True)

    def test_invite_user_by_admin_success(self):
        """Test that an admin can successfully invite a user to the group"""
        request = self.factory.post(f'/groups/{self.group.id}/invite/{self.user3.username}/')
        force_authenticate(request, user=self.user2)  # user2 is admin
        response = InviteGroupAPIView.as_view()(
            request, group_id=self.group.id, user=self.user3.username
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn(f"User {self.user3.username} invited", response.data['detail'])

        # Check that a pending membership was created
        membership = GroupMembers.objects.get(member=self.user3, group=self.group)
        self.assertTrue(membership.pending)
        self.assertFalse(membership.is_admin)

    def test_invite_user_by_non_admin_forbidden(self):
        """Test that a non-admin member cannot invite users"""
        # Make user2 a regular member
        self.member2.is_admin = False
        self.member2.save()

        request = self.factory.post(f'/groups/{self.group.id}/invite/{self.user3.username}/')
        force_authenticate(request, user=self.user2)
        response = InviteGroupAPIView.as_view()(
            request, group_id=self.group.id, user=self.user3.username
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invite_nonexistent_user(self):
        """Test inviting a user that doesn't exist"""
        request = self.factory.post(f'/groups/{self.group.id}/invite/nonexistent/')
        force_authenticate(request, user=self.user1)  # owner
        response = InviteGroupAPIView.as_view()(
            request, group_id=self.group.id, user='nonexistent'
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'User not found.')

    def test_invite_already_invited_user(self):
        """Test inviting a user that already has a pending invitation"""
        # Create pending invitation
        GroupMembers.objects.create(member=self.user3, group=self.group, pending=True)

        request = self.factory.post(f'/groups/{self.group.id}/invite/{self.user3.username}/')
        force_authenticate(request, user=self.user1)
        response = InviteGroupAPIView.as_view()(
            request, group_id=self.group.id, user=self.user3.username
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'User already invited to this group')

    def test_invite_existing_member(self):
        """Test inviting a user that is already a member"""
        # Make user3 a member
        GroupMembers.objects.create(member=self.user3, group=self.group, pending=False)

        request = self.factory.post(f'/groups/{self.group.id}/invite/{self.user3.username}/')
        force_authenticate(request, user=self.user1)
        response = InviteGroupAPIView.as_view()(
            request, group_id=self.group.id, user=self.user3.username
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'User already a member of this group')


class InviteAcceptViewTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user1 = User.objects.create_user(username='user1', password='password')
        self.user2 = User.objects.create_user(username='user2', password='password')
        Profile.objects.create(user=self.user1)
        Profile.objects.create(user=self.user2)

        # Group created by user1
        self.group = Group.objects.create(name="Test Group", created_by=self.user1, owner=self.user1)

        # Pending invitation for user2
        GroupMembers.objects.create(member=self.user2, group=self.group, pending=True)

    def test_accept_invitation_success(self):
        """Test successfully accepting a group invitation"""
        data = {'action': 'accept'}
        request = self.factory.post(f'/groups/{self.group.id}/accept/', data, format='json')
        force_authenticate(request, user=self.user2)
        response = InviteGroupAccept.as_view()(request, group_id=self.group.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'You have successfully joined the group.')

        # Check that membership is no longer pending
        membership = GroupMembers.objects.get(member=self.user2, group=self.group)
        self.assertFalse(membership.pending)

        # Check that user was added to group in profile
        self.assertIn(self.group, self.user2.profile.groups.all())

    def test_reject_invitation_success(self):
        """Test successfully rejecting a group invitation"""
        data = {'action': 'reject'}
        request = self.factory.post(f'/groups/{self.group.id}/accept/', data, format='json')
        force_authenticate(request, user=self.user2)
        response = InviteGroupAccept.as_view()(request, group_id=self.group.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'You have rejected the group invitation.')

        # Check that membership was deleted
        self.assertFalse(
            GroupMembers.objects.filter(member=self.user2, group=self.group).exists()
        )

    def test_accept_invitation_invalid_action(self):
        """Test with invalid action parameter"""
        data = {'action': 'invalid'}
        request = self.factory.post(f'/groups/{self.group.id}/accept/', data, format='json')
        force_authenticate(request, user=self.user2)
        response = InviteGroupAccept.as_view()(request, group_id=self.group.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], "Invalid action. Use 'accept' or 'reject'.")

    def test_accept_invitation_no_pending_invitation(self):
        """Test accepting invitation when no pending invitation exists"""
        # Remove pending invitation
        GroupMembers.objects.filter(member=self.user2, group=self.group).delete()

        data = {'action': 'accept'}
        request = self.factory.post(f'/groups/{self.group.id}/accept/', data, format='json')
        force_authenticate(request, user=self.user2)
        response = InviteGroupAccept.as_view()(request, group_id=self.group.id)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'No pending invitation found for this group.')


class QuitGroupViewTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user1 = User.objects.create_user(username='user1', password='password')
        self.user2 = User.objects.create_user(username='user2', password='password')
        Profile.objects.create(user=self.user1)
        Profile.objects.create(user=self.user2)

        # Group created by user1 (owner)
        self.group = Group.objects.create(name="Test Group", created_by=self.user1, owner=self.user1)
        self.member1 = GroupMembers.objects.get(member=self.user1, group=self.group)
        self.member1.pending = False
        self.member1.save()

        # user2 as regular member
        self.member2 = GroupMembers.objects.create(member=self.user2, group=self.group, pending=False)
        self.member2.pending = False
        self.member2.save()
        self.user2.profile.groups.add(self.group)

    def test_quit_group_success(self):
        """Test successfully quitting a group"""
        request = self.factory.post(f'/groups/{self.group.id}/quit/')
        force_authenticate(request, user=self.user2)
        response = QuitingGroupAPIView.as_view()(request, group_id=self.group.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'You have successfully quit the group.')

        # Check that membership was deleted
        self.assertFalse(
            GroupMembers.objects.filter(member=self.user2, group=self.group).exists()
        )

        # Check that group was removed from profile
        self.assertNotIn(self.group, self.user2.profile.groups.all())

    def test_quit_group_owner_cannot_quit(self):
        """Test that group owner cannot quit the group"""
        request = self.factory.post(f'/groups/{self.group.id}/quit/')
        force_authenticate(request, user=self.user1)  # owner
        response = QuitingGroupAPIView.as_view()(request, group_id=self.group.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['detail'],
            'Group owner cannot quit the group. Transfer ownership or delete the group.'
        )

    def test_quit_group_not_member(self):
        """Test quitting group when user is not a member"""
        user3 = User.objects.create_user(username='user3', password='password')

        request = self.factory.post(f'/groups/{self.group.id}/quit/')
        force_authenticate(request, user=user3)
        response = QuitingGroupAPIView.as_view()(request, group_id=self.group.id)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'User not a member of the group or membership is pending.')

    def test_quit_main_group_forbidden(self):
        """Test that users cannot quit main enterprise groups"""
        # Create main group
        main_group = Group.objects.create(
            name="Main Group",
            created_by=self.user1,
            owner=self.user1,
            main=True
        )
        GroupMembers.objects.create(member=self.user2, group=main_group, pending=False)

        request = self.factory.post(f'/groups/{main_group.id}/quit/')
        force_authenticate(request, user=self.user2)
        response = QuitingGroupAPIView.as_view()(request, group_id=main_group.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot quit for this group', response.data['detail'])

    def test_quit_group_nonexistent_group(self):
        """Test quitting a group that doesn't exist"""
        request = self.factory.post('/groups/999/quit/')
        force_authenticate(request, user=self.user2)
        response = QuitingGroupAPIView.as_view()(request, group_id=999)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Group does not exist.')
