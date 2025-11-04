from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from faker import Faker
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

from groups.models import Group, GroupMembers
from nutrition.models import MealStreak
from profiles.models import Profile
from clients.models import Client
from workouts.models import WorkoutStreak


class GroupViewsTest(TestCase):
    """
    Test suite for Groups API views including:
    - Group listing and creation
    - Group detail operations (retrieve, update, delete)
    - Period-based member data retrieval
    - Member management operations
    - Permission and authentication handling
    """

    def setUp(self):
        """Set up test data including users, clients, profiles, and groups"""
        self.client = APIClient()
        faker = Faker('pt_BR')

        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            is_staff=True,
            is_superuser=True
        )
        self.owner_user = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            password='testpass123'
        )
        self.member_user = User.objects.create_user(
            username='member',
            email='member@test.com',
            password='testpass123'
        )
        self.non_member_user = User.objects.create_user(
            username='nonmember',
            email='nonmember@test.com',
            password='testpass123'
        )

        # Create test client for profiles
        self.test_client = Client.objects.create(
            name='Test Client',
            cnpj=faker.unique.cnpj(),
            owners=self.owner_user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        # Create profiles
        self.admin_profile = Profile.objects.create(
            user=self.admin_user,
            score=300.0,
            employer=self.test_client
        )
        self.owner_profile = Profile.objects.create(
            user=self.owner_user,
            score=200.0,
            employer=self.test_client
        )
        self.member_profile = Profile.objects.create(
            user=self.member_user,
            score=100.0,
            employer=self.test_client
        )
        self.non_member_profile = Profile.objects.create(
            user=self.non_member_user,
            score=50.0,
            employer=self.test_client
        )

        # Create workout Streaks
        WorkoutStreak.objects.create(user=self.admin_user)
        WorkoutStreak.objects.create(user=self.owner_user)
        WorkoutStreak.objects.create(user=self.member_user)
        WorkoutStreak.objects.create(user=self.non_member_user)

        # Create meal streak
        MealStreak.objects.create(user=self.admin_user)
        MealStreak.objects.create(user=self.owner_user)
        MealStreak.objects.create(user=self.member_user)
        MealStreak.objects.create(user=self.non_member_user)

        # Create test group
        self.group = Group.objects.create(
            name="Test Group",
            description="A test group for API testing",
            created_by=self.owner_user,
            owner=self.owner_user
        )

        # Add regular member (owner is auto-added as admin)
        GroupMembers.objects.create(
            group=self.group,
            member=self.member_user,
            pending=False,
            is_admin=False
        )

    def test_groups_list_requires_admin_permission(self):
        """Test that listing groups requires admin permission"""
        # Try without authentication
        url = reverse('groups-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Try with regular user
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin user should succeed
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_group_success(self):
        """Test successful group creation"""
        self.client.force_authenticate(user=self.owner_user)

        data = {
            'name': 'New Test Group',
            'description': 'A new group for testing'
        }
        url = reverse('groups-list')
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check that group was created correctly
        new_group = Group.objects.get(name='New Test Group')
        self.assertEqual(new_group.created_by, self.owner_user)
        self.assertEqual(new_group.owner, self.owner_user)

        # Check that creator was auto-added as admin member
        membership = GroupMembers.objects.get(group=new_group, member=self.owner_user)
        self.assertTrue(membership.is_admin)
        self.assertFalse(membership.pending)

    def test_create_group_requires_authentication(self):
        """Test that group creation requires authentication"""
        data = {
            'name': 'Unauthorized Group',
            'description': 'Should not be created'
        }
        url = reverse('groups-list')
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_group_retrieve_default_period(self):
        """Test retrieving group details with default (all) period"""
        self.client.force_authenticate(user=self.owner_user)
        url = reverse('groups-detail', kwargs={'pk': self.group.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data['id'], self.group.id)
        self.assertEqual(data['name'], self.group.name)
        self.assertIn('members', data)
        self.assertIn('stats', data)

    @patch('groups.views.compute_group_members_data')
    def test_group_retrieve_with_week_period(self, mock_compute_data):
        """Test retrieving group details with week period"""
        # Mock the service response
        mock_compute_data.return_value = {
            'id': self.group.id,
            'name': self.group.name,
            'members': [
                {
                    'id': self.owner_user.id,
                    'username': 'owner',
                    'position': 1,
                    'score': 80.0,
                    'workouts': 5,
                    'meals': 8
                }
            ]
        }

        self.client.force_authenticate(user=self.owner_user)
        url = reverse('groups-detail', kwargs={'pk': self.group.pk})
        response = self.client.get(f'{url}?period=week')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify service was called with correct parameters
        mock_compute_data.assert_called_once_with(self.group, 'week')

        data = response.json()
        self.assertEqual(len(data['members']), 1)
        self.assertEqual(data['members'][0]['username'], 'owner')

    @patch('groups.views.compute_group_members_data')
    def test_group_retrieve_with_invalid_period(self, mock_compute_data):
        """Test retrieving group details with invalid period"""
        from django.core.exceptions import ValidationError

        # Mock service to raise ValidationError
        mock_compute_data.side_effect = ValidationError('Period must be "week" or "month"')

        self.client.force_authenticate(user=self.owner_user)
        url = reverse('groups-detail', kwargs={'pk': self.group.pk})
        response = self.client.get(f'{url}?period=invalid')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        data = response.json()
        self.assertIn('detail', data)

    def test_group_update_by_member(self):
        """Test group update by group member"""
        self.client.force_authenticate(user=self.owner_user)

        data = {
            'name': 'Updated Group Name',
            'description': 'Updated description'
        }
        url = reverse('groups-detail', kwargs={'pk': self.group.pk})
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify update
        self.group.refresh_from_db()
        self.assertEqual(self.group.name, 'Updated Group Name')
        self.assertEqual(self.group.description, 'Updated description')

    def test_group_update_by_non_member(self):
        """Test that non-members cannot update group"""
        self.client.force_authenticate(user=self.non_member_user)

        data = {'name': 'Should Not Update'}
        url = reverse('groups-detail', kwargs={'pk': self.group.pk})
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_group_delete_by_owner(self):
        """Test group deletion by owner"""
        self.client.force_authenticate(user=self.owner_user)
        url = reverse('groups-detail', kwargs={'pk': self.group.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify deletion
        self.assertFalse(Group.objects.filter(id=self.group.id).exists())

    def test_group_delete_by_non_owner(self):
        """Test that non-owners cannot delete group"""
        self.client.force_authenticate(user=self.member_user)
        url = reverse('groups-detail', kwargs={'pk': self.group.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verify group still exists
        self.assertTrue(Group.objects.filter(id=self.group.id).exists())

    def test_group_me_returns_user_groups(self):
        """Test that group/me endpoint returns user's groups"""
        self.client.force_authenticate(user=self.owner_user)
        url = reverse('groups-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.group.id)

    def test_group_me_includes_pending_status(self):
        """Test that group/me includes pending status for each group"""
        # Create pending membership
        pending_group = Group.objects.create(
            name="Pending Group",
            created_by=self.admin_user,
            owner=self.admin_user
        )
        GroupMembers.objects.create(
            group=pending_group,
            member=self.owner_user,
            pending=True,
            is_admin=False
        )

        self.client.force_authenticate(user=self.owner_user)
        url = reverse('groups-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        # Should have 2 groups (one confirmed, one pending)
        self.assertEqual(len(data), 2)

        # Check pending status is included
        pending_statuses = [group.get('pending') for group in data]
        self.assertIn(True, pending_statuses)
        self.assertIn(False, pending_statuses)

    def test_member_update_admin_status_by_owner(self):
        """Test updating member admin status by group owner"""
        self.client.force_authenticate(user=self.owner_user)

        data = {'is_admin': True}
        url = reverse('group-members-detail', kwargs={'group_id': self.group.id, 'member_id': self.member_user.id})
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify update
        membership = GroupMembers.objects.get(group=self.group, member=self.member_user)
        self.assertTrue(membership.is_admin)

    def test_member_update_admin_status_by_non_owner(self):
        """Test that non-owners cannot update admin status"""
        self.client.force_authenticate(user=self.member_user)

        data = {'is_admin': True}
        url = reverse('group-members-detail', kwargs={'group_id': self.group.id, 'member_id': self.member_user.id})
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_update_invalid_fields(self):
        """Test that only admin status can be updated"""
        self.client.force_authenticate(user=self.owner_user)

        data = {
            'is_admin': True,
            'pending': False,  # Should not be allowed
            'joined_at': timezone.now()  # Should not be allowed
        }
        url = reverse('group-members-detail', kwargs={'group_id': self.group.id, 'member_id': self.member_user.id})
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        data = response.json()
        self.assertIn('error', data)
        self.assertIn('Only is_admin field can be updated', data['error'])

    def test_member_removal_by_admin(self):
        """Test member removal by admin member"""
        self.client.force_authenticate(user=self.owner_user)
        url = reverse('group-members-detail', kwargs={'group_id': self.group.id, 'member_id': self.member_user.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify removal
        self.assertFalse(
            GroupMembers.objects.filter(
                group=self.group,
                member=self.member_user
            ).exists()
        )

    def test_member_removal_by_non_admin(self):
        """Test that non-admin members cannot remove others"""
        self.client.force_authenticate(user=self.member_user)
        url = reverse('group-members-detail', kwargs={'group_id': self.group.id, 'member_id': self.owner_user.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_member_removal_requires_owner(self):
        """Test that only owner can remove admin members"""
        # Make member_user an admin
        membership = GroupMembers.objects.get(group=self.group, member=self.member_user)
        membership.is_admin = True
        membership.save()

        # Create another admin
        admin_member = GroupMembers.objects.create(
            group=self.group,
            member=self.admin_user,
            pending=False,
            is_admin=True
        )

        # Try to remove admin member with non-owner admin
        self.client.force_authenticate(user=self.member_user)
        url = reverse('group-members-detail', kwargs={'group_id': self.group.id, 'member_id': self.admin_user.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Owner should be able to remove admin member
        self.client.force_authenticate(user=self.owner_user)
        url = reverse('group-members-detail', kwargs={'group_id': self.group.id, 'member_id': self.admin_user.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_invite_user_to_group(self):
        """Test inviting a user to a group"""
        self.client.force_authenticate(user=self.owner_user)
        url = reverse('invite-group', kwargs={'group_id': self.group.id, 'user': self.non_member_user.username})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify invitation was created
        invitation = GroupMembers.objects.get(
            group=self.group,
            member=self.non_member_user
        )
        self.assertTrue(invitation.pending)
        self.assertFalse(invitation.is_admin)

    def test_invite_nonexistent_user(self):
        """Test inviting a non-existent user returns 404"""
        self.client.force_authenticate(user=self.owner_user)
        url = reverse('invite-group', kwargs={'group_id': self.group.id, 'user': 'nonexistent_user'})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invite_requires_admin_permission(self):
        """Test that only admin members can invite users"""
        self.client.force_authenticate(user=self.member_user)
        url = reverse('invite-group', kwargs={'group_id': self.group.id, 'user': self.non_member_user.username})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GroupAPIPermissionsTest(TestCase):
    """Test suite for group API permissions and edge cases"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        faker = Faker('pt_BR')
        # Create test client for profiles

        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )

        self.test_client = Client.objects.create(
            name='Test Client',
            cnpj=faker.cnpj(),
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.profile = Profile.objects.create(
            user=self.user,
            employer=self.test_client
        )

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated requests are denied"""
        endpoints = [
            '/api/v1/groups/',
            '/api/v1/groups/1/',
            '/api/v1/groups/me/',
            '/api/v1/groups/1/members/1/',
            '/api/v1/groups/1/invite/testuser/',
        ]

        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_group_returns_404(self):
        """Test that accessing non-existent group returns 404"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get('/api/groups/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
