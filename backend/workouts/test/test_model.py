from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from workouts.models import WorkoutCheckin, User, Status
from workouts.models import CheckinTypes  # Supondo que CheckinTypes seja uma classe que define os tipos de check-in


class WorkoutCheckinTest(TestCase):
    def setUp(self):
        """
        Este método é executado antes de cada teste. Aqui, você pode criar instâncias
        de objetos necessários para os testes, como um usuário e um status.
        """
        # Criação de um usuário de teste
        self.user = User.objects.create_user(username='testuser', password='password')

        # Criando um status fictício
        self.status = Status.objects.create(
            name="Valid",
            app_name='WORKOUT',
            action='APPROVED'
        )

        # Criando uma data para o workout check-in
        self.workout_date = timezone.now()

    def test_create_checkin_with_photo(self):
        """Testa a criação de um check-in com tipo PHOTO e imagem fornecida."""
        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            check_in_type='PHOTO',
            image_proof='path/to/image.jpg',
            workout_date=self.workout_date,
            validation_status=self.status
        )

        self.assertEqual(checkin.check_in_type, 'PHOTO')
        self.assertTrue(checkin.image_proof)  # A imagem foi fornecida
        self.assertIsNone(checkin.video_proof.name)  # O vídeo não foi fornecido
        self.assertIsNone(checkin.location)  # A localização não foi fornecida

    def test_create_checkin_with_video(self):
        """Testa a criação de um check-in com tipo VIDEO e vídeo fornecido."""
        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            check_in_type='VIDEO',
            video_proof='path/to/video.mp4',
            workout_date=self.workout_date,
            validation_status=self.status
        )

        self.assertEqual(checkin.check_in_type, 'VIDEO')
        self.assertTrue(checkin.video_proof)  # O vídeo foi fornecido
        self.assertIsNone(checkin.image_proof.name)  # A imagem não foi fornecida
        self.assertIsNone(checkin.location)  # A localização não foi fornecida

    def test_create_checkin_with_geolocation(self):
        """Testa a criação de um check-in com tipo GEOLOCATION e localização fornecida."""
        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            check_in_type='GEOLOCATION',
            location='40.748817, -73.985428',  # Coordenadas fictícias
            workout_date=self.workout_date,
            validation_status=self.status
        )
        self.assertEqual(checkin.check_in_type, 'GEOLOCATION')
        self.assertEqual(checkin.location, '40.748817, -73.985428')  # Verifica se a localização foi salva
        self.assertIsNone(checkin.image_proof.name)  # A imagem não foi fornecida
        self.assertIsNone(checkin.video_proof.name)  # O vídeo não foi fornecido

    def test_create_checkin_without_required_fields_photo(self):
        """Testa a criação de um check-in com tipo PHOTO sem fornecer imagem."""
        with self.assertRaises(ValidationError):
            checkin = WorkoutCheckin(
                user=self.user,
                check_in_type='PHOTO',
                workout_date=self.workout_date,
                validation_status=self.status
            )
            checkin.save()  # Espera-se que um ValidationError seja lançado

    def test_create_checkin_without_required_fields_video(self):
        """Testa a criação de um check-in com tipo VIDEO sem fornecer vídeo."""
        with self.assertRaises(ValidationError):
            checkin = WorkoutCheckin(
                user=self.user,
                check_in_type='VIDEO',
                workout_date=self.workout_date,
                validation_status=self.status
            )
            checkin.save()  # Espera-se que um ValidationError seja lançado

    def test_create_checkin_without_required_fields_geolocation(self):
        """Testa a criação de um check-in com tipo GEOLOCATION sem fornecer localização."""
        with self.assertRaises(ValidationError):
            checkin = WorkoutCheckin(
                user=self.user,
                check_in_type='GEOLOCATION',
                workout_date=self.workout_date,
                validation_status=self.status
            )
            checkin.save()  # Espera-se que um ValidationError seja lançado

    def test_create_checkin_with_invalid_check_in_type(self):
        """Testa a criação de um check-in com tipo inválido."""
        with self.assertRaises(ValueError):
            checkin = WorkoutCheckin(
                user=self.user,
                check_in_type='INVALID_TYPE',  # Tipo inválido
                workout_date=self.workout_date,
                validation_status=self.status
            )

            checkin.save()  # Espera-se que um ValueError seja lançado

    def test_checkin_creation_with_status(self):
        """Testa se o status de validação é associado corretamente ao check-in."""
        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            check_in_type='PHOTO',
            image_proof='path/to/image.jpg',
            workout_date=self.workout_date,
            validation_status=self.status
        )
        self.assertEqual(checkin.validation_status, self.status)  # O status de validação foi associado corretamente
