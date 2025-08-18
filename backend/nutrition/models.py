from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.db import models

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


class Meal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    meal_type = models.ForeignKey(MealConfig, on_delete=models.PROTECT)
    meal_time = models.DateTimeField()
    comments = models.TextField(blank=True, null=True)
    validation_status = models.ForeignKey(Status, on_delete=models.PROTECT)
    base_points = models.FloatField(null=True, blank=True, editable=False)
    multiplier = models.FloatField(default=1.0)

    def __str__(self):
        return f"{self.user.username} - {self.meal_type.meal} at {self.meal_time.strftime('%Y-%m-%d %H:%M')}"


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
