import secrets

from django.contrib.auth.models import User
from django.db import models


def invate_code_generator():
    """
    Generate a unique 6-character URL-safe invite code for groups.
    Used for group invitation functionality.
    """
    return secrets.token_urlsafe(6)


class Group(models.Model):
    """
    Model representing a group that users can join and participate in.
    Each group has an owner, invite code, and can have multiple members with different permission levels.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    invite_code = models.CharField(max_length=8, unique=True, editable=False, default=invate_code_generator)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    created_by = models.ForeignKey(User, editable=False, on_delete=models.PROTECT, related_name='group_created_by')
    owner = models.ForeignKey(User, on_delete=models.PROTECT, related_name='group_owner', blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """
        Override save method to automatically add the creator as an admin member
        when a new group is created.
        """
        if not self.pk:  # New group creation
            super().save(*args, **kwargs)
            # Automatically add creator as admin member
            GroupMembers.objects.create(member=self.created_by, joined_at=self.created_at, is_admin=True, group=self)
        else:
            super().save(*args, **kwargs)


class GroupMembers(models.Model):
    """
    Model representing the membership relationship between users and groups.
    Tracks member permissions and join date.
    """
    member = models.ForeignKey(User, on_delete=models.CASCADE, editable=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, editable=False)
    joined_at = models.DateTimeField(auto_now_add=True, editable=False)
    is_admin = models.BooleanField(default=False)

    class Meta:
        unique_together = (('member', 'group'),)  # Ensure one membership per user per group

    def __str__(self):
        return f'Member: {self.member}'
