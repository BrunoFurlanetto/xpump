from django.urls import reverse
from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class RegistrationTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('profile-register')

    def test_register_requires_first_and_last_name(self):
        # Caso falte first_name
        payload = {
            "username": "user1",
            "email": "u1@example.com",
            "password": "abc12345",
            "password2": "abc12345",
            "last_name": "Sobrenome"
        }
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('first_name', resp.data)

        # Caso falte last_name
        payload = {
            "username": "user2",
            "email": "u2@example.com",
            "password": "abc12345",
            "password2": "abc12345",
            "first_name": "Nome"
        }
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('last_name', resp.data)

    def test_successful_registration_creates_user_and_profile(self):
        payload = {
            "username": "user3",
            "email": "u3@example.com",
            "first_name": "João",
            "last_name": "Silva",
            "password": "abc12345",
            "password2": "abc12345"
        }
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        data = resp.json()
        self.assertEqual(data['first_name'], 'João')
        self.assertEqual(data['last_name'], 'Silva')

        # Verifica persistência
        user = User.objects.get(username='user3')
        self.assertEqual(user.first_name, 'João')
        self.assertEqual(user.last_name, 'Silva')
        # Profile criado com defaults
        self.assertIsNotNone(user.profile)
