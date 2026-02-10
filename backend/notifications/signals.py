"""
Signal handlers for notifications.

Listens to events from other apps and creates notifications.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User

# Import models from other apps
from social_feed.models import PostLike, Comment, CommentLike
from groups.models import GroupMembers
from profiles.models import Profile

from .services import NotificationService, NotificationTemplates

logger = logging.getLogger(__name__)


@receiver(post_save, sender=PostLike)
def notify_post_like(sender, instance, created, **kwargs):
    """
    Notify user when their post is liked.
    
    Args:
        sender: PostLike model class
        instance: PostLike instance
        created: True if this is a new like
        kwargs: Additional keyword arguments
    """
    if not created:
        return
    
    # Don't notify if user likes their own post
    if instance.user == instance.post.author:
        return
    
    try:
        # Get liker's profile for display name
        liker = instance.user
        liker_name = getattr(liker.profile, 'display_name', liker.username) if hasattr(liker, 'profile') else liker.username
        
        # Create notification
        notification_data = NotificationTemplates.for_like(
            post_id=instance.post.id,
            liker_name=liker_name,
            liker_id=liker.id
        )
        
        NotificationService.create_notification(
            user=instance.post.author,
            notification_type='social',
            **notification_data
        )
    except Exception as e:
        logger.error(f'Error creating post like notification: {e}')


@receiver(post_save, sender=Comment)
def notify_post_comment(sender, instance, created, **kwargs):
    """
    Notify post author when someone comments.
    
    Args:
        sender: Comment model class
        instance: Comment instance
        created: True if this is a new comment
        kwargs: Additional keyword arguments
    """
    if not created:
        return
    
    # Don't notify if user comments on their own post
    if instance.author == instance.post.author:
        return
    
    try:
        # Get commenter's profile for display name
        commenter = instance.author
        commenter_name = getattr(commenter.profile, 'display_name', commenter.username) if hasattr(commenter, 'profile') else commenter.username
        
        # Create notification
        notification_data = NotificationTemplates.for_comment(
            post_id=instance.post.id,
            commenter_name=commenter_name,
            commenter_id=commenter.id,
            comment_preview=instance.text
        )
        
        NotificationService.create_notification(
            user=instance.post.author,
            notification_type='social',
            **notification_data
        )
    except Exception as e:
        logger.error(f'Error creating comment notification: {e}')


@receiver(post_save, sender=CommentLike)
def notify_comment_like(sender, instance, created, **kwargs):
    """
    Notify user when their comment is liked.
    
    Args:
        sender: CommentLike model class
        instance: CommentLike instance
        created: True if this is a new like
        kwargs: Additional keyword arguments
    """
    if not created:
        return
    
    # Don't notify if user likes their own comment
    if instance.user == instance.comment.author:
        return
    
    try:
        # Get liker's profile for display name
        liker = instance.user
        liker_name = getattr(liker.profile, 'display_name', liker.username) if hasattr(liker, 'profile') else liker.username
        
        # Create notification
        notification_data = NotificationTemplates.for_comment_like(
            comment_id=instance.comment.id,
            liker_name=liker_name,
            liker_id=liker.id
        )
        
        NotificationService.create_notification(
            user=instance.comment.author,
            notification_type='social',
            **notification_data
        )
    except Exception as e:
        logger.error(f'Error creating comment like notification: {e}')


@receiver(post_save, sender=GroupMembers)
def notify_group_events(sender, instance, created, **kwargs):
    """
    Notify users about group events (invites, acceptances, promotions).
    
    Args:
        sender: GroupMembers model class
        instance: GroupMembers instance
        created: True if this is a new membership
        kwargs: Additional keyword arguments
    """
    try:
        # Get inviter info if available
        inviter = instance.invited_by if hasattr(instance, 'invited_by') else None
        inviter_name = None
        inviter_id = None
        
        if inviter:
            inviter_name = getattr(inviter.profile, 'display_name', inviter.username) if hasattr(inviter, 'profile') else inviter.username
            inviter_id = inviter.id
        
        # New invite (pending membership)
        if created and instance.pending:
            if inviter:
                notification_data = NotificationTemplates.for_group_invite(
                    group_id=instance.group.id,
                    group_name=instance.group.name,
                    inviter_name=inviter_name,
                    inviter_id=inviter_id
                )
                
                NotificationService.create_notification(
                    user=instance.user,
                    notification_type='group',
                    **notification_data
                )
        
        # Invite accepted (pending changed from True to False)
        elif not created and not instance.pending:
            # Check if pending was changed (requires tracking in the view/save method)
            # This is a simplified version - you may need to track previous state
            if inviter:
                user_name = getattr(instance.user.profile, 'display_name', instance.user.username) if hasattr(instance.user, 'profile') else instance.user.username
                
                notification_data = NotificationTemplates.for_group_accepted(
                    group_id=instance.group.id,
                    group_name=instance.group.name,
                    user_name=user_name,
                    user_id=instance.user.id
                )
                
                NotificationService.create_notification(
                    user=inviter,
                    notification_type='group',
                    **notification_data
                )
        
        # Admin promotion (is_admin changed to True)
        if not created and instance.is_admin:
            # Check if is_admin was changed (requires tracking)
            # This is simplified - you may need to track previous state
            notification_data = NotificationTemplates.for_group_promotion(
                group_id=instance.group.id,
                group_name=instance.group.name
            )
            
            NotificationService.create_notification(
                user=instance.user,
                notification_type='group',
                **notification_data
            )
    
    except Exception as e:
        logger.error(f'Error creating group notification: {e}')


@receiver(post_save, sender=Profile)
def notify_level_up(sender, instance, created, **kwargs):
    """
    Notify user when they level up.
    
    Args:
        sender: Profile model class
        instance: Profile instance
        created: True if this is a new profile
        kwargs: Additional keyword arguments
    """
    if created:
        return
    
    # Check if level field was updated
    if 'update_fields' in kwargs and kwargs['update_fields']:
        if 'level' not in kwargs['update_fields']:
            return
    
    try:
        # Get previous level from database
        old_profile = Profile.objects.get(pk=instance.pk)
        
        # Check if level increased
        if instance.level > old_profile.level:
            notification_data = NotificationTemplates.for_level_up(
                new_level=instance.level,
                points_earned=instance.xp - old_profile.xp
            )
            
            NotificationService.create_notification(
                user=instance.user,
                notification_type='level_up',
                **notification_data
            )
    except Profile.DoesNotExist:
        # Profile not found in DB (shouldn't happen but handle gracefully)
        pass
    except Exception as e:
        logger.error(f'Error creating level up notification: {e}')
