"""
Celery tasks for notifications.

Handles asynchronous processing of notifications and scheduled reminders.
"""
import logging
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from django.utils import timezone
from celery import shared_task

from .models import Notification, NotificationPreference
from .services import NotificationService, NotificationTemplates
from .serializers import NotificationSerializer

logger = logging.getLogger(__name__)


@shared_task(name='notifications.tasks.send_push_notification_task')
def send_push_notification_task(notification_id):
    """
    Send push notification to all active subscriptions of the recipient.
    
    Args:
        notification_id: ID of the notification to send
    
    Returns:
        dict: Success count and failure count
    """
    try:
        notification = Notification.objects.get(id=notification_id)
    except Notification.DoesNotExist:
        logger.error(f'Notification {notification_id} not found')
        return {'success': 0, 'failed': 0}
    
    # Get all active subscriptions for the recipient
    subscriptions = NotificationService.get_active_subscriptions(notification.recipient)
    
    if not subscriptions:
        logger.info(f'No active subscriptions for user {notification.recipient.username}')
        return {'success': 0, 'failed': 0}
    
    # Prepare notification data
    serializer = NotificationSerializer(notification)
    notification_data = {
        'title': notification.title,
        'body': notification.message,
        'data': serializer.data,
        'icon': '/icon-192x192.png',  # PWA icon
        'badge': '/badge-72x72.png',  # Badge icon
    }
    
    # Send to all subscriptions
    success_count = 0
    failed_count = 0
    
    for subscription in subscriptions:
        if NotificationService.send_web_push(subscription, notification_data):
            success_count += 1
        else:
            failed_count += 1
    
    # Mark notification as sent if at least one succeeded
    if success_count > 0:
        notification.sent_push = True
        notification.save(update_fields=['sent_push'])
    
    logger.info(
        f'Sent push notification {notification_id}: '
        f'{success_count} success, {failed_count} failed'
    )
    
    return {'success': success_count, 'failed': failed_count}


@shared_task(name='notifications.tasks.send_workout_reminders')
def send_workout_reminders():
    """
    Send workout reminders to users who haven't logged a workout today.
    
    Scheduled by Celery Beat to run daily at 8:00 AM.
    
    Returns:
        int: Number of reminders sent
    """
    try:
        # Import here to avoid circular imports
        from workouts.models import WorkoutCheckin
        
        # Get today's date range
        today = timezone.now().date()
        today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        today_end = timezone.make_aware(datetime.combine(today, datetime.max.time()))
        
        # Get users with reminder enabled
        preferences = NotificationPreference.objects.filter(
            enable_reminders=True
        ).select_related('user')
        
        reminder_count = 0
        
        for preference in preferences:
            user = preference.user
            
            # Check if user has workout today
            has_workout_today = WorkoutCheckin.objects.filter(
                user=user,
                created_at__range=(today_start, today_end)
            ).exists()
            
            if not has_workout_today:
                # Send reminder
                notification_data = NotificationTemplates.for_workout_reminder()
                
                NotificationService.create_notification(
                    user=user,
                    notification_type='reminder',
                    **notification_data
                )
                reminder_count += 1
        
        logger.info(f'Sent {reminder_count} workout reminders')
        return reminder_count
        
    except Exception as e:
        logger.error(f'Error sending workout reminders: {e}')
        return 0


@shared_task(name='notifications.tasks.send_meal_reminders')
def send_meal_reminders():
    """
    Send meal reminders to users who haven't logged a meal today.
    
    Scheduled by Celery Beat to run daily at 12:00 PM and 6:00 PM.
    
    Returns:
        int: Number of reminders sent
    """
    try:
        # Import here to avoid circular imports
        from nutrition.models import Meal
        
        # Get today's date range
        today = timezone.now().date()
        today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        today_end = timezone.make_aware(datetime.combine(today, datetime.max.time()))
        
        # Get users with reminder enabled
        preferences = NotificationPreference.objects.filter(
            enable_reminders=True
        ).select_related('user')
        
        reminder_count = 0
        
        for preference in preferences:
            user = preference.user
            
            # Check if user has meal today
            has_meal_today = Meal.objects.filter(
                user=user,
                created_at__range=(today_start, today_end)
            ).exists()
            
            if not has_meal_today:
                # Send reminder
                notification_data = NotificationTemplates.for_meal_reminder()
                
                NotificationService.create_notification(
                    user=user,
                    notification_type='reminder',
                    **notification_data
                )
                reminder_count += 1
        
        logger.info(f'Sent {reminder_count} meal reminders')
        return reminder_count
        
    except Exception as e:
        logger.error(f'Error sending meal reminders: {e}')
        return 0


@shared_task(name='notifications.tasks.check_group_ranking_changes')
def check_group_ranking_changes():
    """
    Check for significant ranking changes in groups and notify users.
    
    Scheduled by Celery Beat to run daily at 9:00 PM.
    
    Returns:
        int: Number of notifications sent
    """
    try:
        # Import here to avoid circular imports
        from groups.models import Group, GroupMembers
        from django.core.cache import cache
        
        notification_count = 0
        
        # Get all active groups
        groups = Group.objects.all()
        
        for group in groups:
            # Get current rankings
            current_rankings = group.rank()  # Assuming rank() returns ordered list
            
            # Get cached rankings from yesterday
            cache_key = f'group_rankings_{group.id}'
            previous_rankings = cache.get(cache_key, {})
            
            # Compare rankings and notify significant changes
            for i, member_data in enumerate(current_rankings[:10], start=1):  # Top 10
                user_id = member_data.get('user_id') or member_data.get('id')
                current_rank = i
                
                # Check previous rank
                previous_rank = previous_rankings.get(user_id)
                
                if previous_rank and previous_rank != current_rank:
                    # Significant change (moved 2+ positions or entered/left top 3)
                    is_significant = (
                        abs(previous_rank - current_rank) >= 2 or
                        (previous_rank > 3 and current_rank <= 3) or
                        (previous_rank <= 3 and current_rank > 3)
                    )
                    
                    if is_significant:
                        try:
                            user = User.objects.get(id=user_id)
                            notification_data = NotificationTemplates.for_rank_change(
                                group_id=group.id,
                                group_name=group.name,
                                old_rank=previous_rank,
                                new_rank=current_rank
                            )
                            
                            NotificationService.create_notification(
                                user=user,
                                notification_type='rank_change',
                                **notification_data
                            )
                            notification_count += 1
                        except User.DoesNotExist:
                            continue
            
            # Cache current rankings for tomorrow
            new_cache = {
                member_data.get('user_id') or member_data.get('id'): i
                for i, member_data in enumerate(current_rankings[:20], start=1)
            }
            cache.set(cache_key, new_cache, 86400)  # Cache for 24 hours
        
        logger.info(f'Sent {notification_count} rank change notifications')
        return notification_count
        
    except Exception as e:
        logger.error(f'Error checking ranking changes: {e}')
        return 0


@shared_task(name='notifications.tasks.cleanup_old_notifications')
def cleanup_old_notifications():
    """
    Delete old read notifications to keep database clean.
    
    Deletes read notifications older than 30 days.
    Scheduled by Celery Beat to run weekly.
    
    Returns:
        int: Number of notifications deleted
    """
    try:
        # Delete read notifications older than 30 days
        cutoff_date = timezone.now() - timedelta(days=30)
        
        deleted_count, _ = Notification.objects.filter(
            read=True,
            created_at__lt=cutoff_date
        ).delete()
        
        logger.info(f'Deleted {deleted_count} old notifications')
        return deleted_count
        
    except Exception as e:
        logger.error(f'Error cleaning up notifications: {e}')
        return 0
