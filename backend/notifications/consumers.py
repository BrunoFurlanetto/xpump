"""
WebSocket consumer for real-time notifications.

Handles WebSocket connections and pushes notifications to connected clients.
"""
import logging
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for notifications.
    
    Clients connect to ws://host/ws/notifications/?token=JWT
    and receive real-time notification updates.
    """
    
    async def connect(self):
        """
        Handle WebSocket connection.
        
        Authenticates user via JWT token in query params and
        adds them to their personal notification group.
        """
        # Get token from query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=', 1)[1]
                break
        
        if not token:
            logger.warning('WebSocket connection rejected: No token provided')
            await self.close()
            return
        
        # Authenticate token
        try:
            # Validate JWT token
            UntypedToken(token)
            
            # Get user from token
            user = await self.get_user_from_token(token)
            
            if not user:
                logger.warning('WebSocket connection rejected: Invalid user')
                await self.close()
                return
            
            # Store user in scope
            self.scope['user'] = user
            self.user = user
            
            # Group name for this user's notifications
            self.group_name = f'notifications_{user.id}'
            
            # Join user's notification group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            # Accept connection
            await self.accept()
            
            logger.info(f'WebSocket connected: user {user.username} joined group {self.group_name}')
            
        except (InvalidToken, TokenError) as e:
            logger.warning(f'WebSocket connection rejected: Invalid token - {e}')
            await self.close()
    
    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.
        
        Removes user from their notification group.
        """
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            logger.info(f'WebSocket disconnected: user left group {self.group_name}')
    
    async def notification_message(self, event):
        """
        Handle notification message from group.
        
        Called when NotificationService sends a notification
        to the user's group via channel_layer.group_send().
        
        Args:
            event: Dict with 'type' and 'notification' keys
        """
        # Extract notification data
        notification = event.get('notification', {})
        
        # Send to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': notification
        }))
        
        logger.debug(f'Sent notification to WebSocket: {notification.get("id")}')
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """
        Get user from JWT token.
        
        Args:
            token: JWT token string
        
        Returns:
            User instance or None
        """
        try:
            # Decode token
            from rest_framework_simplejwt.tokens import AccessToken
            
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user
            user = User.objects.get(id=user_id)
            return user
            
        except (InvalidToken, TokenError, User.DoesNotExist, KeyError) as e:
            logger.error(f'Failed to get user from token: {e}')
            return None
