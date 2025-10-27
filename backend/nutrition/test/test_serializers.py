from datetime import datetime, time, date, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import serializers
from rest_framework.test import APITestCase

from clients.models import Client
from gamification.models import Season
from nutrition.models import Meal, MealConfig, MealStreak, MealProof, NutritionPlan
from nutrition.serializer import MealConfigSerializer, MealProofSerializer, MealSerializer, NutritionPlanSerializer
from status.models import Status
from profiles.models import Profile


class MealConfigSerializerTest(TestCase):
    """
    Test cases for MealConfigSerializer
    """

    def setUp(self):
        """Set up test data"""
        self.meal_config_data = {
            'meal_name': 'breakfast',
            'interval_start': time(7, 0),
            'interval_end': time(10, 0),
            'description': 'Primeira refeição do dia'
        }

        self.meal_config = MealConfig.objects.create(**self.meal_config_data)

    def test_meal_config_serializer_serialization(self):
        """Test serializing MealConfig instance"""
        serializer = MealConfigSerializer(instance=self.meal_config)
        data = serializer.data

        self.assertEqual(data['meal_name'], 'breakfast')
        self.assertEqual(data['interval_start'], '07:00:00')
        self.assertEqual(data['interval_end'], '10:00:00')
        self.assertEqual(data['description'], 'Primeira refeição do dia')

    def test_meal_config_serializer_deserialization(self):
        """Test deserializing data to MealConfig"""
        data = {
            'meal_name': 'lunch',
            'interval_start': '12:00:00',
            'interval_end': '14:00:00',
            'description': 'Almoço'
        }

        serializer = MealConfigSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        meal_config = serializer.save()
        self.assertEqual(meal_config.meal_name, 'lunch')
        self.assertEqual(meal_config.interval_start, time(12, 0))
        self.assertEqual(meal_config.interval_end, time(14, 0))
        self.assertEqual(meal_config.description, 'Almoço')

    def test_meal_config_serializer_invalid_meal_name(self):
        """Test validation with invalid meal_name"""
        data = {
            'meal_name': 'invalid_meal',
            'interval_start': '12:00:00',
            'interval_end': '14:00:00'
        }

        serializer = MealConfigSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('meal_name', serializer.errors)

    def test_meal_config_serializer_missing_required_fields(self):
        """Test validation with missing required fields"""
        data = {
            'meal_name': 'breakfast'
            # Missing interval_start and interval_end
        }

        serializer = MealConfigSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('interval_start', serializer.errors)
        self.assertIn('interval_end', serializer.errors)

    def test_meal_config_serializer_optional_description(self):
        """Test that description is optional"""
        data = {
            'meal_name': 'snack',
            'interval_start': '15:00:00',
            'interval_end': '17:00:00'
        }

        serializer = MealConfigSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        meal_config = serializer.save()
        self.assertIsNone(meal_config.description)


class MealProofSerializerTest(TestCase):
    """
    Test cases for MealProofSerializer
    """

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.employer = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user,
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

        # Create profile
        self.profile = Profile.objects.create(
            user=self.user,
            score=0,
            height=175,
            weight=70,
            employer=self.employer
        )

        # Create MealConfig
        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(7, 0),
            interval_end=time(10, 0)
        )

        # Create Status
        self.status = Status.objects.create(
            app_name='NUTRITION',
            action='PUBLISHED',
            is_active=True
        )

        # Create Meal
        self.meal = Meal.objects.create(
            user=self.user,
            meal_type=self.meal_config,
            meal_time=datetime(2025, 8, 27, 8, 30)
        )

        # Create MealProof
        self.image_file = SimpleUploadedFile(
            "test_meal.jpg",
            b'fake image content',
            content_type="image/jpeg"
        )

        self.meal_proof = MealProof.objects.create(
            checkin=self.meal,
            file=self.image_file
        )

    def test_meal_proof_serializer_serialization(self):
        """Test serializing MealProof instance"""
        serializer = MealProofSerializer(instance=self.meal_proof)
        data = serializer.data

        self.assertIn('id', data)
        self.assertIn('file', data)
        self.assertEqual(data['id'], self.meal_proof.id)

    def test_meal_proof_serializer_read_only_fields(self):
        """Test that id field is read-only"""
        serializer = MealProofSerializer()
        self.assertIn('id', serializer.Meta.read_only_fields)

    def test_meal_proof_serializer_fields(self):
        """Test that serializer includes correct fields"""
        serializer = MealProofSerializer()
        expected_fields = ['id', 'file']
        self.assertEqual(serializer.Meta.fields, expected_fields)


class MealSerializerTest(TestCase):
    """
    Test cases for MealSerializer
    """

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.employer = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user,
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

        # Create profile
        self.profile = Profile.objects.create(
            user=self.user,
            score=0,
            height=175,
            weight=70,
            employer=self.employer
        )

        # Create MealConfig
        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(7, 0),
            interval_end=time(10, 0)
        )

        # Create Status
        self.status = Status.objects.create(
            app_name='NUTRITION',
            action='PUBLISHED',
            is_active=True
        )

        # Create MealStreak
        self.meal_streak = MealStreak.objects.create(
            user=self.user,
            current_streak=4,
            longest_streak=10,
            last_meal_datetime=datetime(2025, 8, 26, 8, 30)
        )

        # Create Meal
        self.meal = Meal.objects.create(
            user=self.user,
            meal_type=self.meal_config,
            meal_time=datetime(2025, 8, 27, 8, 30),
            comments='Refeição saudável'
        )

    def test_meal_serializer_serialization(self):
        """Test serializing Meal instance"""
        serializer = MealSerializer(instance=self.meal)
        data = serializer.data

        self.assertEqual(data['id'], self.meal.id)
        self.assertEqual(data['user'], self.user.id)
        self.assertEqual(data['meal_type'], self.meal_config.id)
        self.assertEqual(data['comments'], 'Refeição saudável')
        self.assertIn('current_streak', data)
        self.assertIn('longest_streak', data)
        self.assertIn('proofs', data)

    def test_meal_serializer_read_only_fields(self):
        """Test that certain fields are read-only"""
        serializer = MealSerializer()
        expected_read_only = ('user', 'base_points', 'multiplier', 'validation_status')

        for field in expected_read_only:
            self.assertIn(field, serializer.Meta.read_only_fields)

    def test_meal_serializer_current_streak_method(self):
        """Test current_streak SerializerMethodField"""
        serializer = MealSerializer(instance=self.meal)
        data = serializer.data
        print(data)
        self.assertEqual(data['current_streak'], 4)

    def test_meal_serializer_longest_streak_method(self):
        """Test longest_streak SerializerMethodField"""
        self.meal_streak.refresh_from_db()

        serializer = MealSerializer(instance=self.meal)
        data = serializer.data

        self.assertEqual(data['longest_streak'], 10)

    def test_meal_serializer_with_proofs(self):
        """Test serialization with meal proofs"""
        # Add proof to meal
        image_file = SimpleUploadedFile(
            "test_meal.jpg",
            b'fake image content',
            content_type="image/jpeg"
        )

        proof = MealProof.objects.create(
            checkin=self.meal,
            file=image_file
        )

        serializer = MealSerializer(instance=self.meal)
        data = serializer.data

        self.assertIn('proofs', data)
        self.assertEqual(len(data['proofs']), 1)
        self.assertEqual(data['proofs'][0]['id'], proof.id)

    def test_meal_serializer_create_validation(self):
        """Test validation during create operation"""
        data = {
            'meal_type': self.meal_config.id,
            'meal_time': '2025-08-28T08:30:00Z',
            'comments': 'Nova refeição'
        }

        serializer = MealSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_meal_serializer_update_validation_allowed_fields(self):
        """Test that only comments can be updated"""
        data = {
            'comments': 'Comentário atualizado'
        }

        serializer = MealSerializer(instance=self.meal, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

    def test_meal_serializer_update_validation_forbidden_fields(self):
        """Test that forbidden fields cannot be updated"""
        data = {
            'meal_type': self.meal_config.id,
            'meal_time': '2025-08-28T08:30:00Z',
            'comments': 'Comentário atualizado'
        }

        serializer = MealSerializer(instance=self.meal, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('Only comments can be updated.', str(serializer.errors))

    def test_meal_serializer_proof_files_field(self):
        """Test proof_files write-only field"""
        # Create fake files
        file1 = SimpleUploadedFile(
            "test1.jpg",
            b'fake content 1',
            content_type="image/jpeg"
        )
        file2 = SimpleUploadedFile(
            "test2.png",
            b'fake content 2',
            content_type="image/png"
        )

        data = {
            'meal_type': self.meal_config.id,
            'meal_time': '2025-08-28T08:30:00Z',
            'proof_files': [file1, file2]
        }

        serializer = MealSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_meal_serializer_proof_files_invalid_extension(self):
        """Test validation of proof_files with invalid extensions"""
        invalid_file = SimpleUploadedFile(
            "test.txt",
            b'fake content',
            content_type="text/plain"
        )

        data = {
            'meal_type': self.meal_config.id,
            'meal_time': '2025-08-28T08:30:00Z',
            'proof_files': [invalid_file]
        }

        serializer = MealSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_meal_serializer_proof_files_optional(self):
        """Test that proof_files field is optional"""
        data = {
            'meal_type': self.meal_config.id,
            'meal_time': '2025-08-28T08:30:00Z',
            'comments': 'Sem fotos'
        }

        serializer = MealSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class NutritionPlanSerializerTest(TestCase):
    """
    Test cases for NutritionPlanSerializer
    """

    def setUp(self):
        """Set up test data"""
        self.pdf_file = SimpleUploadedFile(
            "nutrition_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        self.nutrition_plan_data = {
            'title': 'Plano de Nutrição para Ganho de Massa',
            'is_active': True,
            'start_plan': date(2025, 8, 27),
            'end_plan': date(2025, 12, 31),
            'lifetime': False
        }

        self.nutrition_plan = NutritionPlan.objects.create(
            pdf_file=self.pdf_file,
            **self.nutrition_plan_data
        )

    def test_nutrition_plan_serializer_serialization(self):
        """Test serializing NutritionPlan instance"""
        serializer = NutritionPlanSerializer(instance=self.nutrition_plan)
        data = serializer.data

        self.assertEqual(data['title'], 'Plano de Nutrição para Ganho de Massa')
        self.assertTrue(data['is_active'])
        self.assertEqual(data['start_plan'], '2025-08-27')
        self.assertEqual(data['end_plan'], '2025-12-31')
        self.assertFalse(data['lifetime'])
        self.assertIn('pdf_file', data)

    def test_nutrition_plan_serializer_deserialization(self):
        """Test deserializing data to NutritionPlan"""
        pdf_file = SimpleUploadedFile(
            "new_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        data = {
            'title': 'Novo Plano de Nutrição',
            'is_active': True,
            'pdf_file': pdf_file,
            'start_plan': '2025-09-01',
            'end_plan': '2025-12-31',
            'lifetime': False
        }

        serializer = NutritionPlanSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        nutrition_plan = serializer.save()
        self.assertEqual(nutrition_plan.title, 'Novo Plano de Nutrição')
        self.assertTrue(nutrition_plan.is_active)
        self.assertEqual(nutrition_plan.start_plan, date(2025, 9, 1))
        self.assertEqual(nutrition_plan.end_plan, date(2025, 12, 31))
        self.assertFalse(nutrition_plan.lifetime)

    def test_nutrition_plan_serializer_read_only_fields(self):
        """Test that id field is read-only"""
        serializer = NutritionPlanSerializer()
        self.assertIn('id', serializer.Meta.read_only_fields)

    def test_nutrition_plan_serializer_pdf_validation_valid_file(self):
        """Test PDF file validation with valid PDF"""
        pdf_file = SimpleUploadedFile(
            "valid_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        data = {
            'title': 'Plano Válido',
            'pdf_file': pdf_file,
            'start_plan': '2025-09-01',
            'end_plan': '2025-12-31'
        }

        serializer = NutritionPlanSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_nutrition_plan_serializer_pdf_validation_invalid_file(self):
        """Test PDF file validation with invalid file"""
        invalid_file = SimpleUploadedFile(
            "invalid_plan.txt",
            b'fake text content',
            content_type="text/plain"
        )

        data = {
            'title': 'Plano Inválido',
            'pdf_file': invalid_file,
            'start_plan': '2025-09-01',
            'end_plan': '2025-12-31'
        }

        serializer = NutritionPlanSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('pdf_file', serializer.errors)
        self.assertIn('A extensão de arquivo “txt” não é permitida', str(serializer.errors['pdf_file']))

    def test_nutrition_plan_serializer_pdf_validation_no_extension(self):
        """Test PDF file validation with file without extension"""
        no_extension_file = SimpleUploadedFile(
            "no_extension",
            b'fake content',
            content_type="application/pdf"
        )

        data = {
            'title': 'Plano Sem Extensão',
            'pdf_file': no_extension_file,
            'start_plan': '2025-09-01',
            'end_plan': '2025-12-31'
        }

        serializer = NutritionPlanSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('pdf_file', serializer.errors)

    def test_nutrition_plan_serializer_required_fields(self):
        """Test validation with missing required fields"""
        data = {
            'title': 'Plano Incompleto'
            # Missing pdf_file, start_plan, end_plan
        }

        serializer = NutritionPlanSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('pdf_file', serializer.errors)
        self.assertIn('start_plan', serializer.errors)
        self.assertIn('end_plan', serializer.errors)

    def test_nutrition_plan_serializer_default_values(self):
        """Test serializer with default values"""
        pdf_file = SimpleUploadedFile(
            "default_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        data = {
            'title': 'Plano com Defaults',
            'pdf_file': pdf_file,
            'start_plan': '2025-09-01',
            'end_plan': '2025-12-31'
            # Not providing is_active and lifetime to test defaults
        }

        serializer = NutritionPlanSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        nutrition_plan = serializer.save()
        self.assertTrue(nutrition_plan.is_active)  # Default is True
        self.assertFalse(nutrition_plan.lifetime)  # Default is False

    def test_nutrition_plan_serializer_all_fields(self):
        """Test that serializer includes all expected fields"""
        serializer = NutritionPlanSerializer()
        self.assertEqual(serializer.Meta.fields, '__all__')

    def test_nutrition_plan_serializer_lifetime_plan(self):
        """Test serializing a lifetime plan"""
        pdf_file = SimpleUploadedFile(
            "lifetime_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        data = {
            'title': 'Plano Vitalício',
            'pdf_file': pdf_file,
            'start_plan': '2025-09-01',
            'end_plan': '2025-12-31',
            'lifetime': True
        }

        serializer = NutritionPlanSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        nutrition_plan = serializer.save()
        self.assertTrue(nutrition_plan.lifetime)

    def test_nutrition_plan_serializer_inactive_plan(self):
        """Test serializing an inactive plan"""
        pdf_file = SimpleUploadedFile(
            "inactive_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        data = {
            'title': 'Plano Inativo',
            'pdf_file': pdf_file,
            'start_plan': '2025-09-01',
            'end_plan': '2025-12-31',
            'is_active': False
        }

        serializer = NutritionPlanSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        nutrition_plan = serializer.save()
        self.assertFalse(nutrition_plan.is_active)
