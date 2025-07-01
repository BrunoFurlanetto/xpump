from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    height = models.PositiveSmallIntegerField()
    weight = models.PositiveSmallIntegerField()
    photo = models.ImageField(upload_to='profile_photos')
    notification_preferences = models.JSONField(default=dict)
    score = models.PositiveBigIntegerField(default=0)
    streak_days = models.PositiveSmallIntegerField(default=0)

    def __str__(self):
        return f'Profile of {self.user.get_full_name()}'
