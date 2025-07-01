import json
from io import BytesIO

from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework import status
from rest_framework.test import APITestCase

from PIL import Image

User = get_user_model()


class RegistrationTestCase(APITestCase):
    def setUp(self):
        # usa o name='profile-register' definido em profiles/urls.py
        self.url = reverse('profile-register')

    def _make_image(self):
        """
        Gera um PNG válido em memória para upload via SimpleUploadedFile.
        """
        buf = BytesIO()
        img = Image.new('RGB', (10, 10), color='white')
        img.save(buf, format='PNG')
        buf.seek(0)
        return SimpleUploadedFile('test.png', buf.read(), content_type='image/png')

    def test_register_user_with_profile(self):
        """
        Deve criar User + Profile e retornar 201 com os dados corretos.
        """
        img_file = self._make_image()
        payload = {
            'first_name': 'John',
            'last_name': 'Doe',
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'strongpassword',
            'password2': 'strongpassword',
            'profile.height': '180',
            'profile.weight': '75',
            'profile.notification_preferences': json.dumps({'email': True}),
            'profile.photo': img_file,
        }

        # form-data multipart para aceitar arquivo
        response = self.client.post(self.url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        # checa estrutura da resposta
        self.assertIn('id', data)
        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['email'], 'test@example.com')

        prof = data['profile']
        self.assertEqual(prof['height'], 180)
        self.assertEqual(prof['weight'], 75)
        self.assertEqual(prof['notification_preferences'], {'email': True})
        # URL da foto deve terminar em .png
        self.assertTrue(prof['photo'].endswith('.png'))

        # e garante que os objetos foram realmente persistidos
        user = User.objects.get(username='testuser')
        self.assertTrue(user.check_password('strongpassword'))
        self.assertEqual(user.profile.height, 180)
        self.assertEqual(user.profile.weight, 75)
        self.assertDictEqual(user.profile.notification_preferences, {'email': True})
        self.assertTrue(user.profile.photo.name.endswith('test.png'))
