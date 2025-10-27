from django.contrib.auth.models import User
from django.db import models

from clients.models import Client
from groups.models import Group


class Profile(models.Model):
    """
    User profile model that extends Django's User model with additional information.
    Stores fitness-related data, preferences, and group memberships for each user.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    height = models.PositiveSmallIntegerField(null=True, blank=True)
    weight = models.PositiveSmallIntegerField(null=True, blank=True)
    photo = models.ImageField(upload_to='profile_photos', null=True, blank=True)
    notification_preferences = models.JSONField(default=dict, null=True, blank=True)
    score = models.FloatField(default=0.0)
    level = models.PositiveIntegerField(default=0)
    groups = models.ManyToManyField(Group, blank=True)
    employer = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='employees')

    def __str__(self):
        return f'Profile of {self.user.get_full_name()}'
