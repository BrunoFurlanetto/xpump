from datetime import timedelta

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models import Count, Q
from django.utils import timezone

from profiles.models import Profile
from status.models import Status
from django.core.exceptions import ObjectDoesNotExist as RelatedObjectDoesNotExist


class WorkoutCheckin(models.Model):
    """
    Model representing a workout check-in by a user.
    Stores details about the workout, including user, location, comments,
    workout date, duration, validation status, and points.
    Automatically calculates points based on workout duration and streak multiplier.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    location = models.CharField(max_length=100, null=True, blank=True)
    comments = models.TextField(blank=True)
    workout_date = models.DateTimeField()
    duration = models.DurationField()
    validation_status = models.ForeignKey(Status, on_delete=models.PROTECT)
    base_points = models.FloatField(null=True, blank=True, editable=False)
    multiplier = models.FloatField(default=1.0)

    def __str__(self):
        return f'Workout check-in for {self.user}'

    def save(self, *args, **kwargs):
        """
        Override save method to handle validation, streak updates, and point calculations.
        Automatically sets validation status and updates user's score.
        """
        self.clean()
        self.duration = self.duration
        # Set validation status to published for workouts
        self.validation_status = Status.objects.filter(app_name='WORKOUT', action='PUBLISHED', is_active=True).first()

        try:
            # Update user's workout streak
            self.user.workout_streak.update_streak(self.workout_date)
        except RelatedObjectDoesNotExist:
            # Create workout streak if it doesn't exist
            WorkoutStreak.objects.create(
                user=self.user,
                current_streak=1,
                longest_streak=1,
                last_workout_datetime=self.workout_date,
            )

        # Calculate multiplier and points based on streak and duration
        self.multiplier = self.update_multiplier()
        self.base_points = float(10 * ((self.duration.total_seconds() / 60) / 50)) * self.multiplier

        super().save(*args, **kwargs)

        # Update the user's profile with the new points
        self.user.profile.score += self.base_points
        self.user.profile.save()

    def clean(self):
        """
        Validate workout check-in data to ensure logical consistency.
        Prevents future dates, negative durations, and overlapping workouts.
        """
        # Prevent future workout dates
        if self.workout_date > timezone.now():
            raise ValidationError("Workout date cannot be in the future.")

        # Ensure positive duration
        if self.duration.total_seconds() <= 0:
            raise ValidationError("Duration must be a positive value.")

        # Check if there is an overlapping check-in from the same user
        workout_end_time = self.workout_date + self.duration

        overlapping_workouts = WorkoutCheckin.objects.filter(
            user=self.user,
            workout_date__lt=workout_end_time,
            # The end date of the existing check-in is later than the start date of the new one
        ).exclude(id=self.id)

        # For each existing check-in, verify if it overlaps with the new one
        for workout in overlapping_workouts:
            existing_end_time = workout.workout_date + workout.duration

            if existing_end_time > self.workout_date:
                raise ValidationError(
                    f"This check-in is overlapping an existing check-in (ID: {workout.id}) "
                )

    def update_multiplier(self):
        """
        The multiplier will be updated based on the check-in sequence. In the first scenario, the multiplier will increase according to the following rule.
            1. Minor 5 check-ins the multiplier will be 1 (defult value);
            2. Between 5 and 10: check-ins:  Multiplier recieve 1.25 (increase of the 25%);
            3. Between 10 and 20 check-ins: Multiplier recieve 1.50 (increase of the 20%)
            4. Between 20 and 40: Multiplier recieve 1.75 (increase o the 16% approximately)
            5. Between 40 and 80 check-ins: Multiplier recieve 2.0 (Increase of the 14% approximately)
        At first, multiplier equal 2.0 is the roof, but this value can be altered, base on the first test version app.
        """
        streak = self.user.workout_streak.current_streak

        if streak < 5:
            self.multiplier = 1.0
        elif 5 <= streak < 10:
            self.multiplier = 1.25
        elif 10 <= streak < 20:
            self.multiplier = 1.50
        elif 20 <= streak < 40:
            self.multiplier = 1.75
        elif 40 <= streak < 80:
            self.multiplier = 2.0

        return self.multiplier


class WorkoutCheckinProof(models.Model):
    """
    Model for storing proof files (images/videos) attached to workout check-ins.
    Supports validation of file types to ensure only allowed media formats.
    """
    checkin = models.ForeignKey(
        WorkoutCheckin,
        related_name='proofs',
        on_delete=models.CASCADE
    )
    file = models.FileField(
        upload_to='workout_checkins/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'mp4'])]
    )


class WorkoutPlan(models.Model):
    """
    Model representing a workout plan that can be assigned to users. Contains PDF files with workout instructions and
    has defined start/end dates. Can be set as lifetime plans or have specific duration periods
    """
    # user = models.ForeignKey(User, on_delete=models.CASCADE)
    # group = models.ManyToManyField(Group)
    title = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    pdf_file = models.FileField(upload_to='workout_plans/',
                                validators=[FileExtensionValidator(allowed_extensions=['pdf'])])
    start_plan = models.DateField()
    end_plan = models.DateField()
    lifetime = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class WorkoutStreak(models.Model):
    """
    odel representing a user's workout streak tracking system. Tracks current streak, longest streak achieved, last
    workout date, and frequency requirements. Automatically manages streak calculations based on weekly workout frequency
    goals.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='workout_streak')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_workout_datetime = models.DateTimeField(null=True, blank=True)
    frequency = models.IntegerField(default=3)

    def __str__(self):
        return f"Streak of {self.user.username}: {self.current_streak} (Máx: {self.longest_streak})"

    def update_streak(self, workout_date):
        """
        Update the user's workout streak based on a new workout.
        Increments streak if requirements are met, resets if not.
        """
        if not self.last_workout_datetime:
            # First workout ever
            self.current_streak = 1
            self.longest_streak = 1
        else:
            if not self.check_streak_ended(workout_date):
                # Streak continues
                self.current_streak += 1
            else:
                # Streak broken, start new one
                self.current_streak = 1

        # Update longest streak if current is better
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak

        self.last_workout_datetime = workout_date
        self.save()

        return self.current_streak

    def check_streak_ended(self, current_date=None):
        """
        Check if the streak has ended based on the current date and the frequency of workouts.
        The streak is considered ended if the user has not checked in enough times within the last week.
        :param current_date:
        :return:
        """
        # If no current date is provided, use the current time
        if current_date is None:
            current_date = timezone.now()

        # Calculate the start and end of the week based on the current date
        # Assuming the week starts on Sunday
        days_since_sunday = current_date.weekday() + 1

        if days_since_sunday == 7:
            days_since_sunday = 0

        # Calculate the start and end of the week
        # Adjusting to the start of the week (Sunday)
        week_start = current_date - timedelta(days=days_since_sunday)
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

        # Calculate the start and end of the previous week
        previous_week_start = week_start - timedelta(days=7)
        previous_week_end = week_end - timedelta(days=7)

        # Count the number of check-ins in the current week and previous week
        checkins_count = WorkoutCheckin.objects.filter(user=self.user).aggregate(
            current_week=Count(
                'id',
                filter=Q(
                    workout_date__gte=week_start,
                    workout_date__lte=week_end
                )
            ),
            previous_week=Count(
                'id',
                filter=Q(
                    workout_date__gte=previous_week_start,
                    workout_date__lte=previous_week_end
                )
            )
        )
        weekly_checkins = checkins_count['current_week'] or 0
        previous_week_checkins = checkins_count['previous_week'] or 0

        # If the number of check-ins is less than the frequency, check if the last workout is within the week
        if weekly_checkins < self.frequency:
            # If the last workout is within the current week, the streak is not ended
            if week_start <= self.last_workout_datetime <= week_end:
                return False
            else:
                # If the last workout is not within the current week, check the previous week
                if previous_week_checkins < self.frequency:
                    return True

        return False

    def check_and_reset_streak_if_ended(self, current_date=None):
        """
        Check if streak has ended and reset it to 0 if necessary.

        Args:
            current_date: Date to check against

        Returns:
            bool: True if streak was reset, False if still active
        """
        if self.check_streak_ended(current_date):
            self.current_streak = 0
            self.save()

            return True

        return False
