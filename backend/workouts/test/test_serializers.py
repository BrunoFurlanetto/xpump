from datetime import timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase

from workouts.models import WorkoutCheckin, WorkoutCheckinProof, WorkoutPlan, WorkoutStreak
from workouts.serializer import WorkoutCheckinSerializer, WorkoutCheckinProofSerializer, WorkoutPlanSerializer
from status.models import Status
from profiles.models import Profile


class WorkoutCheckinProofSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        Profile.objects.create(user=self.user, score=0)
        WorkoutStreak.objects.create(user=self.user)

        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

        self.checkin = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

    def test_proof_serializer_fields(self):
        """Testa campos do serializer de prova"""
        test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content",
            content_type="image/jpeg"
        )

        proof = WorkoutCheckinProof.objects.create(
            checkin=self.checkin,
            file=test_file
        )

        serializer = WorkoutCheckinProofSerializer(proof)
        data = serializer.data

        self.assertIn('id', data)
        self.assertIn('file', data)
        self.assertEqual(len(data), 2)

    def test_proof_serializer_creation(self):
        """Testa criação através do serializer"""
        test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content",
            content_type="image/jpeg"
        )

        data = {
            'file': test_file
        }

        serializer = WorkoutCheckinProofSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        proof = serializer.save(checkin=self.checkin)
        self.assertEqual(proof.checkin, self.checkin)


class WorkoutCheckinSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        Profile.objects.create(user=self.user, score=0)
        self.workout_streak = WorkoutStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=10
        )

        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

    def test_checkin_serializer_fields(self):
        """Testa campos do serializer de check-in"""
        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            location='Academia Central',
            comments='Treino intenso',
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        serializer = WorkoutCheckinSerializer(checkin)
        data = serializer.data

        expected_fields = [
            'id', 'user', 'comments', 'workout_date',
            'duration', 'validation_status', 'base_points',
            'multiplier', 'proofs', 'current_streak', 'longest_streak'
        ]

        for field in expected_fields:
            self.assertIn(field, data)

    def test_checkin_serializer_read_only_fields(self):
        """Testa campos somente leitura"""
        data = {
            'user': self.user.id,
            'comments': 'Teste',
            'workout_date': timezone.now() - timedelta(hours=1),
            'duration': timedelta(minutes=60),
            'base_points': 999,  # Campo read-only
            'multiplier': 999,   # Campo read-only
            'validation_status': 999  # Campo read-only
        }

        serializer = WorkoutCheckinSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        # Os campos read-only não devem estar nos validated_data
        self.assertNotIn('base_points', serializer.validated_data)
        self.assertNotIn('multiplier', serializer.validated_data)
        self.assertNotIn('validation_status', serializer.validated_data)

    def test_checkin_serializer_with_proof_files(self):
        """Testa criação de check-in com arquivos de prova"""
        test_file1 = SimpleUploadedFile(
            "test1.jpg",
            b"file_content1",
            content_type="image/jpeg"
        )
        test_file2 = SimpleUploadedFile(
            "test2.png",
            b"file_content2",
            content_type="image/png"
        )

        data = {
            'comments': 'Treino com provas',
            'workout_date': timezone.now() - timedelta(hours=1),
            'duration': timedelta(minutes=45),
            'proof_files': [test_file1, test_file2]
        }

        serializer = WorkoutCheckinSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        checkin = serializer.save(user=self.user)
        self.assertEqual(checkin.proofs.count(), 2)

    def test_checkin_serializer_invalid_file_extension(self):
        """Testa validação de extensão de arquivo inválida"""
        test_file = SimpleUploadedFile(
            "test.txt",
            b"file_content",
            content_type="text/plain"
        )

        data = {
            'comments': 'Teste com arquivo inválido',
            'workout_date': timezone.now() - timedelta(hours=1),
            'duration': timedelta(minutes=45),
            'proof_files': [test_file]
        }

        serializer = WorkoutCheckinSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_get_current_streak_method(self):
        """Testa método get_current_streak"""
        # Ajustar o streak atual antes de criar o checkin
        self.workout_streak.current_streak = 5
        self.workout_streak.save()

        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        serializer = WorkoutCheckinSerializer(checkin)
        # O streak pode ter sido atualizado durante a criação do checkin
        current_streak = self.user.workout_streak.current_streak
        self.assertEqual(serializer.get_current_streak(checkin), current_streak)

    def test_get_longest_streak_method(self):
        """Testa método get_longest_streak"""
        # Definir o longest streak antes de criar o checkin
        self.workout_streak.longest_streak = 10
        self.workout_streak.save()

        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        serializer = WorkoutCheckinSerializer(checkin)
        # O longest streak pode ter sido atualizado
        longest_streak = self.user.workout_streak.longest_streak
        self.assertEqual(serializer.get_longest_streak(checkin), longest_streak)

    def test_get_streak_methods_without_streak(self):
        """Testa métodos de streak quando não existe WorkoutStreak"""
        # Criar usuário sem streak
        user_no_streak = User.objects.create_user(
            username='nostreak',
            email='nostreak@example.com',
            password='testpass123'
        )
        Profile.objects.create(user=user_no_streak, score=0)

        # Não criar WorkoutStreak para este usuário
        checkin = WorkoutCheckin.objects.create(
            user=user_no_streak,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        serializer = WorkoutCheckinSerializer(checkin)
        # Como um WorkoutStreak será criado automaticamente no save, verificamos o valor atual
        self.assertEqual(serializer.get_current_streak(checkin), 1)  # Primeiro check-in
        self.assertEqual(serializer.get_longest_streak(checkin), 1)  # Primeiro check-in

    def test_update_serializer_only_comments(self):
        """Testa que apenas comentários podem ser atualizados"""
        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            comments='Comentário original',
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        # Tentar atualizar apenas comentários - deve funcionar
        data = {'comments': 'Comentário atualizado'}
        serializer = WorkoutCheckinSerializer(checkin, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

        updated_checkin = serializer.save()
        self.assertEqual(updated_checkin.comments, 'Comentário atualizado')

    def test_update_serializer_other_fields_forbidden(self):
        """Testa que outros campos não podem ser atualizados"""
        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            comments='Comentário original',
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        # Tentar atualizar outros campos - deve falhar
        data = {
            'comments': 'Comentário atualizado',
            'duration': timedelta(minutes=90)
        }

        serializer = WorkoutCheckinSerializer(checkin, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('Only comments can be updated.', str(serializer.errors))


class WorkoutPlanSerializerTest(TestCase):
    def setUp(self):
        self.today = timezone.now().date()

    def test_plan_serializer_fields(self):
        """Testa campos do serializer de plano"""
        test_pdf = SimpleUploadedFile(
            "plan.pdf",
            b"pdf_content",
            content_type="application/pdf"
        )

        plan = WorkoutPlan.objects.create(
            title='Plano de Teste',
            start_plan=self.today,
            end_plan=self.today + timedelta(days=30),
            pdf_file=test_pdf
        )

        serializer = WorkoutPlanSerializer(plan)
        data = serializer.data

        expected_fields = [
            'id', 'title', 'is_active', 'pdf_file',
            'start_plan', 'end_plan', 'lifetime'
        ]

        for field in expected_fields:
            self.assertIn(field, data)

    def test_plan_serializer_creation(self):
        """Testa criação através do serializer"""
        test_pdf = SimpleUploadedFile(
            "plan.pdf",
            b"pdf_content",
            content_type="application/pdf"
        )

        data = {
            'title': 'Novo Plano',
            'start_plan': self.today,
            'end_plan': self.today + timedelta(days=60),
            'pdf_file': test_pdf,
            'lifetime': True
        }

        serializer = WorkoutPlanSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        plan = serializer.save()
        self.assertEqual(plan.title, 'Novo Plano')
        self.assertTrue(plan.lifetime)

    def test_plan_serializer_pdf_validation(self):
        """Testa validação de arquivo PDF"""
        # Arquivo não-PDF
        test_file = SimpleUploadedFile(
            "notpdf.txt",
            b"not_pdf_content",
            content_type="text/plain"
        )

        data = {
            'title': 'Plano com arquivo inválido',
            'start_plan': self.today,
            'end_plan': self.today + timedelta(days=30),
            'pdf_file': test_file
        }

        serializer = WorkoutPlanSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('pdf_file', serializer.errors)

    def test_plan_serializer_valid_pdf(self):
        """Testa validação de arquivo PDF válido"""
        test_pdf = SimpleUploadedFile(
            "valid_plan.pdf",
            b"pdf_content",
            content_type="application/pdf"
        )

        data = {
            'title': 'Plano com PDF válido',
            'start_plan': self.today,
            'end_plan': self.today + timedelta(days=30),
            'pdf_file': test_pdf
        }

        serializer = WorkoutPlanSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_plan_serializer_read_only_id(self):
        """Testa que ID é campo somente leitura"""
        test_pdf = SimpleUploadedFile(
            "plan.pdf",
            b"pdf_content",
            content_type="application/pdf"
        )

        data = {
            'id': 999,  # Campo read-only
            'title': 'Plano Teste',
            'start_plan': self.today,
            'end_plan': self.today + timedelta(days=30),
            'pdf_file': test_pdf
        }

        serializer = WorkoutPlanSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        # ID não deve estar nos validated_data
        self.assertNotIn('id', serializer.validated_data)

    def test_plan_serializer_update(self):
        """Testa atualização através do serializer"""
        test_pdf = SimpleUploadedFile(
            "plan.pdf",
            b"pdf_content",
            content_type="application/pdf"
        )

        plan = WorkoutPlan.objects.create(
            title='Plano Original',
            start_plan=self.today,
            end_plan=self.today + timedelta(days=30),
            pdf_file=test_pdf
        )

        data = {
            'title': 'Plano Atualizado',
            'is_active': False
        }

        serializer = WorkoutPlanSerializer(plan, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

        updated_plan = serializer.save()
        self.assertEqual(updated_plan.title, 'Plano Atualizado')
        self.assertFalse(updated_plan.is_active)
