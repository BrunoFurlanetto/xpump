import tempfile
from datetime import timedelta
from io import BytesIO
from PIL import Image

from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase
from faker import Faker

from clients.models import Client
from gamification.models import Season
from profiles.models import Profile
from status.models import Status

fake = Faker('pt_BR')


class SocialFeedBaseTestCase(TestCase):
    """Base test case com setup comum para testes do social feed."""

    def setUp(self):
        """Setup básico para todos os testes."""
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@test.com',
            password='testpass123',
            first_name=fake.first_name(),
            last_name=fake.last_name()
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='testpass123',
            first_name=fake.first_name(),
            last_name=fake.last_name()
        )
        self.test_client = Client.objects.create(
            name='Test Client',
            cnpj=fake.unique.cnpj(),
            owners=self.user1,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        # Create profiles
        self.user1_profile = Profile.objects.create(
            user=self.user1,
            score=0.0,
            employer=self.test_client
        )
        self.user2_profile = Profile.objects.create(
            user=self.user2,
            score=0.0,
            employer=self.test_client
        )

        self.season = Season.objects.create(
            name='Season 1',
            start_date=timezone.now() - timedelta(days=180),
            end_date=timezone.now() + timedelta(days=180),
            client=self.test_client
        )

        # Criar Status necessários
        Status.objects.get_or_create(
            app_name='POST',
            action='PUBLISHED',
            is_active=True,
            defaults={'name': 'Publicado'}
        )
        Status.objects.get_or_create(
            app_name='COMMENT',
            action='PUBLISHED',
            is_active=True,
            defaults={'name': 'Publicado'}
        )

    def create_test_image(self):
        """Criar uma imagem de teste."""
        image = Image.new('RGB', (100, 100), color='red')
        temp_file = BytesIO()
        image.save(temp_file, format='JPEG')
        temp_file.seek(0)
        return SimpleUploadedFile(
            "test_image.jpg",
            temp_file.getvalue(),
            content_type="image/jpeg"
        )


class SocialFeedAPITestCase(APITestCase):
    """Base test case para testes de API do social feed."""

    def setUp(self):
        """Setup básico para testes de API."""
        super().setUp()
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@test.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='testpass123'
        )
        self.employer = Client.objects.create(
            name='Test Client',
            cnpj=fake.unique.cnpj(),
            owners=self.user1,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.season = Season.objects.create(
            name='Season 1',
            start_date=timezone.now() - timedelta(days=180),
            end_date=timezone.now() + timedelta(days=180),
            client=self.employer
        )
        self.profile_1 = Profile.objects.create(user=self.user1, employer=self.employer)
        self.profile_2 = Profile.objects.create(user=self.user2, employer=self.employer)

        # Criar Status necessários
        Status.objects.get_or_create(
            app_name='POST',
            action='PUBLISHED',
            is_active=True,
            defaults={'name': 'Publicado'}
        )
        Status.objects.get_or_create(
            app_name='COMMENT',
            action='PUBLISHED',
            is_active=True,
            defaults={'name': 'Publicado'}
        )

    def create_test_image(self):
        """Criar uma imagem de teste."""
        image = Image.new('RGB', (100, 100), color='blue')
        temp_file = BytesIO()
        image.save(temp_file, format='JPEG')
        temp_file.seek(0)
        return SimpleUploadedFile(
            "test.jpg",
            temp_file.getvalue(),
            content_type="image/jpeg"
        )
