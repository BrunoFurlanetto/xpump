from django.db import transaction
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from django.urls import reverse

from profiles.models import Profile


class UserAuthenticationTests(APITestCase):
    def setUp(self):
        """
        Initial setup for the tests. Creates a user and logs them in for testing.
        """
        self.user_data = {
            "username": "testuser",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User",
            "email": "testuser@example.com",
            "is_active": True,
            "is_superuser": True,
        }
        self.user = User.objects.create_user(**self.user_data)
        self.url = reverse('users-list')  # URL for the user list endpoint
        self.detail_url = reverse('user-detail', args=[self.user.id])  # URL for the user detail endpoint
        self.client.login(username=self.user_data['username'], password=self.user_data['password'])

    def test_user_creation(self):
        """
        Tests the creation of a new user and the automatic creation of their profile.
        """
        data = {
            "username": "newuser",
            "password": "newpassword123",
            "password2": "newpassword123",
            "first_name": "New",
            "last_name": "User",
            "email": "newuser@example.com"
        }

        # Obtain the JWT token (login)
        login_data = {
            "username": "testuser",
            "password": "testpassword123"
        }
        login_response = self.client.post(reverse('token_obtain_pair'), login_data, format='json')
        access_token = login_response.data['access']  # Accessing the token

        # Add the JWT token to the request header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + access_token)

        # Create the new user
        response = self.client.post(reverse('users-list'), data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'newuser')

        # Verify if the profile was automatically created
        user = User.objects.get(username='newuser')
        self.assertIsNotNone(user.profile)  # Verifies that the profile was created automatically

    def test_user_creation_without_login(self):
        """
        Tests user creation without being authenticated.
        """
        self.client.logout()  # Ensure user is logged out

        data = {
            "username": "newuser",
            "password": "newpassword123",
            "password2": "newpassword123",
            "first_name": "New",
            "last_name": "User",
            "email": "newuser@example.com"
        }

        response = self.client.post(reverse('users-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_list(self):
        """
        Tests listing all users.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

    def test_user_detail(self):
        """
        Tests retrieving the details of a user.
        """
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user_data['username'])

    def test_user_delete(self):
        """
        Tests the deletion of a user and their associated profile.
        """
        # Login data
        login_data = {
            "username": "testuser",
            "password": "testpassword123"
        }

        # Data for creating a new user
        data = {
            "username": "newuser",
            "password": "newpassword123",
            "password2": "newpassword123",
            "first_name": "New",
            "last_name": "User",
            "email": "newuser@example.com"
        }

        # Login to obtain the JWT token
        login_response = self.client.post(reverse('token_obtain_pair'), login_data, format='json')
        access_token = login_response.data['access']  # Accessing the token
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + access_token)

        # Creating the user
        response_created = self.client.post(reverse('users-list'), data, format='json')

        # Verify if the profile was created correctly
        user = User.objects.get(username='newuser')
        self.assertIsNotNone(user.profile)  # Verifies that the profile was created

        # Deleting the user
        response = self.client.delete(reverse('user-detail', args=[user.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        response_check = self.client.get(reverse('user-detail', args=[response_created.data['id']]))
        self.assertEqual(response_check.status_code, status.HTTP_404_NOT_FOUND)

        # Verifying if the profile was deleted as well
        with self.assertRaises(Profile.DoesNotExist):
            user.profile.refresh_from_db()  # Attempts to access the profile, expecting it to have been deleted
