from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from groups.models import Group, GroupMembers
from groups.views import (
    GroupsAPIView,
    GroupAPIView,
    GroupMemberAPIView,
    JoinGroupAPIView
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
        # Additional member
        self.member2 = GroupMembers.objects.create(member=self.user2, group=self.group)
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
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'User not a member of this groups')

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


class JoinGroupViewTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user1 = User.objects.create_user(username='user1', password='password')
        Profile.objects.create(user=self.user1)
        self.user2 = User.objects.create_user(username='user2', password='password')
        # Initial group created by user2
        self.group = Group.objects.create(name="Joinable", created_by=self.user2, owner=self.user2)

    def test_join_group_invalid_code(self):
        request = self.factory.post('/groups/join/INV123/')
        force_authenticate(request, user=self.user1)
        response = JoinGroupAPIView.as_view()(request, invite_code='INV123')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Group does not exist')

    def test_join_group_success(self):
        # user1 not yet do part of self.group
        request = self.factory.post(f'/groups/join/{self.group.invite_code}/')
        force_authenticate(request, user=self.user1)
        response = JoinGroupAPIView.as_view()(
            request, invite_code=self.group.invite_code
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'User joined this group')
        self.assertTrue(
            GroupMembers.objects.filter(group=self.group, member=self.user1).exists()
        )

    def test_join_group_already_member(self):
        # user2 was created as a member on save()
        request = self.factory.post(f'/groups/join/{self.group.invite_code}/')
        force_authenticate(request, user=self.user2)
        response = JoinGroupAPIView.as_view()(
            request, invite_code=self.group.invite_code
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'User already joined this group')
