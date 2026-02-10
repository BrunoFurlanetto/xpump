"""
Permission classes for notifications app.
"""
from rest_framework import permissions


class IsNotificationRecipient(permissions.BasePermission):
    """
    Permission to only allow recipients to access their own notifications.
    """
    
    message = 'You can only access your own notifications.'
    
    def has_object_permission(self, request, view, obj):
        """Check if user is the notification recipient."""
        return obj.recipient == request.user


class IsSubscriptionOwner(permissions.BasePermission):
    """
    Permission to only allow users to access their own push subscriptions.
    """
    
    message = 'You can only access your own subscriptions.'
    
    def has_object_permission(self, request, view, obj):
        """Check if user is the subscription owner."""
        return obj.user == request.user
