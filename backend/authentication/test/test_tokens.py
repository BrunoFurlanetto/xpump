# authentication/tests/test_tokens.py
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()


class JWTAuthenticationTests(APITestCase):

    def setUp(self):
        """
        Setup for JWT tests.
        Creates a user for authentication tests.
        """
        self.user_data = {
            "username": "testuser",
            "password": "testpassword123",
            "email": "testuser@example.com"
        }
        self.user = User.objects.create_user(**self.user_data)
        self.login_url = reverse('token_obtain_pair')  # URL to obtain JWT token
        self.refresh_url = reverse('token_refresh')  # URL to refresh the token

    def test_obtain_access_token(self):
        """
        Test the acquisition of the access token using valid credentials.
        """
        response = self.client.post(self.login_url, {
            'username': self.user_data['username'],
            'password': self.user_data['password']
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)  # Check if access token is returned
        self.assertIn('refresh', response.data)  # Check if refresh token is returned

    def test_access_with_valid_token(self):
        """
        Test accessing a protected view with a valid access token.
        """
        # Obtain the access token
        response = self.client.post(self.login_url, {
            'username': self.user_data['username'],
            'password': self.user_data['password']
        }, format='json')
        access_token = response.data['access']

        # Access a protected view using the valid access token
        response = self.client.get(reverse('users-list'), HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # Should be allowed to access

    def test_access_with_invalid_token(self):
        """
        Test accessing a protected view with an invalid access token.
        """
        invalid_token = 'invalidtoken'

        # Attempt to access a protected view with an invalid token
        response = self.client.get(reverse('users-list'), HTTP_AUTHORIZATION=f'Bearer {invalid_token}')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)  # Should fail with 401 Unauthorized

    def test_refresh_token(self):
        """
        Test refreshing the access token using the refresh token.
        """
        # Obtain the tokens
        response = self.client.post(self.login_url, {
            'username': self.user_data['username'],
            'password': self.user_data['password']
        }, format='json')
        refresh_token = response.data['refresh']

        # Use the refresh token to obtain a new access token
        response = self.client.post(self.refresh_url, {'refresh': refresh_token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)  # Check if the new access token is returned

    def test_no_token(self):
        """
        Test the case where no token is provided in the request header.
        """
        response = self.client.get(reverse('users-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)  # Should fail with 401 Unauthorized
