from django.contrib.auth.models import User
from django.db import models

from status.models import Status


class CheckinTypes(models.TextChoices):
    PHOTO = 'PHOTO', 'Foto'
    VIDEO = 'VIDEO', 'Vídeo'
    GEOLOCATION = 'GEOLOCATION', 'Geolocalização'


class WorkoutCheckin(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    check_in_type = models.CharField(max_length=100, choices=CheckinTypes.choices)
    image_proof = models.ImageField(upload_to='workout_checkins', null=True, blank=True)
    video_proof = models.FileField(upload_to='workout_checkins', null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    comments = models.TextField(blank=True)
    workout_date = models.DateTimeField()
    validation_status = models.ForeignKey(Status, on_delete=models.PROTECT)
    base_points = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f'Workout check-in for {self.user}'
