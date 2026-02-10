"""
Service layer for notifications.

Handles business logic for creating and sending notifications.
"""
import json
import logging
from typing import Optional, Dict, Any, List
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from pywebpush import webpush, WebPushException

from .models import Notification, PushSubscription, NotificationPreference
from .serializers import NotificationSerializer

logger = logging.getLogger(__name__)


class NotificationTemplates:
    """
    Templates for formatting notification content.
    
    Provides consistent message formatting for different notification types.
    """
    
    @staticmethod
    def for_like(post_id: int, liker_name: str, liker_id: int) -> Dict[str, Any]:
        """Format notification for post like."""
        return {
            'title': 'Nova curtida no seu post',
            'message': f'{liker_name} curtiu seu post',
            'metadata': {
                'post_id': post_id,
                'liker_id': liker_id,
                'liker_name': liker_name
            }
        }
    
    @staticmethod
    def for_comment(post_id: int, commenter_name: str, commenter_id: int, comment_preview: str = '') -> Dict[str, Any]:
        """Format notification for post comment."""
        preview = comment_preview[:50] + '...' if len(comment_preview) > 50 else comment_preview
        return {
            'title': 'Novo comentário no seu post',
            'message': f'{commenter_name} comentou: {preview}' if preview else f'{commenter_name} comentou no seu post',
            'metadata': {
                'post_id': post_id,
                'commenter_id': commenter_id,
                'commenter_name': commenter_name
            }
        }
    
    @staticmethod
    def for_comment_like(comment_id: int, liker_name: str, liker_id: int) -> Dict[str, Any]:
        """Format notification for comment like."""
        return {
            'title': 'Nova curtida no seu comentário',
            'message': f'{liker_name} curtiu seu comentário',
            'metadata': {
                'comment_id': comment_id,
                'liker_id': liker_id,
                'liker_name': liker_name
            }
        }
    
    @staticmethod
    def for_group_invite(group_id: int, group_name: str, inviter_name: str, inviter_id: int) -> Dict[str, Any]:
        """Format notification for group invitation."""
        return {
            'title': 'Convite para grupo',
            'message': f'{inviter_name} convidou você para o grupo "{group_name}"',
            'metadata': {
                'group_id': group_id,
                'group_name': group_name,
                'inviter_id': inviter_id,
                'inviter_name': inviter_name
            }
        }
    
    @staticmethod
    def for_group_accepted(group_id: int, group_name: str, user_name: str, user_id: int) -> Dict[str, Any]:
        """Format notification for group invite acceptance."""
        return {
            'title': 'Convite aceito',
            'message': f'{user_name} aceitou o convite para "{group_name}"',
            'metadata': {
                'group_id': group_id,
                'group_name': group_name,
                'user_id': user_id,
                'user_name': user_name
            }
        }
    
    @staticmethod
    def for_group_promotion(group_id: int, group_name: str) -> Dict[str, Any]:
        """Format notification for admin promotion."""
        return {
            'title': 'Você é admin agora!',
            'message': f'Você foi promovido a administrador do grupo "{group_name}"',
            'metadata': {
                'group_id': group_id,
                'group_name': group_name
            }
        }
    
    @staticmethod
    def for_level_up(new_level: int, points_earned: int = 0) -> Dict[str, Any]:
        """Format notification for level up."""
        return {
            'title': f'Novo nível: {new_level}!',
            'message': f'Parabéns! Você subiu para o nível {new_level}!',
            'metadata': {
                'new_level': new_level,
                'points_earned': points_earned
            }
        }
    
    @staticmethod
    def for_streak(days: int, streak_type: str = 'workout') -> Dict[str, Any]:
        """Format notification for streak milestone."""
        type_label = 'treino' if streak_type == 'workout' else 'refeição'
        return {
            'title': f'Marco de {days} dias!',
            'message': f'Parabéns! Você completou {days} dias consecutivos de {type_label}',
            'metadata': {
                'streak_days': days,
                'streak_type': streak_type
            }
        }
    
    @staticmethod
    def for_workout_reminder() -> Dict[str, Any]:
        """Format notification for workout reminder."""
        return {
            'title': 'Hora do treino!',
            'message': 'Não esqueça de registrar seu treino hoje',
            'metadata': {}
        }
    
    @staticmethod
    def for_meal_reminder() -> Dict[str, Any]:
        """Format notification for meal reminder."""
        return {
            'title': 'Hora da refeição!',
            'message': 'Não esqueça de registrar sua refeição',
            'metadata': {}
        }
    
    @staticmethod
    def for_rank_change(group_id: int, group_name: str, old_rank: int, new_rank: int) -> Dict[str, Any]:
        """Format notification for ranking change."""
        direction = 'subiu' if new_rank < old_rank else 'caiu'
        return {
            'title': f'Mudança no ranking',
            'message': f'Seu ranking {direction} para {new_rank}º em "{group_name}"',
            'metadata': {
                'group_id': group_id,
                'group_name': group_name,
                'old_rank': old_rank,
                'new_rank': new_rank
            }
        }


class NotificationService:
    """
    Service for creating and sending notifications.
    
    Handles the complete notification flow: creation, WebSocket delivery,
    and push notification queueing.
    """
    
    @staticmethod
    def create_notification(
        user: User,
        notification_type: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Notification]:
        """
        Create and send a notification.
        
        Args:
            user: Recipient user
            notification_type: Type of notification (from Notification.TYPE_CHOICES)
            title: Notification title
            message: Notification message
            metadata: Additional data (optional)
        
        Returns:
            Notification instance if created, None if preferences deny it
        """
        # Check user preferences
        try:
            preference = NotificationPreference.objects.get(user=user)
        except NotificationPreference.DoesNotExist:
            # Create default preferences if not exists
            preference = NotificationPreference.objects.create(user=user)
        
        # Check if this notification type is enabled
        if not preference.is_notification_enabled(notification_type):
            logger.info(f'Notification type {notification_type} disabled for user {user.username}')
            return None
        
        # Create notification
        notification = Notification.objects.create(
            recipient=user,
            type=notification_type,
            title=title,
            message=message,
            metadata=metadata or {}
        )
        
        # Send via WebSocket
        NotificationService._send_websocket(notification)
        
        # Queue push notification if enabled and not in quiet hours
        if preference.enable_push and not preference.is_in_quiet_hours():
            # Import here to avoid circular import
            from .tasks import send_push_notification_task
            send_push_notification_task.delay(notification.id)
        
        logger.info(f'Created notification {notification.id} for user {user.username}')
        return notification
    
    @staticmethod
    def _send_websocket(notification: Notification) -> None:
        """
        Send notification via WebSocket.
        
        Args:
            notification: Notification to send
        """
        try:
            channel_layer = get_channel_layer()
            group_name = f'notifications_{notification.recipient.id}'
            
            # Serialize notification
            serializer = NotificationSerializer(notification)
            
            # Send to WebSocket group
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'notification.message',
                    'notification': serializer.data
                }
            )
            logger.debug(f'Sent WebSocket notification to group {group_name}')
        except Exception as e:
            logger.error(f'Failed to send WebSocket notification: {e}')
    
    @staticmethod
    def send_web_push(subscription: PushSubscription, notification_data: Dict[str, Any]) -> bool:
        """
        Send Web Push notification.
        
        Args:
            subscription: PushSubscription to send to
            notification_data: Data to send (title, message, metadata)
        
        Returns:
            True if sent successfully, False otherwise
        """
        if not subscription.active:
            logger.warning(f'Subscription {subscription.id} is inactive')
            return False
        
        # Prepare VAPID claims
        vapid_claims = {
            'sub': f'mailto:{settings.VAPID_ADMIN_EMAIL}'
        }
        
        # Prepare subscription info
        subscription_info = {
            'endpoint': subscription.endpoint,
            'keys': {
                'p256dh': subscription.p256dh_key,
                'auth': subscription.auth_key
            }
        }
        
        try:
            # Send push notification
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(notification_data),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims=vapid_claims
            )
            
            # Update last_used
            subscription.last_used = timezone.now()
            subscription.save(update_fields=['last_used'])
            
            logger.info(f'Sent push notification to subscription {subscription.id}')
            return True
            
        except WebPushException as e:
            logger.error(f'WebPush error for subscription {subscription.id}: {e}')
            
            # Handle 410 Gone - subscription expired
            if e.response and e.response.status_code == 410:
                subscription.active = False
                subscription.save(update_fields=['active'])
                logger.info(f'Deactivated expired subscription {subscription.id}')
            
            return False
        except Exception as e:
            logger.error(f'Unexpected error sending push: {e}')
            return False
    
    @staticmethod
    def get_active_subscriptions(user: User) -> List[PushSubscription]:
        """
        Get all active push subscriptions for a user.
        
        Args:
            user: User to get subscriptions for
        
        Returns:
            List of active PushSubscription instances
        """
        return PushSubscription.objects.filter(user=user, active=True)
    
    @staticmethod
    def mark_as_read(notification_ids: List[int], user: User) -> int:
        """
        Mark notifications as read for a user.
        
        Args:
            notification_ids: List of notification IDs to mark
            user: User who owns the notifications
        
        Returns:
            Number of notifications marked as read
        """
        count = Notification.objects.filter(
            id__in=notification_ids,
            recipient=user,
            read=False
        ).update(
            read=True,
            read_at=timezone.now()
        )
        
        logger.info(f'Marked {count} notifications as read for user {user.username}')
        return count
    
    @staticmethod
    def mark_all_as_read(user: User) -> int:
        """
        Mark all notifications as read for a user.
        
        Args:
            user: User to mark notifications for
        
        Returns:
            Number of notifications marked as read
        """
        count = Notification.objects.filter(
            recipient=user,
            read=False
        ).update(
            read=True,
            read_at=timezone.now()
        )
        
        logger.info(f'Marked all ({count}) notifications as read for user {user.username}')
        return count
    
    @staticmethod
    def get_unread_count(user: User) -> int:
        """
        Get count of unread notifications for a user.
        
        Args:
            user: User to count notifications for
        
        Returns:
            Number of unread notifications
        """
        return Notification.objects.filter(recipient=user, read=False).count()
