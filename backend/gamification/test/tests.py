from datetime import datetime, timedelta, date
from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock

from gamification.models import GamificationSettings, Season
from gamification.services import WorkoutGamification, MealGamification, Gamification
from profiles.models import Profile
from groups.models import Group, GroupMembers
from clients.models import Client
from nutrition.models import MealStreak
from workouts.models import WorkoutStreak


class GamificationSettingsModelTest(TestCase):
    """Test cases for GamificationSettings model"""

    def test_default_values(self):
        """Test default values for gamification settings"""
        settings = GamificationSettings.objects.create()

        self.assertEqual(settings.xp_base, 6)
        self.assertEqual(settings.exponential_factor, 1.5)
        self.assertEqual(settings.max_level, 50)
        self.assertEqual(settings.workout_minutes, 30)
        self.assertEqual(settings.workout_xp, 1)
        self.assertEqual(settings.meal_xp, 1)
        self.assertEqual(settings.days_to_end_month, 10)
        self.assertEqual(settings.season_bonus_percentage, 50.0)
        self.assertEqual(settings.percentage_from_first_position, 60.0)

    def test_multiplier_structures(self):
        """Test default multiplier structures"""
        settings = GamificationSettings.objects.create()

        # Test workout multiplier structure
        workout_multiplier = settings.multiplier_workout_streak
        self.assertIn("first_streak_day", workout_multiplier)
        self.assertIn("multiplier", workout_multiplier["first_streak_day"])

        # Test meal multiplier structure
        meal_multiplier = settings.multiplier_meal_streak
        self.assertIn("first_streak_day", meal_multiplier)
        self.assertIn("multiplier", meal_multiplier["first_streak_day"])


class SeasonModelTest(TestCase):
    """Test cases for Season model"""

    def setUp(self):
        self.user = User.objects.create_user(username='owner', password='pass')
        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

    def test_season_creation(self):
        """Test season creation"""
        season = Season.objects.create(
            client=self.client_obj,
            name="Test Season",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            description="Test season description"
        )

        self.assertEqual(season.name, "Test Season")
        self.assertEqual(season.client, self.client_obj)
        self.assertEqual(str(season), "Test Season")


class WorkoutGamificationTest(TestCase):
    """Test cases for WorkoutGamification service"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.profile = Profile.objects.create(user=self.user, score=100, level=1, employer=self.client_obj)

        # Create actual workout streak
        self.workout_streak = WorkoutStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=10
        )

        # Create settings for this test
        self.settings = GamificationSettings.objects.create(workout_xp=1, workout_minutes=30, max_workout_xp=4)
        self.gamification = WorkoutGamification()

    def test_get_streak(self):
        """Test getting workout streak"""
        result = self.gamification.get_streak(self.user)
        self.assertEqual(result, 5)

    def test_get_multiplier(self):
        """Test multiplier calculation based on streak"""
        result = self.gamification.get_multiplier(self.user)
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 1.0)

    @patch('gamification.services.Season.objects.get')
    def test_calculate_with_duration(self, mock_season):
        """Test XP calculation with workout duration"""
        # Mock season to avoid actual season lookup
        mock_season_obj = MagicMock()
        mock_season_obj.end_date = date.today() + timedelta(days=90)
        mock_season.return_value = mock_season_obj

        duration = timedelta(minutes=60)
        workout_date = datetime.now()
        result = self.gamification.calculate(self.user, duration, workout_date)

        self.assertIsInstance(result, float)
        self.assertGreater(result, 0)

    def test_calculate_uses_completed_30_minute_blocks(self):
        """Test XP calculation by completed 30-minute blocks."""
        workout_date = datetime.now()

        result_29 = self.gamification.calculate(self.user, timedelta(minutes=29), workout_date)
        result_30 = self.gamification.calculate(self.user, timedelta(minutes=30), workout_date)
        result_90 = self.gamification.calculate(self.user, timedelta(minutes=90), workout_date)

        self.assertEqual(result_29, 0.0)
        self.assertEqual(result_30, 1.0)
        self.assertEqual(result_90, 3.0)

    def test_calculate_keeps_bonus_aware_base_xp(self):
        """Test workout block calculation still uses bonus-aware base XP."""
        workout_date = datetime.now()

        with patch.object(self.gamification, 'base_xp', return_value=2.5):
            result_60 = self.gamification.calculate(self.user, timedelta(minutes=60), workout_date)

        self.assertEqual(result_60, 5.0)

    def test_calculate_invalid_args(self):
        """Test calculate method with invalid arguments"""
        result = self.gamification.calculate(self.user)
        self.assertEqual(result, 0.0)

        with self.assertRaises(ValueError):
            self.gamification.calculate(self.user, "arg1")

        with self.assertRaises(ValueError):
            self.gamification.calculate(self.user, "arg1", "arg2", "arg3")


class MealGamificationTest(TestCase):
    """Test cases for MealGamification service"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.profile = Profile.objects.create(user=self.user, score=50, level=1, employer=self.client_obj)

        # Create actual meal streak
        self.meal_streak = MealStreak.objects.create(
            user=self.user,
            current_streak=3,
            longest_streak=5
        )

        # Create settings for this test
        self.settings = GamificationSettings.objects.create(meal_xp=2)
        self.gamification = MealGamification()

    def test_get_streak(self):
        """Test getting meal streak"""
        result = self.gamification.get_streak(self.user)
        self.assertEqual(result, 3)


class GamificationMainServiceTest(TestCase):
    """Test cases for main Gamification service"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.profile = Profile.objects.create(user=self.user, score=100, level=1, employer=self.client_obj)
        self.settings = GamificationSettings.objects.create()
        self.gamification = Gamification()

    def test_get_xp(self):
        """Test getting user XP"""
        result = Gamification.get_xp(self.user)
        self.assertEqual(result, 100)

    def test_set_xp(self):
        """Test setting user XP"""
        Gamification.set_xp(self.user, 150)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.score, 150)

    def test_add_xp(self):
        """Test adding XP to user"""
        initial_xp = self.user.profile.score
        self.gamification.add_xp(self.user, 50)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.score, initial_xp + 50)

    def test_remove_xp(self):
        """Test removing XP from user"""
        initial_xp = self.user.profile.score
        self.gamification.remove_xp(self.user, 25)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.score, initial_xp - 25)

    def test_get_level(self):
        """Test getting user level"""
        result = Gamification.get_level(self.user)
        self.assertEqual(result, 1)

    def test_points_to_next_level(self):
        """Test calculating points needed for next level"""
        # Set user to a predictable state
        self.user.profile.score = 0
        self.user.profile.level = 1
        self.user.profile.save()

        result = self.gamification.points_to_next_level(self.user)
        self.assertIsInstance(result, int)
        self.assertGreater(result, 0)  # Should need points for next level

    def test_level_up_on_add_xp(self):
        """Test automatic level up when adding sufficient XP"""
        # Set user to level 1 with low score
        self.user.profile.score = 0
        self.user.profile.level = 1
        self.user.profile.save()

        # Add enough XP to trigger level up
        self.gamification.add_xp(self.user, 1000)
        self.user.profile.refresh_from_db()

        self.assertGreater(self.user.profile.level, 1)


