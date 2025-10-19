from datetime import timedelta

from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.db import models
from django.core.exceptions import ObjectDoesNotExist as RelatedObjectDoesNotExist, ValidationError
from django.utils import timezone

from status.models import Status

meal_choices = [
    ('breakfast', 'Café da manhã'),
    ('lunch', 'Almoço'),
    ('afternoon_snack', 'Lanche da tarde'),
    ('dinner', 'Jantar'),
    ('snack', 'Lanche'),
]


class MealConfig(models.Model):
    meal_name = models.CharField(max_length=20, choices=meal_choices, unique=True)
    interval_start = models.TimeField()
    interval_end = models.TimeField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.get_meal_name_display()} - {self.interval_start} to {self.interval_end}"

    @classmethod
    def all_meals_count(cls):
        return cls.objects.count()


class Meal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meals')
    meal_type = models.ForeignKey(MealConfig, on_delete=models.PROTECT)
    meal_time = models.DateTimeField()
    comments = models.TextField(blank=True, null=True)
    validation_status = models.ForeignKey(Status, on_delete=models.PROTECT)
    base_points = models.FloatField(null=True, blank=True, editable=False)
    multiplier = models.FloatField(default=1.0)

    def __str__(self):
        return f"{self.user.username} - {self.meal_type.meal_name} at {self.meal_time.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        self.clean()
        self.validation_status, _ = Status.objects.get_or_create(app_name='NUTRITION', action='PUBLISHED', defaults={
            'name': 'Aceito',
            'app_name': 'NUTRITION',
            'action': 'PUBLISHED',
        })

        try:
            # Update user's workout streak
            self.user.meal_streak.update_streak(self.meal_time.astimezone())
        except RelatedObjectDoesNotExist:
            # Create workout streak if it doesn't exist
            MealStreak.objects.create(
                user=self.user,
                current_streak=1,
                longest_streak=1,
                last_meal_datetime=self.meal_time.astimezone(),
            )

        # Calculate multiplier and points based on streak
        self.multiplier = self.update_multiplier()
        self.base_points = float(10 * self.multiplier)

        super().save(*args, **kwargs)

        # Update the user's profile with the new points
        self.user.profile.score += self.base_points
        self.user.profile.save()

    def clean(self):
        if not MealConfig.objects.filter(
            interval_start__lte=self.meal_time.astimezone().time(),
            interval_end__gte=self.meal_time.astimezone().time()
        ).exists():
            raise ValidationError({"meal_time": "Meal time does not fall within any configured meal intervals."})

        if not (self.meal_type.interval_start < self.meal_time.astimezone().time() < self.meal_type.interval_end):
            raise ValidationError({"meal_time": "Meal time must be within the configured interval for this meal type."})

        if self.id is None:  # Only check for duplicates on creation
            if Meal.objects.filter(user=self.user, meal_type=self.meal_type, meal_time__date=self.meal_time.date()).exists():
                raise ValidationError({"meal_type": "A meal of this type has already been recorded for today."})

    def update_multiplier(self):
        try:
            streak = self.user.meal_streak.current_streak
        except RelatedObjectDoesNotExist:
            MealStreak.objects.create(
                user=self.user,
                current_streak=1,
                longest_streak=1,
                last_meal_datetime=self.meal_time.astimezone(),
            )
            streak = 1

        meal_records = MealConfig.objects.count()

        if streak < meal_records * 2:
            self.multiplier = 1.0
        elif meal_records * 2 <= streak < meal_records * 8:
            self.multiplier = 1.25
        elif meal_records * 8 <= streak < meal_records * 16:
            self.multiplier = 1.50
        elif meal_records * 16 <= streak < meal_records * 32:
            self.multiplier = 1.75
        elif streak >= meal_records * 32:
            self.multiplier = 2.0

        return self.multiplier


class MealProof(models.Model):
    """
    Model for storing proof files (images/videos) attached to meals.
    Supports validation of file types to ensure only allowed media formats.
    """
    checkin = models.ForeignKey(
        Meal,
        related_name='proofs',
        on_delete=models.CASCADE
    )
    file = models.FileField(
        upload_to='meal/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'mp4'])]
    )


class NutritionPlan(models.Model):
    title = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    pdf_file = models.FileField(
        upload_to='nutrition_plans/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf'])]
    )
    start_plan = models.DateField()
    end_plan = models.DateField()
    lifetime = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class MealStreak(models.Model):
    """
    Model representing a user's meal streak tracking system. Tracks current streak, longest streak achieved, last
    meal date. Automatically manages streak calculations based on weekly workout frequency
    goals.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='meal_streak')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_meal_datetime = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Streak of {self.user.username}: {self.current_streak} (Máx: {self.longest_streak})"

    @property
    def weekly_remaining(self):
        if not self.last_meal_datetime:
            return MealConfig.all_meals_count() * 7  # Now is correct

        # Get current date and time
        now = timezone.now()

        # Calculate the start and end of the week based on the current date
        # Assuming the week starts on Sunday
        days_since_sunday = now.weekday() + 1

        if days_since_sunday == 7:
            days_since_sunday = 0

        # Calculate the start and end of the week
        # Adjusting to the start of the week (Sunday)
        week_start = now - timedelta(days=days_since_sunday)
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

        # Count the number of check-ins in the current week
        checkins_count = Meal.objects.filter(
            user=self.user,
            meal_time__gte=week_start,
            meal_time__lte=week_end
        ).count()

        # Calculate remaining workouts needed to meet frequency
        remaining = (MealConfig.all_meals_count() * 7) - checkins_count

        return max(remaining, 0)

    def update_streak(self, meal_datetime):
        if not self.last_meal_datetime:
            self.current_streak = 1
            self.longest_streak = 1
        else:
            if self.check_streak_ended(meal_datetime):
                self.current_streak = 1
            else:
                self.current_streak += 1

        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak

        self.last_meal_datetime = meal_datetime

        self.save()
        return self.current_streak

    def check_streak_ended(self, meal_datetime):
        all_meals = MealConfig.objects.all().order_by('interval_end')
        list_all_meals = list(all_meals)
        current_meal_config = None
        last_meal_config = None

        for meal in all_meals:
            if meal.interval_start <= meal_datetime.time() <= meal.interval_end:
                current_meal_config = meal

            if meal.interval_start <= self.last_meal_datetime.astimezone().time() <= meal.interval_end:
                last_meal_config = meal

        if list_all_meals.index(current_meal_config) == 0 and list_all_meals.index(last_meal_config) == len(
                list_all_meals) - 1:
            return False
        else:
            if list_all_meals.index(current_meal_config) == list_all_meals.index(last_meal_config) + 1:
                return False
            else:
                return True

    def check_and_reset_streak_if_ended(self, meal_datetime):
        if self.check_streak_ended(meal_datetime):
            self.current_streak = 0
            self.save()
