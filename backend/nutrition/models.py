from datetime import timedelta

from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.db import models
from django.core.exceptions import ObjectDoesNotExist as RelatedObjectDoesNotExist, ValidationError
from django.utils import timezone

from gamification.services import Gamification
from status.models import Status

meal_choices = [
    ('breakfast', 'Café da manhã'),
    ('lunch', 'Almoço'),
    ('afternoon_snack', 'Lanche da tarde'),
    ('dinner', 'Jantar'),
    ('snack', 'Lanche da manhã'),
]


def get_published_status_id():
    obj, _ = Status.objects.get_or_create(
        app_name='NUTRITION',
        action='PUBLISHED',
        is_active=True,
        defaults={'name': 'Publicado'}
    )

    return obj.id


class MealConfig(models.Model):
    meal_name = models.CharField(max_length=20, choices=meal_choices, unique=True)
    interval_start = models.TimeField()
    interval_end = models.TimeField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.get_meal_name_display()}"

    @classmethod
    def all_meals_count(cls):
        return cls.objects.count()

    class Meta:
        ordering = ['interval_start']


class Meal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meals')
    meal_type = models.ForeignKey(MealConfig, on_delete=models.PROTECT)
    meal_time = models.DateTimeField()
    comments = models.TextField(blank=True, null=True)
    validation_status = models.ForeignKey(Status, on_delete=models.PROTECT, default=get_published_status_id)
    base_points = models.FloatField(null=True, blank=True, editable=False)
    fasting = models.BooleanField(default=False)
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

        streak, created = MealStreak.objects.get_or_create(
            user=self.user,
            defaults={
                'current_streak': 1,
                'longest_streak': 1,
                'last_meal_datetime': self.meal_time.astimezone(),
            }
        )

        if not created:
            streak.update_streak(self.meal_time.astimezone())

        # Calculate multiplier and points based on streak
        self.multiplier = Gamification.Meal.get_multiplier(self.user)
        self.base_points = Gamification.Meal.calculate(self.user)

        super().save(*args, **kwargs)

        # Update the user's profile with the new points
        Gamification().add_xp(self.user, self.base_points)

    def delete(self, *args, **kwargs):
        # Before deleting the meal, deduct the points from the user's profile
        meal_points = self.base_points
        user = self.user

        try:
            super().delete(*args, **kwargs)
        except Exception as e:
            raise e

        Gamification().remove_xp(user, meal_points)

    def clean(self):
        if self.id is None:  # Only check for duplicates on creation
            if Meal.objects.filter(user=self.user, meal_type=self.meal_type, meal_time__date=self.meal_time.date()).exists():
                raise ValidationError({"meal_type": "A meal of this type has already been recorded for today."})


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
        # Store current streak before updating
        old_streak = self.current_streak
        
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

        # Check for streak milestones and send notifications
        self._check_streak_milestone(old_streak, self.current_streak)

        return self.current_streak
    
    def _check_streak_milestone(self, old_streak, new_streak):
        """
        Check if a streak milestone was reached and send notification.
        
        Args:
            old_streak: Previous streak count
            new_streak: Current streak count
        """
        # Define milestones
        milestones = [7, 14, 30, 60, 100]
        
        # Check if a milestone was crossed
        for milestone in milestones:
            if old_streak < milestone <= new_streak:
                # Milestone reached! Send notification
                try:
                    from notifications.services import NotificationService, NotificationTemplates
                    
                    notification_data = NotificationTemplates.for_streak(
                        days=milestone,
                        streak_type='meal'
                    )
                    
                    NotificationService.create_notification(
                        user=self.user,
                        notification_type='streak',
                        **notification_data
                    )
                except Exception as e:
                    # Don't fail the meal save if notification fails
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f'Failed to create streak milestone notification: {e}')
                
                # Only notify for the first milestone reached
                break

    def check_streak_ended(self, meal_datetime):
        # Cache date conversions to avoid repeated calls
        meal_date = meal_datetime.astimezone().date()
        last_meal_date = self.last_meal_datetime.astimezone().date()

        # Cache the expected meals count
        expected_meals_count = MealConfig.all_meals_count()

        if last_meal_date == meal_date:
            # Same day: check if we've already reached the daily goal
            # Use exists() for better performance when we just need a count check
            meals_on_day = Meal.objects.filter(
                user=self.user,
                meal_time__date=meal_date
            ).count()

            # Streak continues if we haven't exceeded the expected count
            return meals_on_day > expected_meals_count
        else:
            # Different day: check if previous day met the goal
            meals_on_last_day = Meal.objects.filter(
                user=self.user,
                meal_time__date=last_meal_date
            ).count()

            # Streak ended if we didn't meet the goal on the previous day
            return meals_on_last_day < expected_meals_count

    def check_and_reset_streak_if_ended(self, meal_datetime):
        if self.check_streak_ended(meal_datetime):
            self.current_streak = 0
            self.save()
