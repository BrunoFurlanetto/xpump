from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models

from status.models import Status


class WorkoutCheckin(models.Model):
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
        self.clean()
        self.duration = self.duration * 60
        self.base_points = float((self.duration.total_seconds() / 60) / 50) * self.multiplier
        self.validation_status = Status.objects.filter(app_name='WORKOUT', action='PUBLISHED', is_active=True).first()

        super().save(*args, **kwargs)

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

        return self.multiplier


class WorkoutCheckinProof(models.Model):
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
    # user = models.ForeignKey(User, on_delete=models.CASCADE)
    # group = models.ManyToManyField(Group)
    title = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    pdf_file = models.FileField(upload_to='workout_plans/', validators=[FileExtensionValidator(allowed_extensions=['pdf'])])
    start_plan = models.DateField()
    end_plan = models.DateField()
    lifetime = models.BooleanField(default=False)

    def __str__(self):
        return self.title
