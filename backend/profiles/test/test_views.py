# profiles/tests.py
import base64
import io
import os
import tempfile

from PIL import Image
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from faker import Faker
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

from clients.models import Client
from core import settings
from groups.models import Group
from profiles.models import Profile


class ProfilesAPIViewTestCase(APITestCase):
    """
    Test the ProfilesAPIView (ListCreateAPIView).
    This test covers the 'GET' method for listing all profiles.
    """

    def setUp(self):
        """
        Setup a user and authenticate the test client for the requests.
        The profile will be created with the user automatically.
        """
        faker = Faker('pt_BR')

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

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )
        self.employer_group = Group.objects.create(name='Employer Group', owner=self.user, main=True, created_by=self.user)
        self.client_obj.groups = self.employer_group
        self.client_obj.save()

        self.url = reverse('profiles-list')  # URL for the user list endpoint
        self.detail_url = reverse('profile-detail', args=[self.user.id])  # URL for the user detail endpoint
        self.client.login(username=self.user_data['username'], password=self.user_data['password'])

        # Creation profiles from users-list endpoint
        self.users = []
        self.profiles = []

        # Data for the users to be created
        user_data_list = [
            {
                "username": "testuser1",
                "password": "password1",
                "password2": "password1",
                "first_name": "Test",
                "last_name": "User1",
                "email": "testuser1@example.com",
                "client_code": self.client_obj.client_code
            },
            {
                "username": "testuser2",
                "password": "password2",
                "password2": "password2",
                "first_name": "Test",
                "last_name": "User2",
                "email": "testuser2@example.com",
                "client_code": self.client_obj.client_code
            },
            {
                "username": "testuser3",
                "password": "password3",
                "password2": "password3",
                "first_name": "Test",
                "last_name": "User3",
                "email": "testuser3@example.com",
                "client_code": self.client_obj.client_code
            }
        ]

        # Create users and their profiles
        for user_data in user_data_list:
            # Create user through the 'users-list' endpoint
            response = self.client.post(reverse('users-list'), user_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_profiles(self):
        """
        Test the GET request for listing profiles.
        The test ensures that only authenticated users can access the list.
        """
        # Obtain the JWT token (login)
        login_data = {
            "username": "testuser",
            "password": "testpassword123"
        }
        login_response = self.client.post(reverse('token_obtain_pair'), login_data, format='json')
        access_token = login_response.data['access']  # Accessing the token

        # Add the JWT token to the request header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + access_token)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)  # Expecting 2 profiles in the list


class ProfileAPIViewTestCase(APITestCase):
    """
    Test the ProfileAPIView (RetrieveUpdateAPIView).
    This test covers the 'GET' and 'PUT' methods for retrieving and updating a profile.
    """

    def setUp(self):
        """
        Setup a user, authenticate the test client, and create a profile for testing.
        The profile will be created with the user automatically.
        """
        # Create a temporary directory for MEDIA_ROOT if running tests
        faker = Faker('pt_BR')
        self.temp_media_root = tempfile.mkdtemp()
        settings.MEDIA_ROOT = self.temp_media_root  # Change MEDIA_ROOT to the temp directory during tests

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
        self.url = reverse('profiles-list')  # URL for the user list endpoint
        self.client.login(username=self.user_data['username'], password=self.user_data['password'])

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj=faker.unique.cnpj(),
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.employer_group = Group.objects.create(name='Employer Group', owner=self.user, main=True, created_by=self.user)
        self.client_obj.groups = self.employer_group
        self.client_obj.save()

        # Creation profiles from users-list endpoint
        self.users = []
        self.profiles = []

        # Data for the users to be created
        user_data_list = [
            {
                "username": "testuser1",
                "password": "password1",
                "password2": "password1",
                "first_name": "Test",
                "last_name": "User1",
                "email": "testuser1@example.com",
                "client_code": self.client_obj.client_code
            },
            {
                "username": "testuser2",
                "password": "password2",
                "password2": "password2",
                "first_name": "Test",
                "last_name": "User2",
                "email": "testuser2@example.com",
                "client_code": self.client_obj.client_code
            },
            {
                "username": "testuser3",
                "password": "password3",
                "password2": "password3",
                "first_name": "Test",
                "last_name": "User3",
                "email": "testuser3@example.com",
                "client_code": self.client_obj.client_code
            }
        ]

        # Create users and their profiles
        for user_data in user_data_list:
            # Create user through the 'users-list' endpoint
            response = self.client.post(reverse('users-list'), user_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.detail_url = reverse('profile-detail', args=[response.data['profile_id']])  # URL for the user detail endpoint
        self.user_id = response.data['id']

    def test_get_profile(self):
        """
        Test the GET request for retrieving a single profile.
        The test ensures that the profile details are correctly returned for authenticated users.
        """
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['height'], None)
        self.assertEqual(response.data['weight'], None)
        self.assertEqual(response.data['photo'], None)

    def test_update_profile(self):
        """
        Test the PUT request for updating a profile.
        The test ensures that authenticated users can update their profile data,
        including updating the photo.
        """
        # Gera uma imagem PNG 1x1 válida em memória
        image_io = io.BytesIO()
        img = Image.new("RGBA", (1, 1), (255, 0, 0, 0))
        img.save(image_io, format="PNG")
        image_io.seek(0)
        image_content = image_io.read()

        image = SimpleUploadedFile(
            name='testphoto.png',
            content=image_content,
            content_type='image/png'
        )

        # Prepare data to update profile
        data = {
            "user": self.user.id,
            'height': 178,
            'weight': 80,
            'photo': image  # Adding the photo to the data
        }

        # Send PUT request with the image and other data
        response = self.client.put(self.detail_url, data, format='multipart')

        # Ensure the response is OK (200)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check if the height and weight were updated
        self.assertEqual(response.data['height'], 178)
        self.assertEqual(response.data['weight'], 80)

        # Check if the photo was uploaded
        self.assertTrue('photo' in response.data)

        # Check if the photo URL contains the expected path (relative URL to the media folder)
        self.assertTrue(response.data['photo'].startswith('http://testserver/media/profile_photos/testphoto'))

        # After the test, delete the photo file using default_storage
        photo_path = os.path.join(settings.MEDIA_ROOT, response.data['photo'][6:])  # Removing '/media' part
        if os.path.exists(photo_path):
            default_storage.delete(photo_path)  # Using Django's storage backend to delete the file

    def test_delete_profile_not_allowed(self):
        """
        Test the DELETE request for profile, which is not allowed.
        The test ensures that the 'DELETE' method is rejected with a 405 Method Not Allowed response.
        """
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def tearDown(self):
        """
        Cleanup the temporary media folder after tests.
        """
        # Remove the temporary media directory after tests are done
        if os.path.exists(self.temp_media_root):
            os.rmdir(self.temp_media_root)  # Delete the temporary media folder


class ProfileUnauthorizedAccessTestCase(APITestCase):
    """
    Test unauthorized access to the profile-related views.
    This test ensures that unauthenticated users cannot access the endpoints.
    """

    def setUp(self):
        """
        Create a profile for testing without authenticating the client.
        The profile will be created with the user automatically.
        """
        faker = Faker('pt_BR')
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
        self.url = reverse('profiles-list')  # URL for the user list endpoint
        self.client.login(username=self.user_data['username'], password=self.user_data['password'])

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj=faker.unique.cnpj(),
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.employer_group = Group.objects.create(name='Employer Group', owner=self.user, main=True, created_by=self.user)
        self.client_obj.groups = self.employer_group
        self.client_obj.save()

        # Creation profiles from users-list endpoint
        self.users = []
        self.profiles = []

        # Data for the users to be created
        user_data_list = [
            {
                "username": "testuser1",
                "password": "password1",
                "password2": "password1",
                "first_name": "Test",
                "last_name": "User1",
                "email": "testuser1@example.com",
                "client_code": self.client_obj.client_code
            },
            {
                "username": "testuser2",
                "password": "password2",
                "password2": "password2",
                "first_name": "Test",
                "last_name": "User2",
                "email": "testuser2@example.com",
                "client_code": self.client_obj.client_code
            },
            {
                "username": "testuser3",
                "password": "password3",
                "password2": "password3",
                "first_name": "Test",
                "last_name": "User3",
                "email": "testuser3@example.com",
                "client_code": self.client_obj.client_code
            }
        ]

        # Create users and their profiles
        for user_data in user_data_list:
            # Create user through the 'users-list' endpoint
            response = self.client.post(reverse('users-list'), user_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.detail_url = reverse('profile-detail', args=[response.data['profile_id']])  # URL for the user detail endpoint

        self.client.logout()

    def test_list_profiles_unauthorized(self):
        """
        Test that unauthenticated users cannot list profiles.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_unauthorized(self):
        """
        Test that unauthenticated users cannot retrieve a profile.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile_unauthorized(self):
        """
        Test that unauthenticated users cannot update a profile.
        """
        data = {'name': 'John Updated', 'email': 'john.updated@example.com'}
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
