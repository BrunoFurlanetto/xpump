import os
from datetime import datetime, time, date
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from nutrition.models import Meal, MealConfig, MealStreak, MealProof, NutritionPlan
from status.models import Status
from profiles.models import Profile


class MealConfigModelTest(TestCase):
    """
    Test cases for MealConfig model
    """

    def setUp(self):
        """Set up test data"""
        self.meal_config_data = {
            'meal_name': 'breakfast',
            'interval_start': time(7, 0),
            'interval_end': time(10, 0),
            'description': 'Primeira refeição do dia'
        }

    def test_create_meal_config_success(self):
        """Test successful creation of MealConfig"""
        meal_config = MealConfig.objects.create(**self.meal_config_data)

        self.assertEqual(meal_config.meal_name, 'breakfast')
        self.assertEqual(meal_config.interval_start, time(7, 0))
        self.assertEqual(meal_config.interval_end, time(10, 0))
        self.assertEqual(meal_config.description, 'Primeira refeição do dia')

    def test_meal_config_str_representation(self):
        """Test string representation of MealConfig"""
        meal_config = MealConfig.objects.create(**self.meal_config_data)
        expected_str = "Café da manhã - 07:00:00 to 10:00:00"
        self.assertEqual(str(meal_config), expected_str)

    def test_meal_name_choices_validation(self):
        """Test that only valid meal_name choices are accepted"""
        valid_choices = ['breakfast', 'lunch', 'afternoon_snack', 'dinner', 'snack']

        for choice in valid_choices:
            meal_config = MealConfig(
                meal_name=choice,
                interval_start=time(7, 0),
                interval_end=time(10, 0)
            )
            meal_config.full_clean()  # Should not raise ValidationError

    def test_meal_name_unique_constraint(self):
        """Test that meal_name must be unique"""
        MealConfig.objects.create(**self.meal_config_data)

        # Try to create another MealConfig with the same meal_name
        with self.assertRaises(IntegrityError):
            MealConfig.objects.create(**self.meal_config_data)

    def test_meal_config_optional_description(self):
        """Test that description is optional"""
        meal_config_data = self.meal_config_data.copy()
        del meal_config_data['description']

        meal_config = MealConfig.objects.create(**meal_config_data)
        self.assertIsNone(meal_config.description)

    def test_meal_config_blank_description(self):
        """Test that description can be blank"""
        meal_config_data = self.meal_config_data.copy()
        meal_config_data['description'] = ''

        meal_config = MealConfig.objects.create(**meal_config_data)
        self.assertEqual(meal_config.description, '')

    def test_get_meal_name_display(self):
        """Test that get_meal_name_display returns the correct display value"""
        meal_config = MealConfig.objects.create(**self.meal_config_data)
        self.assertEqual(meal_config.get_meal_name_display(), 'Café da manhã')

    def test_time_fields_validation(self):
        """Test that time fields accept valid time objects"""
        meal_config = MealConfig.objects.create(
            meal_name='lunch',
            interval_start=time(12, 30),
            interval_end=time(14, 15)
        )

        self.assertEqual(meal_config.interval_start, time(12, 30))
        self.assertEqual(meal_config.interval_end, time(14, 15))

    def test_all_meal_choices_create_successfully(self):
        """Test creating MealConfig for all available meal choices"""
        meal_choices_data = [
            ('breakfast', time(7, 0), time(10, 0)),
            ('lunch', time(12, 0), time(14, 0)),
            ('afternoon_snack', time(15, 0), time(17, 0)),
            ('dinner', time(19, 0), time(21, 0)),
            ('snack', time(21, 30), time(23, 0)),
        ]

        for meal_name, start_time, end_time in meal_choices_data:
            meal_config = MealConfig.objects.create(
                meal_name=meal_name,
                interval_start=start_time,
                interval_end=end_time,
                description=f'Descrição para {meal_name}'
            )
            self.assertEqual(meal_config.meal_name, meal_name)
            self.assertEqual(meal_config.interval_start, start_time)
            self.assertEqual(meal_config.interval_end, end_time)


class MealModelTest(TestCase):
    """
    Test cases for Meal model
    """

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        # Create profile for the user (needed for score calculation)
        self.profile = Profile.objects.create(
            user=self.user,
            score=0,
            height=175,
            weight=70
        )

        # Create MealConfig
        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(7, 0),
            interval_end=time(10, 0),
            description='Café da manhã'
        )

        # Create Status
        self.status = Status.objects.create(
            app_name='NUTRITION',
            action='PUBLISHED',
            is_active=True
        )

        # Meal data
        self.meal_data = {
            'user': self.user,
            'meal_type': self.meal_config,
            'meal_time': datetime(2025, 8, 27, 8, 30),
            'comments': 'Refeição saudável'
        }

    def test_create_meal_success(self):
        """Test successful creation of Meal"""
        meal = Meal.objects.create(**self.meal_data)

        self.assertEqual(meal.user, self.user)
        self.assertEqual(meal.meal_type, self.meal_config)
        self.assertEqual(meal.meal_time, datetime(2025, 8, 27, 8, 30))
        self.assertEqual(meal.comments, 'Refeição saudável')
        self.assertEqual(meal.validation_status, self.status)
        self.assertEqual(meal.multiplier, 1.0)
        self.assertIsNotNone(meal.base_points)

    def test_meal_str_representation(self):
        """Test string representation of Meal"""
        meal = Meal.objects.create(**self.meal_data)
        expected_str = f"{self.user.username} - breakfast at 2025-08-27 08:30"
        self.assertEqual(str(meal), expected_str)

    def test_meal_creates_streak_if_not_exists(self):
        """Test that creating a meal creates MealStreak if it doesn't exist"""
        self.assertFalse(hasattr(self.user, 'meal_streak'))

        meal = Meal.objects.create(**self.meal_data)

        self.assertTrue(hasattr(self.user, 'meal_streak'))
        self.assertEqual(self.user.meal_streak.current_streak, 1)
        self.assertEqual(self.user.meal_streak.longest_streak, 1)

    def test_meal_updates_existing_streak(self):
        """Test that creating a meal updates existing MealStreak"""
        # Create initial streak
        MealStreak.objects.create(
            user=self.user,
            current_streak=2,
            longest_streak=3,
            last_meal_datetime=datetime(2025, 8, 26, 8, 30)
        )

        meal = Meal.objects.create(**self.meal_data)

        self.user.meal_streak.refresh_from_db()
        self.assertEqual(self.user.meal_streak.current_streak, 3)
        self.assertEqual(self.user.meal_streak.longest_streak, 3)

    def test_meal_calculates_base_points(self):
        """Test that meal calculates base_points correctly"""
        meal = Meal.objects.create(**self.meal_data)

        expected_points = 10 * meal.multiplier
        self.assertEqual(meal.base_points, expected_points)

    def test_meal_updates_user_profile_score(self):
        """Test that meal updates user's profile score"""
        initial_score = self.profile.score
        meal = Meal.objects.create(**self.meal_data)

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.score, initial_score + meal.base_points)

    def test_meal_time_validation_within_interval(self):
        """Test that meal_time must be within the configured interval"""
        # Valid time within interval (7:00 - 10:00)
        valid_meal_data = self.meal_data.copy()
        valid_meal_data['meal_time'] = datetime(2025, 8, 27, 8, 30)

        meal = Meal(**valid_meal_data)
        try:
            meal.clean()
        except ValidationError:
            self.fail("clean() raised ValidationError unexpectedly for valid time")

    def test_meal_time_validation_outside_interval(self):
        """Test that meal_time outside interval raises ValidationError"""
        # Invalid time outside interval (7:00 - 10:00)
        invalid_meal_data = self.meal_data.copy()
        invalid_meal_data['meal_time'] = datetime(2025, 8, 27, 11, 30)  # 11:30 is outside 7:00-10:00

        meal = Meal(**invalid_meal_data)
        with self.assertRaises(ValueError):
            meal.clean()

    def test_duplicate_meal_type_same_day_validation(self):
        """Test that duplicate meal type on same day raises ValidationError"""
        # Create first meal
        Meal.objects.create(**self.meal_data)

        # Try to create second meal of same type on same day
        duplicate_meal_data = self.meal_data.copy()
        duplicate_meal_data['meal_time'] = datetime(2025, 8, 27, 9, 30)  # Same day, different time

        meal = Meal(**duplicate_meal_data)
        with self.assertRaises(ValueError):
            meal.clean()

    def test_same_meal_type_different_day_allowed(self):
        """Test that same meal type on different day is allowed"""
        # Create first meal
        Meal.objects.create(**self.meal_data)

        # Create second meal of same type on different day
        different_day_meal_data = self.meal_data.copy()
        different_day_meal_data['meal_time'] = datetime(2025, 8, 28, 8, 30)  # Different day

        meal = Meal.objects.create(**different_day_meal_data)
        self.assertIsNotNone(meal.id)

    def test_multiplier_calculation_based_on_streak(self):
        """Test multiplier calculation based on streak length"""
        # Create meal configs to test multiplier calculation
        MealConfig.objects.create(
            meal_name='lunch',
            interval_start=time(12, 0),
            interval_end=time(14, 0)
        )
        MealConfig.objects.create(
            meal_name='dinner',
            interval_start=time(19, 0),
            interval_end=time(21, 0)
        )

        meal_configs_count = MealConfig.objects.count()  # Should be 3 now

        # Test different streak levels
        test_cases = [
            (1, 1.0),  # streak < meal_records * 2
            (meal_configs_count * 2, 1.25),  # meal_records * 2 <= streak < meal_records * 8
            (meal_configs_count * 8, 1.50),  # meal_records * 8 <= streak < meal_records * 16
            (meal_configs_count * 16, 1.75),  # meal_records * 16 <= streak < meal_records * 32
            (meal_configs_count * 32, 2.0),  # streak >= meal_records * 32
        ]

        for streak, expected_multiplier in test_cases:

            with self.subTest(streak=streak, expected_multiplier=expected_multiplier):
                # Create user with specific streak
                user = User.objects.create_user(
                    username=f'testuser_{streak}',
                    email=f'test_{streak}@example.com',
                    password='testpass123'
                )
                Profile.objects.create(user=user, score=0, height=175, weight=70)
                MealStreak.objects.create(
                    user=user,
                    current_streak=streak,
                    longest_streak=streak,
                    last_meal_datetime=datetime(2025, 8, 26, 20, 30)
                )

                meal_data = self.meal_data.copy()
                meal_data['user'] = user
                meal = Meal.objects.create(**meal_data)

                self.assertEqual(meal.multiplier, expected_multiplier)

    def test_meal_optional_comments(self):
        """Test that comments field is optional"""
        meal_data = self.meal_data.copy()
        del meal_data['comments']

        meal = Meal.objects.create(**meal_data)
        self.assertIsNone(meal.comments)

    def test_meal_blank_comments(self):
        """Test that comments can be blank"""
        meal_data = self.meal_data.copy()
        meal_data['comments'] = ''

        meal = Meal.objects.create(**meal_data)
        self.assertEqual(meal.comments, '')


class MealProofModelTest(TestCase):
    """
    Test cases for MealProof model
    """

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        # Create profile for the user
        self.profile = Profile.objects.create(
            user=self.user,
            score=0,
            height=175,
            weight=70
        )

        # Create MealConfig
        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(7, 0),
            interval_end=time(10, 0),
            description='Café da manhã'
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
            meal_time=datetime(2025, 8, 27, 8, 30),
            comments='Refeição saudável'
        )

    def test_create_meal_proof_with_image(self):
        """Test successful creation of MealProof with image file"""
        # Create a fake image file
        image_content = b'fake image content'
        image_file = SimpleUploadedFile(
            "test_meal.jpg",
            image_content,
            content_type="image/jpeg"
        )

        meal_proof = MealProof.objects.create(
            checkin=self.meal,
            file=image_file
        )

        self.assertEqual(meal_proof.checkin, self.meal)
        self.assertTrue(meal_proof.file.name.endswith('.jpg'))
        self.assertIn('meal/', meal_proof.file.name)

    def test_create_meal_proof_with_video(self):
        """Test successful creation of MealProof with video file"""
        # Create a fake video file
        video_content = b'fake video content'
        video_file = SimpleUploadedFile(
            "test_meal.mp4",
            video_content,
            content_type="video/mp4"
        )

        meal_proof = MealProof.objects.create(
            checkin=self.meal,
            file=video_file
        )

        self.assertEqual(meal_proof.checkin, self.meal)
        self.assertTrue(meal_proof.file.name.endswith('.mp4'))
        self.assertIn('meal/', meal_proof.file.name)

    def test_meal_proof_file_extension_validation_jpg(self):
        """Test that JPG files are accepted"""
        jpg_file = SimpleUploadedFile(
            "test_meal.jpg",
            b'fake jpg content',
            content_type="image/jpeg"
        )

        meal_proof = MealProof(checkin=self.meal, file=jpg_file)
        try:
            meal_proof.full_clean()
        except ValidationError:
            self.fail("full_clean() raised ValidationError for valid JPG file")

    def test_meal_proof_file_extension_validation_jpeg(self):
        """Test that JPEG files are accepted"""
        jpeg_file = SimpleUploadedFile(
            "test_meal.jpeg",
            b'fake jpeg content',
            content_type="image/jpeg"
        )

        meal_proof = MealProof(checkin=self.meal, file=jpeg_file)
        try:
            meal_proof.full_clean()
        except ValidationError:
            self.fail("full_clean() raised ValidationError for valid JPEG file")

    def test_meal_proof_file_extension_validation_png(self):
        """Test that PNG files are accepted"""
        png_file = SimpleUploadedFile(
            "test_meal.png",
            b'fake png content',
            content_type="image/png"
        )

        meal_proof = MealProof(checkin=self.meal, file=png_file)
        try:
            meal_proof.full_clean()
        except ValidationError:
            self.fail("full_clean() raised ValidationError for valid PNG file")

    def test_meal_proof_file_extension_validation_mp4(self):
        """Test that MP4 files are accepted"""
        mp4_file = SimpleUploadedFile(
            "test_meal.mp4",
            b'fake mp4 content',
            content_type="video/mp4"
        )

        meal_proof = MealProof(checkin=self.meal, file=mp4_file)
        try:
            meal_proof.full_clean()
        except ValidationError:
            self.fail("full_clean() raised ValidationError for valid MP4 file")

    def test_meal_proof_invalid_file_extension(self):
        """Test that invalid file extensions are rejected"""
        invalid_file = SimpleUploadedFile(
            "test_meal.txt",
            b'fake text content',
            content_type="text/plain"
        )

        meal_proof = MealProof(checkin=self.meal, file=invalid_file)
        with self.assertRaises(ValidationError):
            meal_proof.full_clean()

    def test_meal_proof_cascade_delete_with_meal(self):
        """Test that MealProof is deleted when associated Meal is deleted"""
        image_file = SimpleUploadedFile(
            "test_meal.jpg",
            b'fake image content',
            content_type="image/jpeg"
        )

        meal_proof = MealProof.objects.create(
            checkin=self.meal,
            file=image_file
        )

        meal_proof_id = meal_proof.id

        # Delete the meal
        self.meal.delete()

        # Check that meal proof is also deleted
        self.assertFalse(MealProof.objects.filter(id=meal_proof_id).exists())

    def test_meal_can_have_multiple_proofs(self):
        """Test that a meal can have multiple proof files"""
        # Create first proof
        image_file1 = SimpleUploadedFile(
            "test_meal1.jpg",
            b'fake image content 1',
            content_type="image/jpeg"
        )
        proof1 = MealProof.objects.create(
            checkin=self.meal,
            file=image_file1
        )

        # Create second proof
        image_file2 = SimpleUploadedFile(
            "test_meal2.png",
            b'fake image content 2',
            content_type="image/png"
        )
        proof2 = MealProof.objects.create(
            checkin=self.meal,
            file=image_file2
        )

        # Check that both proofs are associated with the meal
        proofs = self.meal.proofs.all()
        self.assertEqual(proofs.count(), 2)
        self.assertIn(proof1, proofs)
        self.assertIn(proof2, proofs)

    def test_meal_proof_related_name(self):
        """Test the related_name 'proofs' works correctly"""
        image_file = SimpleUploadedFile(
            "test_meal.jpg",
            b'fake image content',
            content_type="image/jpeg"
        )

        meal_proof = MealProof.objects.create(
            checkin=self.meal,
            file=image_file
        )

        # Access proofs through the related name
        proofs = self.meal.proofs.all()
        self.assertEqual(proofs.count(), 1)
        self.assertEqual(proofs.first(), meal_proof)

    def test_meal_proof_upload_path(self):
        """Test that files are uploaded to the correct path"""
        image_file = SimpleUploadedFile(
            "test_meal.jpg",
            b'fake image content',
            content_type="image/jpeg"
        )

        meal_proof = MealProof.objects.create(
            checkin=self.meal,
            file=image_file
        )

        # Check that the file path starts with 'meal/'
        self.assertTrue(meal_proof.file.name.startswith('meal/'))

    def tearDown(self):
        """Clean up uploaded files after tests"""
        # Clean up any uploaded files
        for meal_proof in MealProof.objects.all():
            if meal_proof.file and os.path.exists(meal_proof.file.path):
                os.remove(meal_proof.file.path)


class NutritionPlanModelTest(TestCase):
    """
    Test cases for NutritionPlan model
    """

    def setUp(self):
        """Set up test data"""
        self.nutrition_plan_data = {
            'title': 'Plano de Nutrição para Ganho de Massa',
            'is_active': True,
            'start_plan': date(2025, 8, 27),
            'end_plan': date(2025, 12, 31),
            'lifetime': False
        }

    def test_create_nutrition_plan_success(self):
        """Test successful creation of NutritionPlan"""
        # Create a fake PDF file
        pdf_content = b'fake pdf content'
        pdf_file = SimpleUploadedFile(
            "nutrition_plan.pdf",
            pdf_content,
            content_type="application/pdf"
        )

        nutrition_plan = NutritionPlan.objects.create(
            pdf_file=pdf_file,
            **self.nutrition_plan_data
        )

        self.assertEqual(nutrition_plan.title, 'Plano de Nutrição para Ganho de Massa')
        self.assertTrue(nutrition_plan.is_active)
        self.assertEqual(nutrition_plan.start_plan, date(2025, 8, 27))
        self.assertEqual(nutrition_plan.end_plan, date(2025, 12, 31))
        self.assertFalse(nutrition_plan.lifetime)
        self.assertTrue(nutrition_plan.pdf_file.name.endswith('.pdf'))
        self.assertIn('nutrition_plans/', nutrition_plan.pdf_file.name)

    def test_nutrition_plan_str_representation(self):
        """Test string representation of NutritionPlan"""
        pdf_file = SimpleUploadedFile(
            "nutrition_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        nutrition_plan = NutritionPlan.objects.create(
            pdf_file=pdf_file,
            **self.nutrition_plan_data
        )

        self.assertEqual(str(nutrition_plan), 'Plano de Nutrição para Ganho de Massa')

    def test_nutrition_plan_default_values(self):
        """Test default values for NutritionPlan fields"""
        pdf_file = SimpleUploadedFile(
            "nutrition_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        # Create with minimal data to test defaults
        nutrition_plan = NutritionPlan.objects.create(
            title='Plano Básico',
            pdf_file=pdf_file,
            start_plan=date(2025, 8, 27),
            end_plan=date(2025, 12, 31)
        )

        # Test default values
        self.assertTrue(nutrition_plan.is_active)  # Default is True
        self.assertFalse(nutrition_plan.lifetime)  # Default is False

    def test_nutrition_plan_pdf_file_extension_validation(self):
        """Test that only PDF files are accepted"""
        pdf_file = SimpleUploadedFile(
            "nutrition_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        nutrition_plan = NutritionPlan(
            pdf_file=pdf_file,
            **self.nutrition_plan_data
        )

        try:
            nutrition_plan.full_clean()
        except ValidationError:
            self.fail("full_clean() raised ValidationError for valid PDF file")

    def test_nutrition_plan_invalid_file_extension(self):
        """Test that non-PDF files are rejected"""
        invalid_file = SimpleUploadedFile(
            "nutrition_plan.txt",
            b'fake text content',
            content_type="text/plain"
        )

        nutrition_plan = NutritionPlan(
            pdf_file=invalid_file,
            **self.nutrition_plan_data
        )

        with self.assertRaises(ValidationError):
            nutrition_plan.full_clean()

    def test_nutrition_plan_upload_path(self):
        """Test that PDF files are uploaded to the correct path"""
        pdf_file = SimpleUploadedFile(
            "nutrition_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        nutrition_plan = NutritionPlan.objects.create(
            pdf_file=pdf_file,
            **self.nutrition_plan_data
        )

        # Check that the file path starts with 'nutrition_plans/'
        self.assertTrue(nutrition_plan.pdf_file.name.startswith('nutrition_plans/'))

    def test_nutrition_plan_lifetime_plan(self):
        """Test creating a lifetime nutrition plan"""
        pdf_file = SimpleUploadedFile(
            "lifetime_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        plan_data = self.nutrition_plan_data.copy()
        plan_data['lifetime'] = True

        nutrition_plan = NutritionPlan.objects.create(
            pdf_file=pdf_file,
            **plan_data
        )

        self.assertTrue(nutrition_plan.lifetime)

    def test_nutrition_plan_inactive_plan(self):
        """Test creating an inactive nutrition plan"""
        pdf_file = SimpleUploadedFile(
            "inactive_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        plan_data = self.nutrition_plan_data.copy()
        plan_data['is_active'] = False

        nutrition_plan = NutritionPlan.objects.create(
            pdf_file=pdf_file,
            **plan_data
        )

        self.assertFalse(nutrition_plan.is_active)

    def test_nutrition_plan_date_fields(self):
        """Test that date fields work correctly"""
        pdf_file = SimpleUploadedFile(
            "date_test_plan.pdf",
            b'fake pdf content',
            content_type="application/pdf"
        )

        start_date = date(2025, 1, 1)
        end_date = date(2025, 12, 31)

        nutrition_plan = NutritionPlan.objects.create(
            title='Plano Anual',
            pdf_file=pdf_file,
            start_plan=start_date,
            end_plan=end_date,
            is_active=True,
            lifetime=False
        )

        self.assertEqual(nutrition_plan.start_plan, start_date)
        self.assertEqual(nutrition_plan.end_plan, end_date)

    def tearDown(self):
        """Clean up uploaded files after tests"""
        # Clean up any uploaded files
        for nutrition_plan in NutritionPlan.objects.all():
            if nutrition_plan.pdf_file and os.path.exists(nutrition_plan.pdf_file.path):
                os.remove(nutrition_plan.pdf_file.path)


class MealStreakModelTest(TestCase):
    """
    Test cases for MealStreak model
    """

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        # Create MealConfigs for streak testing
        self.breakfast_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(7, 0),
            interval_end=time(10, 0)
        )

        self.lunch_config = MealConfig.objects.create(
            meal_name='lunch',
            interval_start=time(12, 0),
            interval_end=time(14, 0)
        )

        self.dinner_config = MealConfig.objects.create(
            meal_name='dinner',
            interval_start=time(19, 0),
            interval_end=time(21, 0)
        )

    def test_create_meal_streak_success(self):
        """Test successful creation of MealStreak"""
        meal_streak = MealStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=10,
            last_meal_datetime=datetime(2025, 8, 27, 8, 30)
        )

        self.assertEqual(meal_streak.user, self.user)
        self.assertEqual(meal_streak.current_streak, 5)
        self.assertEqual(meal_streak.longest_streak, 10)
        self.assertEqual(meal_streak.last_meal_datetime, datetime(2025, 8, 27, 8, 30))

    def test_meal_streak_str_representation(self):
        """Test string representation of MealStreak"""
        meal_streak = MealStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=10
        )

        expected_str = f"Streak of {self.user.username}: 5 (Máx: 10)"
        self.assertEqual(str(meal_streak), expected_str)

    def test_meal_streak_default_values(self):
        """Test default values for MealStreak fields"""
        meal_streak = MealStreak.objects.create(user=self.user)

        self.assertEqual(meal_streak.current_streak, 0)
        self.assertEqual(meal_streak.longest_streak, 0)
        self.assertIsNone(meal_streak.last_meal_datetime)

    def test_update_streak_first_meal(self):
        """Test updating streak for the first meal"""
        meal_streak = MealStreak.objects.create(user=self.user)

        meal_datetime = datetime(2025, 8, 27, 8, 30)
        result = meal_streak.update_streak(meal_datetime)

        self.assertEqual(result, 1)
        self.assertEqual(meal_streak.current_streak, 1)
        self.assertEqual(meal_streak.longest_streak, 1)
        self.assertEqual(meal_streak.last_meal_datetime, meal_datetime)

    def test_update_streak_consecutive_meals(self):
        """Test updating streak for consecutive meals"""
        meal_streak = MealStreak.objects.create(
            user=self.user,
            current_streak=2,
            longest_streak=3,
            last_meal_datetime=datetime(2025, 8, 27, 8, 30)  # breakfast
        )

        # Next meal (lunch) - should continue streak
        lunch_datetime = datetime(2025, 8, 27, 13, 0)
        result = meal_streak.update_streak(lunch_datetime)

        self.assertEqual(result, 3)
        self.assertEqual(meal_streak.current_streak, 3)
        self.assertEqual(meal_streak.longest_streak, 3)
        self.assertEqual(meal_streak.last_meal_datetime, lunch_datetime)

    def test_update_streak_new_longest_streak(self):
        """Test updating streak when it becomes the new longest"""
        meal_streak = MealStreak.objects.create(
            user=self.user,
            current_streak=4,
            longest_streak=4,
            last_meal_datetime=datetime(2025, 8, 27, 8, 30)
        )

        meal_datetime = datetime(2025, 8, 27, 13, 0)
        result = meal_streak.update_streak(meal_datetime)

        self.assertEqual(result, 5)
        self.assertEqual(meal_streak.current_streak, 5)
        self.assertEqual(meal_streak.longest_streak, 5)  # New longest streak

    def test_check_streak_ended_consecutive_meals(self):
        """Test check_streak_ended for consecutive meals (should not end)"""
        meal_streak = MealStreak.objects.create(
            user=self.user,
            last_meal_datetime=datetime(2025, 8, 27, 8, 30)  # breakfast
        )

        # Next meal is lunch (consecutive) - streak should not end
        lunch_datetime = datetime(2025, 8, 27, 13, 0)
        result = meal_streak.check_streak_ended(lunch_datetime)

        self.assertFalse(result)

    def test_check_streak_ended_wrap_around(self):
        """Test check_streak_ended for wrap around (dinner to breakfast next day)"""
        meal_streak = MealStreak.objects.create(
            user=self.user,
            last_meal_datetime=datetime(2025, 8, 27, 20, 0)  # dinner
        )

        # Next meal is breakfast next day - should not end (wrap around)
        breakfast_datetime = datetime(2025, 8, 28, 8, 30)
        result = meal_streak.check_streak_ended(breakfast_datetime)

        self.assertFalse(result)

    def test_check_streak_ended_skipped_meal(self):
        """Test check_streak_ended when a meal is skipped (should end)"""
        meal_streak = MealStreak.objects.create(
            user=self.user,
            last_meal_datetime=datetime(2025, 8, 27, 8, 30)  # breakfast
        )

        # Skip lunch, go directly to dinner - streak should end
        dinner_datetime = datetime(2025, 8, 27, 20, 0)
        result = meal_streak.check_streak_ended(dinner_datetime)

        self.assertTrue(result)

    def test_check_and_reset_streak_if_ended(self):
        """Test check_and_reset_streak_if_ended method"""
        meal_streak = MealStreak.objects.create(
            user=self.user,
            current_streak=5,
            longest_streak=10,
            last_meal_datetime=datetime(2025, 8, 27, 8, 30)  # breakfast
        )

        # Skip lunch, go to dinner - should reset streak
        dinner_datetime = datetime(2025, 8, 27, 20, 0)
        meal_streak.check_and_reset_streak_if_ended(dinner_datetime)

        meal_streak.refresh_from_db()
        self.assertEqual(meal_streak.current_streak, 0)
        self.assertEqual(meal_streak.longest_streak, 10)  # Longest streak should remain

    def test_one_to_one_relationship_with_user(self):
        """Test that MealStreak has a one-to-one relationship with User"""
        meal_streak = MealStreak.objects.create(user=self.user)

        # Access streak through user
        self.assertEqual(self.user.meal_streak, meal_streak)

        # Try to create another streak for the same user (should fail)
        with self.assertRaises(IntegrityError):
            MealStreak.objects.create(user=self.user)
