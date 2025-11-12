from datetime import datetime, timedelta, date
from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock

from django.utils import timezone
from faker.proxy import Faker

from gamification.models import GamificationSettings, Season
from gamification.services import Gamification, WorkoutGamification, MealGamification
from profiles.models import Profile
from clients.models import Client
from groups.models import Group, GroupMembers
from nutrition.models import MealConfig, MealStreak
from workouts.models import WorkoutStreak
from status.models import Status


class WorkoutGamificationIntegrationTest(TestCase):
    """Integration tests between workout app and gamification system"""

    def setUp(self):
        self.settings = GamificationSettings.load()
        self.settings.workout_xp = 5
        self.settings.workout_minutes = 60
        self.settings.save()

        self.user = User.objects.create_user(username='testuser', password='pass')

        self.client_obj = Client.objects.create(
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
            client=self.client_obj
        )

        self.profile = Profile.objects.create(user=self.user, score=100, level=1, employer=self.client_obj)

        # Create workout streak
        self.workout_streak = WorkoutStreak.objects.create(
            user=self.user,
            current_streak=10,
            longest_streak=15
        )

        # Create status
        self.status = Status.objects.create(
            name='Published',
            app_name='WORKOUT',
            action='PUBLISHED',
            is_active=True
        )

        self.gamification = Gamification()
        self.workout_gamification = WorkoutGamification()

    def test_workout_xp_calculation_with_streak(self):
        """Test XP calculation for workout with streak multiplier"""
        # Create workout
        duration = timedelta(minutes=90)  # 1.5x base workout time

        # Mock season to avoid actual season lookup
        with patch('gamification.services.Season.objects.get') as mock_season:
            mock_season.return_value = MagicMock()
            mock_season.return_value.end_date = date.today() + timedelta(days=90)

            xp_earned = self.workout_gamification.calculate(self.user, duration)

            # Should be base_xp * duration_ratio * multiplier
            # With streak=10, multiplier should be 1.5 (based on default settings)
            # expected_multiplier = 1.5 TODO: Temporaly multiplier is defined as 1.0
            expected_multiplier = 1.0
            expected_xp = 5 * (90 / 60) * expected_multiplier  # 5 * 1.5 * 1.5 = 11.25

            self.assertAlmostEqual(xp_earned, expected_xp, places=2)

    def test_workout_updates_profile_score(self):
        """Test that workout completion updates profile score through gamification"""
        initial_score = self.profile.score
        # Simulate workout completion with gamification
        duration = timedelta(minutes=60)

        with patch('gamification.services.Season.objects.get') as mock_season:
            mock_season.return_value = MagicMock()
            mock_season.return_value.end_date = date.today() + timedelta(days=90)

            xp_earned = self.workout_gamification.calculate(self.user, duration)
            self.gamification.add_xp(self.user, xp_earned)
            self.profile.refresh_from_db()
            self.assertEqual(self.profile.score, initial_score + xp_earned)

    def test_workout_streak_affects_multiplier(self):
        """Test that different streak levels affect XP multiplier"""
        duration = timedelta(minutes=60)

        with patch('gamification.services.Season.objects.get') as mock_season:
            mock_season.return_value = MagicMock()
            mock_season.return_value.end_date = date.today() + timedelta(days=90)

            # Test different streak levels TODO: Temporaly multiplier is defined as 1.0
            # test_cases = [
            #     (3, 1.0),  # Low streak
            #     (7, 1.25),  # Medium streak
            #     (15, 1.5),  # High streak
            #     (25, 1.75),  # Very high streak
            #     (50, 2.0),  # Maximum streak
            # ]

            test_cases = [
                (3, 1.0),  # Low streak
                (7, 1.0),  # Medium streak
                (15, 1.0),  # High streak
                (25, 1.0),  # Very high streak
                (50, 1.0),  # Maximum streak
            ]

            for streak, expected_multiplier in test_cases:
                with self.subTest(streak=streak):
                    self.workout_streak.current_streak = streak
                    self.workout_streak.save()

                    multiplier = self.workout_gamification.get_multiplier(self.user)
                    self.assertEqual(multiplier, expected_multiplier)


class MealGamificationIntegrationTest(TestCase):
    """Integration tests between nutrition app and gamification system"""

    def setUp(self):
        faker = Faker('pt_BR')
        self.settings = GamificationSettings.load()
        self.settings.meal_xp = 3
        self.settings.save()

        self.user = User.objects.create_user(username='testuser', password='pass')

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj=faker.unique.cnpj(),
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.season = Season.objects.create(
            name='Season 1',
            start_date=timezone.now() - timedelta(days=180),
            end_date=timezone.now() + timedelta(days=180),
            client=self.client_obj
        )

        self.profile = Profile.objects.create(user=self.user, score=50, level=1, employer=self.client_obj)

        # Create meal streak
        self.meal_streak = MealStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=8
        )

        # Create meal config
        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=datetime.now().time(),
            interval_end=(datetime.now() + timedelta(hours=3)).time()
        )

        # Create status
        self.status = Status.objects.create(
            name='Published',
            app_name='NUTRITION',
            action='PUBLISHED',
            is_active=True
        )

        self.gamification = Gamification()
        self.meal_gamification = MealGamification()

    def test_meal_xp_calculation_with_streak(self):
        """Test XP calculation for meal with streak multiplier"""
        with patch('gamification.services.Season.objects.get') as mock_season:
            mock_season.return_value = MagicMock()
            mock_season.return_value.end_date = date.today() + timedelta(days=90)

            xp_earned = self.meal_gamification.calculate(self.user)

            # With streak=5, multiplier should be 1.25 (based on default settings)
            # expected_multiplier = 1.25 TODO: Temporaly multiplier is defined as 1.0
            expected_multiplier = 1.0
            expected_xp = 3 * expected_multiplier  # 3 * 1.25 = 3.75

            self.assertAlmostEqual(xp_earned, expected_xp, places=2)

    def test_meal_streak_affects_multiplier(self):
        """Test that different meal streak levels affect XP multiplier"""
        with patch('gamification.services.Season.objects.get') as mock_season:
            mock_season.return_value = MagicMock()
            mock_season.return_value.end_date = date.today() + timedelta(days=90)

            # Test different streak levels based on days
            # test_cases = [ TODO: Temporaly multiplier is defined as 1.0
            #     (1, 1.0),  # Low streak
            #     (5, 1.25),  # Medium streak
            #     (10, 1.5),  # High streak
            #     (20, 1.75),  # Very high streak
            #     (35, 2.0),  # Maximum streak
            # ]

            test_cases = [
                (1, 1.0),  # Low streak
                (5, 1.0),  # Medium streak
                (10, 1.0),  # High streak
                (20, 1.0),  # Very high streak
                (35, 1.0),  # Maximum streak
            ]

            for streak, expected_multiplier in test_cases:
                with self.subTest(streak=streak):
                    self.meal_streak.current_streak = streak
                    self.meal_streak.save()

                    multiplier = self.meal_gamification.get_multiplier(self.user)
                    self.assertEqual(multiplier, expected_multiplier)


class SeasonBonusIntegrationTest(TestCase):
    """Integration tests for season bonus functionality across apps"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass')

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.settings = GamificationSettings.objects.create(
            workout_xp=5,
            meal_xp=2,
            months_to_end_season=2,
            season_bonus_percentage=50.0,
            percentage_from_first_position=60.0
        )

        # Create users
        self.low_score_user = User.objects.create_user(username='lowuser', password='pass')
        self.high_score_user = User.objects.create_user(username='highuser', password='pass')

        # Create profiles with different scores
        self.low_profile = Profile.objects.create(user=self.low_score_user, score=100, level=1, employer=self.client_obj)
        self.high_profile = Profile.objects.create(user=self.high_score_user, score=500, level=3, employer=self.client_obj)

        # Create main group
        self.group = Group.objects.create(
            name="Main Group",
            created_by=self.high_score_user,
            owner=self.high_score_user,
            main=True
        )

        # Add members to group
        GroupMembers.objects.filter(group=self.group, member=self.high_score_user).update(pending=False)
        GroupMembers.objects.create(group=self.group, member=self.low_score_user, pending=False)

        self.low_profile.groups.add(self.group)
        self.high_profile.groups.add(self.group)

        # Create season ending soon
        self.season = Season.objects.create(
            client=self.client_obj,
            name="Ending Season",
            start_date=date.today() - timedelta(days=60),
            end_date=date.today() + timedelta(days=30)  # 1 month left
        )

        # Create streaks
        WorkoutStreak.objects.create(user=self.low_score_user, current_streak=5)
        MealStreak.objects.create(user=self.low_score_user, current_streak=3)

        self.workout_gamification = WorkoutGamification()
        self.meal_gamification = MealGamification()

    @patch('gamification.services.datetime')
    def test_season_bonus_for_workout_xp(self, mock_datetime):
        """Test season bonus application for workout XP"""
        # Mock datetime to simulate near season end
        mock_datetime.today.return_value.date.return_value = self.season.end_date - timedelta(days=30)

        # low_score_user should get bonus (100 < 500 * 0.6 = 300)
        base_xp = self.workout_gamification.base_xp(self.low_score_user)

        # Expected: base_workout_xp + 50% bonus = 5 + 2.5 = 7.5
        expected_base_with_bonus = 5 + (5 * 0.5)
        self.assertEqual(base_xp, expected_base_with_bonus)

    @patch('gamification.services.datetime')
    def test_season_bonus_for_meal_xp(self, mock_datetime):
        """Test season bonus application for meal XP"""
        # Mock datetime to simulate near season end
        mock_datetime.today.return_value.date.return_value = self.season.end_date - timedelta(days=30)

        # low_score_user should get bonus
        base_xp = self.meal_gamification.base_xp(self.low_score_user)

        # Expected: base_meal_xp + 50% bonus = 2 + 1 = 3
        expected_base_with_bonus = 2 + (2 * 0.5)
        self.assertEqual(base_xp, expected_base_with_bonus)

    @patch('gamification.services.datetime')
    def test_no_season_bonus_for_high_score_user(self, mock_datetime):
        """Test that high score users don't get season bonus"""
        # Mock datetime to simulate near season end
        mock_datetime.today.return_value.date.return_value = self.season.end_date - timedelta(days=30)

        # high_score_user should NOT get bonus (500 >= 500 * 0.6 = 300)
        workout_base_xp = self.workout_gamification.base_xp(self.high_score_user)
        meal_base_xp = self.meal_gamification.base_xp(self.high_score_user)

        # Should be normal base XP without bonus
        self.assertEqual(workout_base_xp, 5)  # Normal workout XP
        self.assertEqual(meal_base_xp, 2)  # Normal meal XP

    @patch('gamification.services.datetime')
    def test_no_bonus_when_season_not_ending(self, mock_datetime):
        """Test that bonus is not applied when season is not ending soon"""
        # Mock datetime to simulate season with plenty of time left
        mock_datetime.today.return_value.date.return_value = self.season.start_date + timedelta(days=10)

        # Even low score user should not get bonus when season is not ending
        workout_base_xp = self.workout_gamification.base_xp(self.low_score_user)
        meal_base_xp = self.meal_gamification.base_xp(self.low_score_user)

        # Should be normal base XP without bonus
        self.assertEqual(workout_base_xp, 5)  # Normal workout XP
        self.assertEqual(meal_base_xp, 2)  # Normal meal XP


class GamificationReportsIntegrationTest(TestCase):
    """Integration tests for gamification reporting across multiple apps"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass')

        self.client_obj = Client.objects.create(
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
            client=self.client_obj
        )

        self.profile = Profile.objects.create(user=self.user, score=0, level=1, employer=self.client_obj)

        # Create necessary objects for meal and workout
        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=datetime.now().time(),
            interval_end=(datetime.now() + timedelta(hours=3)).time()
        )

        # Mock workouts and meals by patching the attribute on the User class
        self.workouts_patcher = patch.object(User, 'workouts', new=MagicMock())
        self.meals_patcher = patch.object(User, 'meals', new=MagicMock())
        self.workouts_patcher.start()
        self.meals_patcher.start()
        self.addCleanup(self.workouts_patcher.stop)
        self.addCleanup(self.meals_patcher.stop)

        # Now you can configure the mocks per-test
        self.user.workouts.filter.return_value = []
        self.user.meals.filter.return_value = []

        self.gamification = Gamification()

    @patch('gamification.services.Gamification.Workout.calculate')
    @patch('gamification.services.Gamification.Meal.calculate')
    def test_get_xp_in_period_integration(self, mock_meal_calc, mock_workout_calc):
        """Test XP calculation across multiple apps for a specific period"""
        # Mock calculations
        mock_workout_calc.return_value = 15.0  # XP from workouts
        mock_meal_calc.return_value = 8.0  # XP from meals

        # Mock querysets
        mock_workout = MagicMock()
        mock_workout.duration = timedelta(minutes=90)
        self.user.workouts.filter.return_value = [mock_workout]

        mock_meal = MagicMock()
        mock_meal.duration = timedelta(minutes=30)  # Not used in meal calc, but for consistency
        self.user.meals.filter.return_value = [mock_meal]

        # Calculate XP for a week period
        start_date = date.today() - timedelta(days=7)
        end_date = date.today()

        result = self.gamification.get_xp_in_period(self.user, start_date, end_date)

        # Verify structure and values
        self.assertIn('workout_xp', result)
        self.assertIn('meal_xp', result)
        self.assertIn('total_xp', result)

        self.assertEqual(result['workout_xp'], 15.0)
        self.assertEqual(result['meal_xp'], 8.0)
        self.assertEqual(result['total_xp'], 23.0)

        # Verify that the gamification services were called correctly
        mock_workout_calc.assert_called_once_with(self.user, mock_workout.duration)
        mock_meal_calc.assert_called_once_with(self.user)
