from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    height = models.PositiveSmallIntegerField(null=True, blank=True)
    weight = models.PositiveSmallIntegerField(null=True, blank=True)
    photo = models.ImageField(upload_to='profile_photos', null=True, blank=True)
    notification_preferences = models.JSONField(default=dict, null=True, blank=True)
    score = models.PositiveBigIntegerField(default=0)
    streak_days = models.PositiveSmallIntegerField(default=0)

    def __str__(self):
        return f'Profile of {self.user.get_full_name()}'
