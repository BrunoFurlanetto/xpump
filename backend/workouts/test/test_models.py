from datetime import timedelta, datetime
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

from workouts.models import WorkoutCheckin, WorkoutCheckinProof, WorkoutPlan, WorkoutStreak
from status.models import Status
from profiles.models import Profile


class WorkoutCheckinModelTest(TestCase):
    def setUp(self):
        """Configuração inicial para os testes"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        # Criar profile para o usuário
        self.profile = Profile.objects.create(user=self.user)

        # Criar status necessário
        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

        # Criar workout streak
        self.workout_streak = WorkoutStreak.objects.create(
            user=self.user,
            current_streak=0,
            longest_streak=0
        )

    def test_workout_checkin_creation(self):
        """Testa criação básica de um check-in"""
        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            location='Academia Central',
            comments='Treino de peito e tríceps',
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        self.assertEqual(checkin.user, self.user)
        self.assertEqual(checkin.location, 'Academia Central')
        self.assertEqual(checkin.multiplier, 1.0)
        self.assertIsNotNone(checkin.base_points)
        self.assertEqual(checkin.validation_status, self.status)

    def test_workout_checkin_str_method(self):
        """Testa o método __str__ do WorkoutCheckin"""
        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        expected_str = f'Workout check-in for {self.user}'
        self.assertEqual(str(checkin), expected_str)

    def test_workout_checkin_future_date_validation(self):
        """Testa validação de data futura"""
        future_date = timezone.now() + timedelta(days=1)

        with self.assertRaises(ValidationError):
            checkin = WorkoutCheckin(
                user=self.user,
                workout_date=future_date,
                duration=timedelta(minutes=60)
            )
            checkin.full_clean()

    def test_workout_checkin_negative_duration_validation(self):
        """Testa validação de duração negativa"""
        with self.assertRaises(ValidationError):
            checkin = WorkoutCheckin(
                user=self.user,
                workout_date=timezone.now() - timedelta(hours=1),
                duration=timedelta(minutes=-30)
            )
            checkin.full_clean()

    def test_workout_checkin_overlapping_validation(self):
        """Testa validação de sobreposição de check-ins"""
        base_time = timezone.now() - timedelta(hours=2)

        # Criar primeiro check-in
        checkin1 = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=base_time,
            duration=timedelta(minutes=60)
        )

        # Tentar criar check-in sobreposto
        with self.assertRaises(ValidationError):
            checkin2 = WorkoutCheckin(
                user=self.user,
                workout_date=base_time + timedelta(minutes=30),
                duration=timedelta(minutes=60)
            )
            checkin2.full_clean()

    def test_multiplier_calculation_levels(self):
        """Testa cálculo do multiplicador baseado no streak"""
        test_cases = [
            (3, 1.0),    # < 5 check-ins
            (7, 1.25),   # 5-9 check-ins
            (15, 1.50),  # 10-19 check-ins
            (25, 1.75),  # 20-39 check-ins
            (50, 2.0),   # 40-79 check-ins
        ]

        for streak, expected_multiplier in test_cases:
            with self.subTest(streak=streak):
                self.workout_streak.current_streak = streak
                self.workout_streak.save()

                checkin = WorkoutCheckin.objects.create(
                    user=self.user,
                    workout_date=timezone.now() - timedelta(hours=1),
                    duration=timedelta(minutes=60)
                )

                self.assertEqual(checkin.multiplier, expected_multiplier)
                checkin.delete()  # Limpar para próximo teste

    def test_base_points_calculation(self):
        """Testa cálculo dos pontos base"""
        duration_minutes = 60
        multiplier = 1

        self.workout_streak.current_streak = 15  # Para ter multiplier 1.5
        self.workout_streak.save()

        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=duration_minutes)
        )

        # O modelo multiplica duration por 60 no save, então temos que ajustar
        # Fórmula: 10 * ((duration_total_seconds / 60) / 50) * multiplier
        # Como duration é multiplicado por 60 no save: duration_minutes * 60 = seconds
        expected_points = float(40 * ((duration_minutes * 60 / 60) / 50)) * multiplier
        self.assertEqual(checkin.base_points, expected_points)

    def test_profile_score_update(self):
        """Testa atualização da pontuação do perfil"""
        initial_score = self.profile.score

        checkin = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        self.profile.refresh_from_db()
        self.assertGreater(self.profile.score, initial_score)
        self.assertEqual(self.profile.score, initial_score + checkin.base_points)


class WorkoutCheckinProofModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        Profile.objects.create(user=self.user, score=0)

        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

        WorkoutStreak.objects.create(user=self.user)

        self.checkin = WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

    def test_workout_checkin_proof_creation(self):
        """Testa criação de prova de check-in"""
        # Simular upload de arquivo
        test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content",
            content_type="image/jpeg"
        )

        proof = WorkoutCheckinProof.objects.create(
            checkin=self.checkin,
            file=test_file
        )

        self.assertEqual(proof.checkin, self.checkin)
        self.assertTrue(proof.file.name.endswith('.jpg'))

    def test_workout_checkin_proof_relationship(self):
        """Testa relacionamento entre checkin e proofs"""
        test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content",
            content_type="image/jpeg"
        )

        proof = WorkoutCheckinProof.objects.create(
            checkin=self.checkin,
            file=test_file
        )

        self.assertIn(proof, self.checkin.proofs.all())


class WorkoutPlanModelTest(TestCase):
    def setUp(self):
        self.today = timezone.now().date()

    def test_workout_plan_creation(self):
        """Testa criação de plano de treino"""
        plan = WorkoutPlan.objects.create(
            title='Plano de Hipertrofia',
            start_plan=self.today,
            end_plan=self.today + timedelta(days=30),
            pdf_file=SimpleUploadedFile("plan.pdf", b"pdf_content", content_type="application/pdf")
        )

        self.assertEqual(plan.title, 'Plano de Hipertrofia')
        self.assertTrue(plan.is_active)
        self.assertFalse(plan.lifetime)

    def test_workout_plan_str_method(self):
        """Testa método __str__ do WorkoutPlan"""
        plan = WorkoutPlan.objects.create(
            title='Plano de Definição',
            start_plan=self.today,
            end_plan=self.today + timedelta(days=30),
            pdf_file=SimpleUploadedFile("plan.pdf", b"pdf_content", content_type="application/pdf")
        )

        self.assertEqual(str(plan), 'Plano de Definição')

    def test_workout_plan_lifetime_option(self):
        """Testa opção de plano vitalício"""
        plan = WorkoutPlan.objects.create(
            title='Plano Vitalício',
            start_plan=self.today,
            end_plan=self.today + timedelta(days=365),
            lifetime=True,
            pdf_file=SimpleUploadedFile("plan.pdf", b"pdf_content", content_type="application/pdf")
        )

        self.assertTrue(plan.lifetime)


class WorkoutStreakModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        Profile.objects.create(user=self.user, score=0)

        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

    def test_workout_streak_creation(self):
        """Testa criação de streak"""
        streak = WorkoutStreak.objects.create(user=self.user)

        self.assertEqual(streak.user, self.user)
        self.assertEqual(streak.current_streak, 0)
        self.assertEqual(streak.longest_streak, 0)
        self.assertEqual(streak.frequency, 3)

    def test_workout_streak_str_method(self):
        """Testa método __str__ do WorkoutStreak"""
        streak = WorkoutStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=10
        )

        expected_str = f"Streak of {self.user.username}: 5 (Máx: 10)"
        self.assertEqual(str(streak), expected_str)

    def test_update_streak_first_workout(self):
        """Testa atualização de streak no primeiro treino"""
        streak = WorkoutStreak.objects.create(user=self.user)
        workout_date = timezone.now()

        result = streak.update_streak(workout_date)

        self.assertEqual(result, 1)
        self.assertEqual(streak.current_streak, 1)
        self.assertEqual(streak.longest_streak, 1)
        self.assertEqual(streak.last_workout_datetime, workout_date)

    def test_update_streak_consecutive_workouts(self):
        """Testa atualização de streak em treinos consecutivos"""
        streak = WorkoutStreak.objects.create(user=self.user)

        # Calcular a quarta-feira mais próxima no passado
        today = timezone.now()
        days_since_wednesday = (today.weekday() - 2) % 7  # 2 = quarta-feira (0=segunda, 1=terça, 2=quarta...)
        if days_since_wednesday == 0:  # Se hoje é quarta, pegar quarta da semana passada
            days_since_wednesday = 7

        # Primeiro treino - sempre numa quarta-feira
        first_workout = today - timedelta(days=days_since_wednesday)
        streak.update_streak(first_workout)

        # Segundo treino - dia seguinte (quinta-feira)
        second_workout = first_workout + timedelta(days=1)
        result = streak.update_streak(second_workout)

        self.assertEqual(result, 2)
        self.assertEqual(streak.current_streak, 2)
        self.assertEqual(streak.longest_streak, 2)

    def test_streak_reset_after_gap(self):
        """Testa reset do streak após intervalo longo"""
        streak = WorkoutStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=5,
            last_workout_datetime=timezone.now() - timedelta(weeks=2)
        )

        # Simular treino após gap longo
        new_workout = timezone.now()
        result = streak.update_streak(new_workout)

        self.assertEqual(result, 1)
        self.assertEqual(streak.current_streak, 1)
        self.assertEqual(streak.longest_streak, 5)  # Mantém o recorde

    def test_check_streak_ended_current_week(self):
        """Testa verificação de streak na semana atual"""
        streak = WorkoutStreak.objects.create(
            user=self.user,
            frequency=3,
            last_workout_datetime=timezone.now() - timedelta(days=2)
        )

        # Criar alguns check-ins na semana atual
        for i in range(2):
            WorkoutCheckin.objects.create(
                user=self.user,
                workout_date=timezone.now() - timedelta(days=i),
                duration=timedelta(minutes=60)
            )

        # Com 2 check-ins e frequência 3, streak não deve ter terminado ainda
        self.assertFalse(streak.check_streak_ended())

    def test_check_streak_ended_insufficient_frequency(self):
        """Testa verificação de streak com frequência insuficiente"""
        streak = WorkoutStreak.objects.create(
            user=self.user,
            frequency=5,
        )

        # Criar apenas 1 check-in na semana atual (insuficiente para frequência 5)
        WorkoutCheckin.objects.create(
            user=self.user,
            workout_date=timezone.now() - timedelta(days=1),
            duration=timedelta(minutes=60)
        )

        days_since_sunday = (timezone.now() - timedelta(days=1)).weekday() + 1

        if days_since_sunday == 7:
            days_since_sunday = 0

        week_start = timezone.now() - timedelta(days=1) - timedelta(days=days_since_sunday)
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

        # Com frequência insuficiente e último treino fora da semana, streak deve ter terminado
        self.assertTrue(streak.check_streak_ended(week_end + timedelta(days=1)))
