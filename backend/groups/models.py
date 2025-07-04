import secrets

from django.contrib.auth.models import User
from django.db import models


def invate_code_generator():
    return secrets.token_urlsafe(6)


class GroupMembers(models.Model):
    member = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True, editable=False)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return f'Member: {self.member}'


class Group(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    invite_code = models.CharField(max_length=8, unique=True, editable=False, default=invate_code_generator)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    created_by = models.ForeignKey(User, editable=False, on_delete=models.CASCADE)
    group_members = models.ManyToManyField(GroupMembers)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.pk:
            GroupMembers.objects.create(member=self.created_by, joined_at=self.created_at, is_admin=True)

        super().save(*args, **kwargs)
